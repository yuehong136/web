import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { agentAPI } from '@/api/agent'
import { knowledgeAPI } from '@/api/knowledge'
import { APIError } from '@/api/client'
import { setProductLanguage } from '@/locales/i18n'
import { useGenerateState } from '@/pages/knowledge/documents/generate/hooks'
import { GenerateTaskType, generateKeys } from '../use-generate-task'
import { knowledgeKeys } from '../use-knowledge-request'

const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast: notifications }))
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const cleanup: Array<() => Promise<void>> = []
beforeEach(async () => {
  await setProductLanguage('en-US')
  notifications.success.mockReset()
  notifications.error.mockReset()
  vi.spyOn(knowledgeAPI.generate, 'trace').mockImplementation(
    async (_kb, type) => ({
      id: `${type}-task`,
      progress: 0,
      progress_msg: '',
      begin_at: '',
      create_date: '',
      update_date: '',
      process_duration: 0,
      task_type: type,
    }),
  )
})
afterEach(async () => {
  for (const dispose of cleanup.splice(0)) await dispose()
  vi.restoreAllMocks()
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
async function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  let kbId = 'kb-A'
  let value!: ReturnType<typeof useGenerateState>
  function Harness() {
    value = useGenerateState(kbId)
    return null
  }
  async function render() {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
  }
  await render()
  cleanup.push(async () => {
    await act(async () => root.unmount())
    client.clear()
    container.remove()
  })
  return {
    get state() {
      return value
    },
    client,
    async select(id: string) {
      kbId = id
      await render()
    },
  }
}

it.each([GenerateTaskType.GraphRAG, GenerateTaskType.Raptor])(
  'pause %s uses the trace Task ID, preserves products and reports request semantics',
  async (type) => {
    const cancel = vi.spyOn(agentAPI, 'cancelDataflow').mockResolvedValue(true)
    const wipe = vi.spyOn(knowledgeAPI.generate, 'delete').mockResolvedValue({})
    const hook = await mount()
    const id = (
      type === GenerateTaskType.GraphRAG ? hook.state.graph : hook.state.raptor
    ).traceData!.id
    await act(async () => hook.state.handlePause(id, type))
    if (type === GenerateTaskType.GraphRAG) {
      expect(wipe).toHaveBeenCalledExactlyOnceWith('kb-A', 'graph', {
        wipe: false,
        taskId: id,
      })
      expect(cancel).not.toHaveBeenCalled()
    } else {
      expect(cancel).toHaveBeenCalledExactlyOnceWith(id)
      expect(wipe).not.toHaveBeenCalled()
    }
    expect(notifications.success).toHaveBeenCalledOnce()
    expect(notifications.success.mock.calls[0]?.[0]).toMatch(
      /Stop requested for .* Waiting for the task to respond/,
    )
  },
)

it('failure uses fixed copy, invalidates the original KB and does not claim success', async () => {
  vi.spyOn(knowledgeAPI.generate, 'delete').mockRejectedValue(
    new APIError(200, '109', 'private raw denial'),
  )
  const hook = await mount()
  const invalidations = vi.spyOn(hook.client, 'invalidateQueries')
  await act(async () =>
    hook.state.handlePause('graph-task', GenerateTaskType.GraphRAG),
  )
  expect(notifications.success).not.toHaveBeenCalled()
  expect(notifications.error).toHaveBeenCalledOnce()
  expect(JSON.stringify(notifications.error.mock.calls)).not.toContain(
    'private',
  )
  for (const key of [
    generateKeys.trace('kb-A', GenerateTaskType.GraphRAG),
    knowledgeKeys.graph('kb-A'),
    knowledgeKeys.detail('kb-A'),
  ])
    expect(invalidations).toHaveBeenCalledWith({ queryKey: key })
})

it.each(['KB-switch', 'new-run', 'trace-change'] as const)(
  'late pause feedback is ignored after %s; missing ID and repeated clicks do not cancel twice',
  async (change) => {
    const ack = deferred<Record<string, never>>()
    const cancel = vi
      .spyOn(knowledgeAPI.generate, 'delete')
      .mockReturnValueOnce(ack.promise)
    vi.spyOn(knowledgeAPI.generate, 'run').mockResolvedValue({
      task_id: 'new-task',
    })
    const hook = await mount()
    let pending!: Promise<void>
    await act(async () => {
      await hook.state.handlePause('', GenerateTaskType.GraphRAG)
      pending = hook.state.handlePause('graph-task', GenerateTaskType.GraphRAG)
      await hook.state.handlePause('graph-task', GenerateTaskType.GraphRAG)
    })
    expect(cancel).toHaveBeenCalledExactlyOnceWith('kb-A', 'graph', {
      wipe: false,
      taskId: 'graph-task',
    })
    if (change === 'KB-switch') await hook.select('kb-B')
    if (change === 'new-run')
      await act(async () => hook.state.handleRun(GenerateTaskType.GraphRAG))
    if (change === 'trace-change')
      await act(async () =>
        hook.client.setQueryData(
          generateKeys.trace('kb-A', GenerateTaskType.GraphRAG),
          { id: 'new-task', progress: 0 },
        ),
      )
    if (change === 'trace-change')
      await vi.waitFor(async () => {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5))
        })
        expect(hook.state.graph.traceData?.id).toBe('new-task')
      })
    notifications.success.mockClear()
    notifications.error.mockClear()
    await act(async () => {
      ack.reject(new Error('private late'))
      await pending
    })
    expect(notifications.success).not.toHaveBeenCalled()
    expect(notifications.error).not.toHaveBeenCalled()
  },
)

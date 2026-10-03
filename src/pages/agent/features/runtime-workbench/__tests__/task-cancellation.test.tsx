import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { useAgentRuntimeWorkbench } from '../hooks/use-agent-runtime-workbench'
import { usePipelineWorkbench } from '../../pipeline-workbench/hooks/use-pipeline-workbench'
import { AgentRuntimeStatus, RuntimeWorkbenchView } from '../types'
import {
  PipelineRuntimeStatus,
  PipelineWorkbenchView,
} from '../../pipeline-workbench/types'

const mocks = vi.hoisted(() => ({
  runAgent: vi.fn(),
  cancelTask: vi.fn(),
  cancelDataflow: vi.fn(),
  fetchTrace: vi.fn(),
  saveGraph: vi.fn(),
  refetch: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}))
vi.mock('@/api/agent', () => ({ agentAPI: mocks }))
vi.mock('@/lib/toast', () => ({ toast: mocks }))
vi.mock('@/hooks/use-agent-request', async (original) => ({
  ...(await original<typeof import('@/hooks/use-agent-request')>()),
  useFetchAgent: () => ({ agent: { title: 'test' } }),
  useFetchAgentSessions: () => ({
    data: { sessions: [] },
    refetch: mocks.refetch,
  }),
}))
vi.mock('../../../hooks/use-save-graph', () => ({
  useSaveGraph: () => ({ saveGraph: mocks.saveGraph, loading: false }),
}))
vi.mock('../../../hooks/use-get-begin-query', () => ({
  useGetBeginNodeDataInputs: () => [],
  useIsTaskMode: () => false,
}))
vi.mock('../../../store', () => ({
  default: (selector: (state: unknown) => unknown) =>
    selector({
      getNode: () => ({ data: { form: { inputs: {} } } }),
      findNodeByName: () => ({}),
      updateNodeForm: () => {},
    }),
}))
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function stream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  return {
    response: new Response(
      new ReadableStream<Uint8Array>({
        start(value) {
          controller = value
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    ),
    emit(value: unknown) {
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`),
      )
    },
    end() {
      controller.close()
    },
  }
}
const cleanups: Array<() => Promise<void>> = []
beforeEach(async () => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.saveGraph.mockResolvedValue(true)
  mocks.cancelTask.mockResolvedValue(true)
  mocks.cancelDataflow.mockResolvedValue(true)
  mocks.fetchTrace.mockResolvedValue([])
  await setProductLanguage('en-US')
})
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup()
})
async function mountWorkbench(pipeline = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  let canvasId = 'canvas-A'
  let runtime!: ReturnType<typeof useAgentRuntimeWorkbench>
  let dataflow!: ReturnType<typeof usePipelineWorkbench>
  function Agent() {
    runtime = useAgentRuntimeWorkbench({
      canvasId,
      currentView: RuntimeWorkbenchView.CONVERSATION,
      onViewChange: () => {},
    })
    return null
  }
  function Pipeline() {
    dataflow = usePipelineWorkbench({
      canvasId,
      currentView: PipelineWorkbenchView.LOG,
      onViewChange: () => {},
    })
    return null
  }
  async function render() {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <QueryClientProvider client={client}>
            {pipeline ? <Pipeline /> : <Agent />}
          </QueryClientProvider>
        </MemoryRouter>,
      ),
    )
  }
  await render()
  cleanups.push(async () => {
    await act(async () => root.unmount())
    client.clear()
    container.remove()
  })
  return {
    get runtime() {
      return runtime
    },
    get pipeline() {
      return dataflow
    },
    async select(id: string) {
      canvasId = id
      await render()
    },
    async start() {
      let pending!: Promise<void>
      await act(async () => {
        pending = pipeline
          ? dataflow.handleRun([])
          : runtime.handleSendMessage({ content: 'question' })
        await Promise.resolve()
      })
      return { pending }
    },
  }
}

it('runtime clears the previous task ID before frames; stop never cancels the previous run', async () => {
  const hook = await mountWorkbench()
  const old = stream()
  mocks.runAgent.mockResolvedValueOnce(old.response)
  const first = await hook.start()
  await act(async () => {
    old.emit({
      event: 'node_started',
      task_id: 'old-task',
      message_id: 'old-message',
      data: { component_id: 'begin' },
    })
    old.end()
    await first.pending
  })
  expect(hook.runtime.latestTaskId).toBe('old-task')
  const current = stream()
  mocks.runAgent.mockResolvedValueOnce(current.response)
  const next = await hook.start()
  expect(hook.runtime.latestTaskId).toBe('')
  await act(async () => hook.runtime.handleStop())
  expect(mocks.cancelTask).not.toHaveBeenCalled()
  expect(hook.runtime.status).toBe(AgentRuntimeStatus.STOPPED)
  await act(async () => {
    current.end()
    await next.pending
  })
  expect(hook.runtime.status).toBe(AgentRuntimeStatus.STOPPED)
})

it('completed runtime wins over stop, while pipeline stop before the response only detaches', async () => {
  const agent = await mountWorkbench()
  const body = stream()
  mocks.runAgent.mockResolvedValueOnce(body.response)
  const run = await agent.start()
  await act(async () => {
    body.emit({ event: 'message_end', task_id: 'completed-task', data: {} })
    body.end()
    await run.pending
    await agent.runtime.handleStop()
  })
  expect(agent.runtime.status).toBe(AgentRuntimeStatus.SUCCESS)
  expect(mocks.cancelTask).not.toHaveBeenCalled()
  const pipeline = await mountWorkbench(true)
  const response = deferred<Response>()
  mocks.runAgent.mockReturnValueOnce(response.promise)
  const queued = await pipeline.start()
  await act(async () => pipeline.pipeline.handleCancel())
  expect(pipeline.pipeline.status).toBe(PipelineRuntimeStatus.STOPPED)
  expect(mocks.cancelDataflow).not.toHaveBeenCalled()
  await act(async () => {
    response.resolve(Response.json({ data: { message_id: 'late-queue-task' } }))
    await queued.pending
  })
  expect(pipeline.pipeline.lastTaskId).toBeUndefined()
  expect(pipeline.pipeline.status).toBe(PipelineRuntimeStatus.STOPPED)
})

it.each(['runtime', 'pipeline'] as const)(
  '%s uses its actual task ID and shows a safe cancel error only once',
  async (kind) => {
    const pipeline = kind === 'pipeline'
    const hook = await mountWorkbench(pipeline)
    const body = stream()
    mocks.runAgent.mockResolvedValueOnce(
      pipeline
        ? Response.json({ data: { message_id: 'queue-task' } })
        : body.response,
    )
    const run = await hook.start()
    if (pipeline) await act(async () => run.pending)
    else
      await act(async () =>
        body.emit({
          event: 'message',
          task_id: 'sse-task',
          message_id: 'different-message',
          data: { content: 'prefix' },
        }),
      )
    const cancel = pipeline ? mocks.cancelDataflow : mocks.cancelTask
    cancel.mockRejectedValue(new Error('private provider/redis details'))
    const stop = () =>
      pipeline ? hook.pipeline.handleCancel() : hook.runtime.handleStop()
    await act(async () => {
      await stop()
      await stop()
    })
    expect(cancel).toHaveBeenCalledExactlyOnceWith(
      pipeline ? 'queue-task' : 'sse-task',
    )
    expect(pipeline ? hook.pipeline.lastError : hook.runtime.lastError).toBe(
      'Stopped receiving output. The cancellation request failed. Try again later.',
    )
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(
      'Stopped receiving output. The cancellation request failed. Try again later.',
    )
    if (!pipeline)
      await act(async () => {
        body.end()
        await run.pending
      })
  },
)

it.each(['runtime', 'pipeline'] as const)(
  '%s late cancellation success/failure cannot change a new run, reset or canvas',
  async (kind) => {
    for (const outcome of ['resolve', 'reject'] as const)
      for (const change of ['new', 'reset', 'canvas'] as const) {
        const pipeline = kind === 'pipeline'
        const hook = await mountWorkbench(pipeline)
        const old = stream()
        mocks.runAgent.mockResolvedValueOnce(
          pipeline
            ? Response.json({ data: { message_id: 'old-task' } })
            : old.response,
        )
        const run = await hook.start()
        if (pipeline) await act(async () => run.pending)
        else
          await act(async () =>
            old.emit({
              event: 'message',
              task_id: 'old-task',
              data: { content: 'old' },
            }),
          )
        const ack = deferred<boolean>()
        ;(pipeline
          ? mocks.cancelDataflow
          : mocks.cancelTask
        ).mockReturnValueOnce(ack.promise)
        let stopped!: Promise<void>
        await act(async () => {
          stopped = pipeline
            ? hook.pipeline.handleCancel()
            : hook.runtime.handleStop()
          await Promise.resolve()
        })
        let next: Awaited<ReturnType<typeof hook.start>> | undefined
        const current = stream()
        if (change === 'new') {
          mocks.runAgent.mockResolvedValueOnce(
            pipeline
              ? Response.json({ data: { message_id: 'new-task' } })
              : current.response,
          )
          next = await hook.start()
          if (pipeline) await act(async () => next!.pending)
        }
        if (change === 'reset')
          await act(async () =>
            pipeline ? hook.pipeline.handleReset() : hook.runtime.handleReset(),
          )
        if (change === 'canvas') await hook.select('canvas-B')
        mocks.error.mockClear()
        const status = pipeline ? hook.pipeline.status : hook.runtime.status
        const error = pipeline
          ? hook.pipeline.lastError
          : hook.runtime.lastError
        await act(async () => {
          if (outcome === 'resolve') ack.resolve(true)
          else ack.reject(new Error('private late'))
          await stopped
          if (!pipeline) {
            old.end()
            await run.pending
          }
        })
        expect(pipeline ? hook.pipeline.status : hook.runtime.status).toBe(
          status,
        )
        expect(
          pipeline ? hook.pipeline.lastError : hook.runtime.lastError,
        ).toBe(error)
        expect(mocks.error).not.toHaveBeenCalled()
        if (next && !pipeline)
          await act(async () => {
            current.end()
            await next!.pending
          })
      }
  },
)

it.each(['en-US', 'zh-CN'] as const)(
  'editor shows delegation refusal safely in %s',
  async (language) => {
    await setProductLanguage(language)
    const hook = await mountWorkbench()
    mocks.runAgent.mockResolvedValueOnce(
      Response.json(
        {
          retcode: 104,
          data: false,
          error_code: 'context_required',
          retmsg: 'private origin detail',
        },
        { status: 403 },
      ),
    )
    const run = await hook.start()
    await act(async () => run.pending)
    expect(hook.runtime.lastError).toBe(
      language === 'en-US'
        ? 'This session has no verified execution source. Start a new session to use delegated tools.'
        : '本会话缺少已验证的执行来源，请新建会话使用委托工具。',
    )
    expect(hook.runtime.status).toBe(AgentRuntimeStatus.ERROR)
  },
)

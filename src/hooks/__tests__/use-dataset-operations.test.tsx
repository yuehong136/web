import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { knowledgeAPI } from '@/api/knowledge'
import { agentAPI } from '@/api/agent'
import { useRunDocument, documentKeys } from '../use-document-request'
import {
  GenerateTaskType,
  usePauseKnowledgeTask,
  useUnbindKnowledgeTask,
} from '../use-generate-task'
import { LogStatsCards } from '@/pages/knowledge/logs/LogStatsCards'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))
const clients: QueryClient[] = []
const roots: ReturnType<typeof createRoot>[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  clients.splice(0).forEach((client) => client.clear())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
async function mountHook<T>(hook: () => T) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  clients.push(client)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  let value: T
  function Harness() {
    value = hook()
    return null
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    ),
  )
  return { current: () => value!, client }
}

it('refreshes document lists after a partially executed batch rejects', async () => {
  const failure = new APIError(200, '102', 'partial', { success_count: 1 })
  vi.spyOn(knowledgeAPI.document, 'parse').mockRejectedValue(failure)
  const hook = await mountHook(() => useRunDocument('kb'))
  const invalidate = vi.spyOn(hook.client, 'invalidateQueries')
  await act(async () => {
    await expect(
      hook.current().runDocument({ docIds: ['valid', 'missing'], run: 1 }),
    ).rejects.toBe(failure)
  })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: documentKeys.lists() })
})

it('pause only cancels; explicit delete clears the selected index', async () => {
  const cancel = vi.spyOn(agentAPI, 'cancelDataflow').mockResolvedValue(true)
  const wipe = vi.spyOn(knowledgeAPI.generate, 'delete').mockResolvedValue({})
  const pause = await mountHook(usePauseKnowledgeTask)
  await act(async () => {
    await pause.current().pauseTask({
      kbId: 'kb',
      taskId: 'task',
      type: GenerateTaskType.GraphRAG,
    })
  })
  expect(cancel).toHaveBeenCalledWith('task')
  expect(wipe).not.toHaveBeenCalled()
  const remove = await mountHook(useUnbindKnowledgeTask)
  await act(async () => {
    await remove
      .current()
      .unbindTask({ kbId: 'kb', type: GenerateTaskType.GraphRAG })
  })
  expect(wipe).toHaveBeenCalledWith('kb', 'graph')
})

it('summary cards render document and parse counts, never invented download statistics', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  await act(async () =>
    root.render(
      <LogStatsCards
        summary={{
          doc_num: 9,
          chunk_num: 20,
          token_num: 300,
          status: {
            unstart_count: 1,
            running_count: 2,
            cancel_count: 1,
            done_count: 4,
            fail_count: 1,
          },
        }}
      />,
    ),
  )
  expect(container.textContent).toContain('knowledge.logs.stats.totalFiles')
  expect(container.textContent).toContain('knowledge.list.stats.totalChunks')
  expect(container.textContent).not.toContain('downloading')
  expect(container.textContent).toContain('20')
  await act(async () => root.render(<LogStatsCards />))
  expect(container.textContent).toBe('')
})

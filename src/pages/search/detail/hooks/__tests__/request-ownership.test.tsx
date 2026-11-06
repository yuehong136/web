import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { knowledgeAPI } from '@/api/knowledge'
import { conversationAPI } from '@/api/conversation'
import { SearchExecutionPhase, type SearchApp } from '@/types/search'
import { useSearchExecution } from '../useSearchExecution'

const app = (id: string): SearchApp => ({
  id,
  tenant_id: `tenant-${id}`,
  name: id,
  create_time: 0,
  update_time: 0,
  search_config: {
    kb_ids: [`kb-${id}`],
    similarity_threshold: 0.2,
    vector_similarity_weight: 0.3,
    top_k: 8,
    summary: false,
    related_search: true,
    use_rerank: false,
    use_kg: false,
  },
})
const empty = { total: 0, chunks: [], doc_aggs: [], labels: {} }
function deferred() {
  let resolve!: (value: typeof empty) => void
  let reject!: (error: Error) => void
  const promise = new Promise<typeof empty>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
let root: Root
let container: HTMLDivElement
let current: ReturnType<typeof useSearchExecution>
function Surface({ value }: { value: SearchApp }) {
  const execution = useSearchExecution(value)
  useEffect(() => {
    current = execution
  }, [execution])
  return null
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(conversationAPI, 'generateRelatedQuestions').mockResolvedValue([])
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('stopping retrieval keeps the stopped result after a late response and skips follow-up work', async () => {
  const response = deferred()
  vi.spyOn(knowledgeAPI.retrievalTest, 'test').mockReturnValue(response.promise)
  await act(async () => root.render(<Surface value={app('A')} />))
  let pending!: Promise<void>
  await act(async () => {
    pending = current.search('Question')
  })
  await act(async () => current.stop())
  await act(async () => {
    response.resolve(empty)
    await pending
  })
  expect(current.phase).toBe(SearchExecutionPhase.STOPPED)
  expect(current.turns[0].phase).toBe(SearchExecutionPhase.STOPPED)
  expect(current.turns[0].isStreaming).toBe(false)
  expect(conversationAPI.generateRelatedQuestions).not.toHaveBeenCalled()
})

it('a late rejection from the previous app cannot reset the new app run', async () => {
  const old = deferred()
  const next = deferred()
  vi.spyOn(knowledgeAPI.retrievalTest, 'test')
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(next.promise)
  await act(async () => root.render(<Surface value={app('A')} />))
  let first!: Promise<void>
  await act(async () => {
    first = current.search('Old question')
  })
  await act(async () => root.render(<Surface value={app('B')} />))
  expect(current.turns).toHaveLength(0)
  let second!: Promise<void>
  await act(async () => {
    second = current.search('New question')
  })
  await act(async () => {
    old.reject(new Error('private old failure'))
    await first
  })
  expect(current.phase).toBe(SearchExecutionPhase.RETRIEVING)
  expect(current.turns.map((turn) => turn.query)).toEqual(['New question'])
  await act(async () => {
    next.resolve(empty)
    await second
  })
  expect(current.phase).toBe(SearchExecutionPhase.COMPLETE)
  expect(JSON.stringify(current.turns)).not.toContain('private old failure')
})

it('clearing a pending run cannot repopulate results when retrieval later finishes', async () => {
  const response = deferred()
  vi.spyOn(knowledgeAPI.retrievalTest, 'test').mockReturnValue(response.promise)
  await act(async () => root.render(<Surface value={app('A')} />))
  let pending!: Promise<void>
  await act(async () => {
    pending = current.search('Question')
  })
  await act(async () => current.clear())
  await act(async () => {
    response.resolve(empty)
    await pending
  })
  expect(current.turns).toEqual([])
  expect(current.phase).toBe(SearchExecutionPhase.IDLE)
  expect(conversationAPI.generateRelatedQuestions).not.toHaveBeenCalled()
})

it('Top is independent of candidate top_k, survives source changes and new rounds, and refines retrieval only', async () => {
  const docs = [
    { doc_id: 'doc-a', doc_name: 'A', count: 34 },
    { doc_id: 'doc-b', doc_name: 'B', count: 37 },
  ]
  const test = vi
    .spyOn(knowledgeAPI.retrievalTest, 'test')
    .mockResolvedValue({ ...empty, total: 71, doc_aggs: docs })
  await act(async () => root.render(<Surface value={app('A')} />))
  await act(async () => current.search('Question'))
  const id = current.turns[0].id
  expect(test.mock.calls[0][0]).toMatchObject({
    page: 1,
    size: 10,
    top_k: 8,
    search_id: 'A',
  })
  expect(current.turns[0].total).toBe(71)
  await act(async () => current.retrieval.refine(id, { size: 50 }))
  await act(async () => current.retrieval.refine(id, { docIds: ['doc-b'] }))
  expect(test.mock.calls.at(-1)?.[0]).toMatchObject({
    page: 1,
    size: 50,
    top_k: 8,
    doc_ids: ['doc-b'],
    search_id: 'A',
    question: 'Question',
  })
  expect(conversationAPI.generateRelatedQuestions).toHaveBeenCalledTimes(1)
  await act(async () => current.retrieval.refine(id, { docIds: null }))
  expect(test.mock.calls.at(-1)?.[0]).toMatchObject({ size: 50, doc_ids: null })
  const before = test.mock.calls.length
  await act(async () => current.retrieval.refine(id, { docIds: [] }))
  expect(test).toHaveBeenCalledTimes(before)
  expect(current.turns[0].total).toBe(0)
  await act(async () => current.search('Next question'))
  expect(test.mock.calls.at(-1)?.[0]).toMatchObject({
    size: 50,
    doc_ids: null,
    top_k: 8,
  })
})

it('a late Top response cannot overwrite a newer source selection and failures retry the exact submitted request', async () => {
  const old = deferred()
  const test = vi
    .spyOn(knowledgeAPI.retrievalTest, 'test')
    .mockResolvedValueOnce(empty)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ ...empty, total: 37 })
    .mockRejectedValueOnce(new Error('private credentials'))
    .mockResolvedValue(empty)
  await act(async () => root.render(<Surface value={app('A')} />))
  await act(async () => current.search('Question'))
  const id = current.turns[0].id
  let pending!: Promise<void>
  await act(async () => {
    pending = current.retrieval.refine(id, { size: 20 })
  })
  const oldSignal = test.mock.calls[1][1]?.signal
  await act(async () => current.retrieval.refine(id, { docIds: ['chosen'] }))
  expect(oldSignal?.aborted).toBe(true)
  await act(async () => {
    old.resolve({ ...empty, total: 999 })
    await pending
  })
  expect(current.turns[0].total).toBe(37)
  await act(async () => current.retrieval.refine(id, { size: 100 }))
  expect(current.retrieval.errors[id]).toBe(true)
  expect(JSON.stringify(current.turns)).not.toContain('private credentials')
  const failed = test.mock.calls.at(-1)?.[0]
  await act(async () => current.retrieval.refine(id, {}))
  expect(test.mock.calls.at(-1)?.[0]).toEqual(failed)
  expect(current.retrieval.errors[id]).toBe(false)
})

it('clearing or changing apps aborts refinement ownership and resets its selected Top', async () => {
  const old = deferred()
  const test = vi
    .spyOn(knowledgeAPI.retrievalTest, 'test')
    .mockResolvedValueOnce(empty)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValue(empty)
  await act(async () => root.render(<Surface value={app('A')} />))
  await act(async () => current.search('Question'))
  let pending!: Promise<void>
  await act(async () => {
    pending = current.retrieval.refine(current.turns[0].id, { size: 100 })
  })
  const signal = test.mock.calls[1][1]?.signal
  await act(async () => root.render(<Surface value={app('B')} />))
  expect(signal?.aborted).toBe(true)
  await act(async () => {
    old.resolve({ ...empty, total: 999 })
    await pending
  })
  expect(current.turns).toEqual([])
  await act(async () => current.search('New question'))
  expect(test.mock.calls.at(-1)?.[0]).toMatchObject({
    size: 10,
    search_id: 'B',
  })
  await act(async () => current.clear())
  expect(current.retrieval.sizes).toEqual({})
})

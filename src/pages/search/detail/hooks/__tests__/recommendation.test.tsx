import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { knowledgeAPI } from '@/api/knowledge'
import { SearchExecutionPhase, type SearchApp } from '@/types/search'
import SearchRelatedQuestions from '../../components/search-related-questions'
import { useSearchExecution } from '../useSearchExecution'

const app: SearchApp = {
  id: 'search-1',
  name: 'Search',
  tenant_id: 'tenant-1',
  create_time: 0,
  update_time: 0,
  search_config: {
    kb_ids: ['kb-1'],
    similarity_threshold: 0.2,
    vector_similarity_weight: 0.3,
    top_k: 8,
    summary: false,
    related_search: true,
    use_rerank: false,
    use_kg: false,
  },
}
let root: Root
let container: HTMLDivElement
let execution: ReturnType<typeof useSearchExecution>
let response: unknown
let calls: URL[]
let selected: string[]
function Surface() {
  const current = useSearchExecution(app)
  useEffect(() => {
    execution = current
  }, [current])
  const turn = current.turns.at(-1)
  return (
    <>
      <output>{current.phase}</output>
      {turn && !turn.isStreaming && (
        <SearchRelatedQuestions
          questions={turn.relatedQuestions}
          onSelect={(value) => selected.push(value)}
        />
      )}
    </>
  )
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  response = { code: 0, data: ['Next question?', 'More detail?'] }
  calls = []
  selected = []
  vi.spyOn(knowledgeAPI.retrievalTest, 'test').mockResolvedValue({
    total: 0,
    chunks: [],
    doc_aggs: [],
    labels: {},
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      calls.push(new URL(String(input)))
      return new Response(JSON.stringify(response), {
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root.render(<Surface />))
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('the active search consumer displays returned questions and forwards the selected question', async () => {
  await act(async () => execution.search('Question?'))
  expect(calls.map((url) => url.pathname)).toEqual([
    '/api/v1/chat/recommendation',
  ])
  expect(execution.phase).toBe(SearchExecutionPhase.COMPLETE)
  const button = container.querySelector('button')!
  expect(button.textContent).toBe('Next question?')
  expect(button.type).toBe('button')
  await act(async () => button.click())
  expect(selected).toEqual(['Next question?'])
})
it.each([
  { code: 102, message: 'private backend failure', data: null },
  { code: 0, data: [42] },
])(
  'an invalid recommendation leaves the completed search usable without fake questions',
  async (body) => {
    response = body
    await act(async () => execution.search('Question?'))
    expect(execution.phase).toBe(SearchExecutionPhase.COMPLETE)
    expect(execution.turns[0].relatedQuestions).toEqual([])
    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).not.toContain('private backend failure')
  },
)

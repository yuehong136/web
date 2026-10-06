import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { knowledgeAPI } from '@/api/knowledge'
import i18n, { setProductLanguage } from '@/locales/i18n'
import { SearchExecutionPhase, type SearchApp } from '@/types/search'
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
    summary: true,
    related_search: false,
    use_rerank: false,
    use_kg: false,
  },
}
let execution: ReturnType<typeof useSearchExecution>
let root: Root
let container: HTMLDivElement
let frames: unknown[]

function Surface() {
  const current = useSearchExecution(app)
  useEffect(() => {
    execution = current
  }, [current])
  return null
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  vi.spyOn(knowledgeAPI.retrievalTest, 'test').mockResolvedValue({
    total: 0,
    chunks: [],
    doc_aggs: [],
    labels: {},
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(''),
          { headers: { 'content-type': 'text/event-stream' } },
        ),
    ),
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

it('keeps the summary generated before an error frame and shows a fixed notice', async () => {
  frames = [
    { retcode: 0, data: { answer: '摘要前半', reference: {} } },
    {
      retcode: 500,
      retmsg: 'private backend failure',
      data: { answer: '**ERROR**: private backend failure', reference: [] },
    },
    { retcode: 0, data: true },
  ]

  await act(async () => execution.search('Question?'))

  const [turn] = execution.turns
  expect(execution.phase).toBe(SearchExecutionPhase.ERROR)
  expect(turn.summary).toBe('摘要前半')
  expect(turn.errorMessage).toBe(i18n.t('chat.stream.interrupted'))
  expect(JSON.stringify(turn)).not.toContain('private backend failure')
})

it('shows the final summary with inserted citations once', async () => {
  frames = [
    { retcode: 0, data: { answer: 'Pandas 是', reference: {}, final: false } },
    {
      retcode: 0,
      data: { answer: '数据分析库。', reference: {}, final: false },
    },
    {
      retcode: 0,
      data: {
        answer: 'Pandas 是数据分析库 ##0$$。',
        reference: {},
        final: true,
      },
    },
    { retcode: 0, data: true },
  ]

  await act(async () => execution.search('Question?'))

  const [turn] = execution.turns
  expect(execution.phase).toBe(SearchExecutionPhase.COMPLETE)
  expect(turn.summary).toBe('Pandas 是数据分析库 ##0$$。')
  expect(turn.errorMessage).toBeUndefined()
})

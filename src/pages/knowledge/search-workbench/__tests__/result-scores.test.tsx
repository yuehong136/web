import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { toRetrievalResultViewList } from '../adapters/retrieval-result'
import { ResultPanel } from '../result-panel'
import { ResultPreviewModal } from '../result-preview-modal'
import type { RetrievalResult, RetrievalResultView } from '../types'

const chunk = (
  id: string,
  scores: Pick<
    RetrievalResult,
    'similarity' | 'vector_similarity' | 'term_similarity'
  >,
): RetrievalResult => ({
  chunk_id: id,
  text: `Passage ${id}`,
  doc_id: 'doc',
  docnm_kwd: 'HarnessX.html',
  kb_id: 'kb',
  ...scores,
})

// 第二条没有向量 / 词汇分，第三条全是真实 0，第四条的综合分被 PageRank 推过 1
const [valid, partial, zero, boosted] = toRetrievalResultViewList([
  chunk('valid', {
    similarity: 0.9,
    vector_similarity: 0.824,
    term_similarity: 0.5,
  }),
  chunk('partial', {
    similarity: 0.61,
    vector_similarity: null,
    term_similarity: null,
  }),
  chunk('zero', { similarity: 0, vector_similarity: 0, term_similarity: 0 }),
  chunk('boosted', {
    similarity: 10.62,
    vector_similarity: 0.7,
    term_similarity: 0.4,
  }),
])

let root: Root
let container: HTMLDivElement

const renderPanel = (results: RetrievalResultView[]) =>
  act(async () =>
    root.render(
      <ResultPanel
        hasSearched
        docOptions={[]}
        onRetry={vi.fn()}
        onOpenConfig={vi.fn()}
        isSearching={false}
        results={results}
        totalResults={results.length}
        docAggs={[]}
        selectedDocIds={[]}
        showDocFilter={false}
        highlight={false}
        currentPage={1}
        pageSize={20}
        totalPages={1}
        pageNumbers={[1]}
        onToggleDocFilter={vi.fn()}
        onDocFilter={vi.fn()}
        onClearDocFilter={vi.fn()}
        onSelectAllDocs={vi.fn()}
        onOpenResultPreview={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    ),
  )

const cards = () =>
  [...container.querySelectorAll('article')].map((card) => card.textContent)

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('retrieval test scores', () => {
  it('shows missing scores as unavailable and keeps a real zero', async () => {
    await renderPanel([valid, partial, zero, boosted])
    const [validCard, partialCard, zeroCard, boostedCard] = cards()

    expect(validCard).toContain('Combined 90.0%')
    expect(validCard).toContain('Vector 82.4%')
    expect(validCard).toContain('Text 50.0%')
    expect(partialCard).toContain('Combined 61.0%')
    expect(partialCard).toContain('Vector Unavailable')
    expect(partialCard).toContain('Text Unavailable')
    expect(partialCard).not.toContain('0.0%')
    expect(zeroCard).toContain('Combined 0.0%')
    expect(zeroCard).toContain('Vector 0.0%')
    expect(zeroCard).toContain('Text 0.0%')
    expect(zeroCard).not.toContain('Unavailable')
    expect(boostedCard).toContain('Combined Unavailable')
    expect(boostedCard).not.toContain('100.0%')
    expect(container.textContent).toContain(
      '“Unavailable” means retrieval returned no valid score',
    )
  })

  it('keeps the retrieval order and explains nothing when every score is valid', async () => {
    await renderPanel([zero, valid])
    const ids = [...container.querySelectorAll('article')].map(
      (card) => card.querySelector('p')?.textContent,
    )
    expect(ids).toEqual(['ID: zero', 'ID: valid'])
    expect(container.textContent).not.toContain('Unavailable')
  })

  it('uses the Chinese copy for unavailable scores', async () => {
    await setProductLanguage('zh-CN')
    await renderPanel([partial])
    expect(cards()[0]).toContain('综合 61.0%')
    expect(cards()[0]).toContain('向量 不可用')
    expect(cards()[0]).toContain('文本 不可用')
    expect(container.textContent).toContain('“不可用”表示检索没有返回')
  })

  it('the preview dialog distinguishes unavailable from zero', async () => {
    const renderPreview = (result: RetrievalResultView) =>
      act(async () =>
        root.render(
          <ResultPreviewModal
            result={result}
            highlightEnabled={false}
            isMarkdownPreview={false}
            onTogglePreview={vi.fn()}
            onClose={vi.fn()}
          />,
        ),
      )

    await renderPreview(partial)
    let dialog = document.querySelector('dialog')?.textContent
    expect(dialog).toContain('Combined similarity: 61.0%')
    expect(dialog).toContain('Vector: Unavailable')
    expect(dialog).toContain('Text: Unavailable')

    await renderPreview(zero)
    dialog = document.querySelector('dialog')?.textContent
    expect(dialog).toContain('Vector: 0.0%')
    expect(dialog).toContain('Text: 0.0%')
    expect(dialog).not.toContain('Unavailable')
  })
})

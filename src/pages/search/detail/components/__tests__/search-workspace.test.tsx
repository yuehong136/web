import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import SearchDocFilterRail from '../search-doc-filter-rail'
import SearchTurnItem from '../search-turn-item'
vi.mock('../search-summary-card', () => ({ default: () => null }))
import {
  SearchExecutionMode,
  SearchExecutionPhase,
  SearchSourceMode,
  type SearchTurn,
} from '@/types/search'

let root: Root
let container: HTMLDivElement
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
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

it('keeps an explicitly empty document selection distinct from all sources', async () => {
  function Surface() {
    const [selected, setSelected] = useState<string[] | null>(null)
    return (
      <>
        <SearchDocFilterRail
          docAggs={[{ doc_id: 'one', doc_name: 'Evidence', count: 1 }]}
          selectedDocIds={selected}
          onSelectionChange={setSelected}
        />
        <output>{JSON.stringify(selected)}</output>
      </>
    )
  }
  await act(async () => root.render(<Surface />))
  const checkbox = () =>
    container.querySelector<HTMLButtonElement>('[role="checkbox"]')!
  expect(checkbox().getAttribute('aria-checked')).toBe('true')
  await act(async () => checkbox().click())
  expect(checkbox().getAttribute('aria-checked')).toBe('false')
  expect(container.querySelector('output')?.textContent).toBe('[]')
  const reset = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === 'Reset',
  )!
  await act(async () => reset.click())
  expect(checkbox().getAttribute('aria-checked')).toBe('true')
  expect(container.querySelector('output')?.textContent).toBe('null')
})

it('bounds the rendered source list and retains selection while paging', async () => {
  const docs = Array.from({ length: 500 }, (_, index) => ({
    doc_id: String(index),
    doc_name: `Document ${index}`,
    count: 1,
  }))
  await act(async () =>
    root.render(
      <SearchDocFilterRail
        docAggs={docs}
        selectedDocIds={['0', '499']}
        onSelectionChange={vi.fn()}
      />,
    ),
  )
  expect(container.querySelectorAll('[role="checkbox"]')).toHaveLength(100)
  await act(async () =>
    Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Next')!
      .click(),
  )
  expect(container.textContent).toContain('Document 100')
  expect(
    container.querySelectorAll('[role="checkbox"][aria-checked="true"]'),
  ).toHaveLength(0)
})

it('labels a stopped round without claiming completion or configured steps as executed', async () => {
  const turn: SearchTurn = {
    id: 'one',
    query: 'Question',
    executionMode: SearchExecutionMode.DEEP_RESEARCH,
    sourceMode: SearchSourceMode.KNOWLEDGE_BASE,
    summaryEnabled: false,
    relatedEnabled: false,
    mindmapEnabled: true,
    rerankEnabled: true,
    rerankModelId: '',
    rerankModelName: '',
    kbIdsSnapshot: [],
    summary: '',
    isStreaming: false,
    chunks: [],
    docAggs: [],
    relatedQuestions: [],
    total: 0,
    phase: SearchExecutionPhase.STOPPED,
  }
  await act(async () =>
    root.render(
      <SearchTurnItem
        index={0}
        isLatest
        expanded
        turn={turn}
        selectedDocIds={null}
        onToggleExpand={vi.fn()}
        onDocFilterChange={vi.fn()}
        onAskRelated={vi.fn()}
        onViewChunkDetail={vi.fn()}
      />,
    ),
  )
  expect(container.textContent).toContain('Reception stopped')
  expect(container.textContent).not.toContain('Completed')
  expect(container.textContent).not.toContain('Reranked')
})

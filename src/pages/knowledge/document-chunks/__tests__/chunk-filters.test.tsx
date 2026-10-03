import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { ChunkToolbar } from '../components/chunk-toolbar'
import { useChunkListState } from '../hooks/use-chunk-list-state'

let root: Root
let container: HTMLDivElement
let client: QueryClient
let calls: URL[]
const rows = [
  {
    id: 'enabled',
    content: 'Enabled chunk',
    document_id: 'doc-1',
    available: true,
  },
  {
    id: 'disabled',
    content: 'Disabled chunk',
    document_id: 'doc-1',
    available: false,
  },
]
function Surface() {
  const list = useChunkListState()
  return (
    <>
      <ChunkToolbar
        textMode={list.textMode}
        onTextModeChange={list.setTextMode}
        isPreviewPanelOpen
        onOpenPreviewPanel={() => {}}
        isSearchOpen={false}
        onSearchOpenChange={() => {}}
        searchKeyword=""
        onSearchKeywordChange={() => {}}
        filterStatus={list.filterStatus}
        onFilterStatusChange={list.setFilterStatus}
        total={list.total}
        isAllSelected={false}
        isPartialSelected={false}
        selectedCount={0}
        hasSelected={false}
        onSelectAll={() => {}}
        onBulkEnable={() => {}}
        onBulkDisable={() => {}}
        onBulkDeleteClick={() => {}}
        isBulkSwitchPending={false}
        isDeletePending={false}
        onAddChunk={() => {}}
      />
      <output>
        {list.filteredChunks.map((row) => row.content_with_weight).join('|')}
      </output>
      <button onClick={() => list.setPage(2)}>Next page</button>
    </>
  )
}
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25))
  })
}
async function click(label: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) =>
      item.textContent?.trim() === label ||
      item.querySelector('span')?.textContent === label ||
      item.getAttribute('aria-label') === label,
  )
  expect(button, label).toBeTruthy()
  await act(async () => button!.click())
  await settle()
}
function activeFilter() {
  return document.querySelector('button[aria-pressed="true"]')?.textContent
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      const url = new URL(String(input))
      calls.push(url)
      const available = url.searchParams.get('available')
      const chunks = rows.filter(
        (row) => available === null || row.available === (available === 'true'),
      )
      return new Response(
        JSON.stringify({
          code: 0,
          data: {
            total: chunks.length,
            chunks,
            doc: { id: 'doc-1', dataset_id: 'kb-1' },
          },
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    }),
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter
          initialEntries={['/knowledge/kb-1/documents/doc-1/chunks']}
        >
          <Routes>
            <Route
              path="/knowledge/:id/documents/:docId/chunks"
              element={<Surface />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await settle()
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  client.clear()
  vi.unstubAllGlobals()
})
it('defaults to All, preserves false for disabled, and resets pagination when filters change', async () => {
  expect(calls[0].pathname).toBe('/api/v1/datasets/kb-1/documents/doc-1/chunks')
  expect(calls[0].searchParams.has('available')).toBe(false)
  expect(container.querySelector('output')?.textContent).toBe(
    'Enabled chunk|Disabled chunk',
  )
  await click('Filter')
  expect(activeFilter()).toContain('All')
  await click('Next page')
  expect(calls.at(-1)?.searchParams.get('page')).toBe('2')
  await click('Enabled')
  expect(calls.at(-1)?.searchParams.get('available')).toBe('true')
  expect(calls.at(-1)?.searchParams.get('page')).toBe('1')
  expect(container.querySelector('output')?.textContent).toBe('Enabled chunk')
  expect(activeFilter()).toBe('Enabled')
  await click('Disabled')
  expect(calls.at(-1)?.searchParams.get('available')).toBe('false')
  expect(container.querySelector('output')?.textContent).toBe('Disabled chunk')
  expect(activeFilter()).toBe('Disabled')
  await click('All')
  expect(calls.at(-1)?.searchParams.has('available')).toBe(false)
  expect(container.querySelector('output')?.textContent).toBe(
    'Enabled chunk|Disabled chunk',
  )
  expect(activeFilter()).toContain('All')
  expect(calls.every((url) => url.searchParams.get('available') !== '-1')).toBe(
    true,
  )
})

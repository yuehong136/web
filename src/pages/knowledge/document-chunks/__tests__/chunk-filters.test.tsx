import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { ChunkToolbar } from '../components/chunk-toolbar'
import { ChunkListRow } from '../components/chunk-list-row'
import { ChunkPagination } from '../components/chunk-pagination'
import { useChunkListState } from '../hooks/use-chunk-list-state'
import type { ChunkData } from '../types'

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
const chunk: ChunkData = {
  chunk_id: 'chunk-1',
  content_with_weight:
    '<strong>Searchable content</strong><br>Second paragraph',
  doc_id: 'doc-1',
  docnm_kwd: 'Document',
  important_kwd: ['retrieval'],
  question_kwd: [],
  img_id: '',
  available_int: 1,
  positions: [[1]],
  doc_type_kwd: 'text',
}
function Surface() {
  const list = useChunkListState()
  return (
    <>
      <ChunkToolbar
        textMode={list.textMode}
        onTextModeChange={list.setTextMode}
        searchKeyword={list.searchKeyword}
        onSearchKeywordChange={list.setSearchKeyword}
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
      />
      <output>
        {list.filteredChunks.map((row) => row.content_with_weight).join('|')}
      </output>
      <button onClick={() => list.setPage(2)}>Next page</button>
    </>
  )
}
async function settle(delay = 25) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, delay))
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
      const keyword = url.searchParams.get('keywords')?.toLowerCase()
      const chunks = rows.filter(
        (row) =>
          (available === null || row.available === (available === 'true')) &&
          (!keyword || row.content.toLowerCase().includes(keyword)),
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

it('keeps search immediately reachable and starts searched results on the first page', async () => {
  const search = container.querySelector<HTMLInputElement>(
    'input[type="search"]',
  )
  expect(search).toBeTruthy()
  search!.focus()
  expect(document.activeElement).toBe(search)
  await click('Next page')
  expect(calls.at(-1)?.searchParams.get('page')).toBe('2')

  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set?.call(search, 'Disabled')
    search!.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle(450)
  await settle()

  expect(calls.at(-1)?.searchParams.get('keywords')).toBe('Disabled')
  expect(calls.at(-1)?.searchParams.get('page')).toBe('1')
  expect(container.querySelector('output')?.textContent).toBe('Disabled chunk')
  expect(container.querySelector('input[type="search"]')).toBe(search)
  expect(document.activeElement).toBe(search)
})

it('keeps chunk selection separate from bulk selection, status, edit, and delete actions', async () => {
  const onSelectChunk = vi.fn()
  const onCheckboxChange = vi.fn()
  const onToggleChunkStatus = vi.fn()
  const onEditChunk = vi.fn()
  const onDeleteChunk = vi.fn()
  await act(async () => {
    root.render(
      <ChunkListRow
        chunk={chunk}
        sliceNo={1}
        isActive={false}
        isSelected={false}
        textMode="ellipse"
        onSelectChunk={onSelectChunk}
        onCheckboxChange={onCheckboxChange}
        onToggleChunkStatus={onToggleChunkStatus}
        onEditChunk={onEditChunk}
        onDeleteChunk={onDeleteChunk}
        onPreviewImage={vi.fn()}
      />,
    )
  })

  const checkbox =
    container.querySelector<HTMLButtonElement>('[role="checkbox"]')
  expect(checkbox?.getAttribute('aria-label')).toBe('Select chunk #1')
  await act(async () => checkbox!.click())
  expect(onCheckboxChange).toHaveBeenCalledExactlyOnceWith(chunk.chunk_id, true)
  expect(onSelectChunk).not.toHaveBeenCalled()

  const status = container.querySelector<HTMLButtonElement>('[role="switch"]')
  expect(status?.getAttribute('aria-checked')).toBe('true')
  await act(async () => status!.click())
  expect(onToggleChunkStatus).toHaveBeenCalledExactlyOnceWith(chunk)
  expect(onSelectChunk).not.toHaveBeenCalled()

  await click('Edit chunk')
  expect(onEditChunk).toHaveBeenCalledExactlyOnceWith(chunk)
  await click('Delete chunk')
  expect(onDeleteChunk).toHaveBeenCalledExactlyOnceWith(chunk.chunk_id)
  expect(onSelectChunk).not.toHaveBeenCalled()
})

it('offers a keyboard-focusable content action and expands the active chunk independently of bulk selection', async () => {
  const onSelectChunk = vi.fn()
  function InteractiveChunk() {
    const [active, setActive] = useState(false)
    return (
      <ChunkListRow
        chunk={chunk}
        sliceNo={1}
        isActive={active}
        isSelected={false}
        textMode="ellipse"
        onSelectChunk={(selected) => {
          onSelectChunk(selected)
          setActive(true)
        }}
        onCheckboxChange={vi.fn()}
        onToggleChunkStatus={vi.fn()}
        onEditChunk={vi.fn()}
        onDeleteChunk={vi.fn()}
        onPreviewImage={vi.fn()}
      />
    )
  }
  await act(async () => root.render(<InteractiveChunk />))

  const content = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Inspect chunk #1"]',
  )
  expect(content).toBeTruthy()
  expect(content?.tabIndex).toBe(0)
  expect(content?.getAttribute('aria-expanded')).toBe('false')
  content!.focus()
  expect(document.activeElement).toBe(content)
  await act(async () => content!.click())

  expect(onSelectChunk).toHaveBeenCalledExactlyOnceWith(chunk)
  expect(content?.getAttribute('aria-pressed')).toBe('true')
  expect(content?.getAttribute('aria-expanded')).toBe('true')
  expect(
    container.querySelector('[role="checkbox"]')?.getAttribute('aria-checked'),
  ).toBe('false')
})

function PaginationSurface() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  return (
    <>
      <ChunkPagination
        total={42}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      <output>{`${page}/${pageSize}`}</output>
    </>
  )
}

it('respects pagination boundaries and returns to the first page after changing page size', async () => {
  await act(async () => root.render(<PaginationSurface />))
  const previous = () =>
    container.querySelector<HTMLButtonElement>('button[aria-label="Previous"]')!
  const next = () =>
    container.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!
  expect(container.querySelector('output')?.textContent).toBe('1/20')
  expect(previous().disabled).toBe(true)
  await click('Previous')
  expect(container.querySelector('output')?.textContent).toBe('1/20')

  await click('Next')
  expect(container.querySelector('output')?.textContent).toBe('2/20')
  await click('Next')
  expect(container.querySelector('output')?.textContent).toBe('3/20')
  expect(next().disabled).toBe(true)
  await click('Next')
  expect(container.querySelector('output')?.textContent).toBe('3/20')
  await click('Previous')
  expect(container.querySelector('output')?.textContent).toBe('2/20')

  await click('Chunks per page')
  await click('50')
  expect(container.querySelector('output')?.textContent).toBe('1/50')
  expect(previous().disabled).toBe(true)
  expect(next().disabled).toBe(true)
  expect(
    container.querySelector('button[aria-label="Chunks per page"]')
      ?.textContent,
  ).toBe('50')
})

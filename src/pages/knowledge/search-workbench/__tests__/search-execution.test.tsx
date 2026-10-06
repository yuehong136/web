import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { MetadataFilter } from '@/components/chat/MetadataFilter'
import { ConfigPanelSheet } from '../config-panel'
import { ResultPanel } from '../result-panel'
import { useSearchExecution } from '../hooks/use-search-execution'
import { useSearchParamsState } from '../hooks/use-search-params'
import { DEFAULT_SEARCH_MODE, DEFAULT_SEARCH_PARAMS } from '../constants'
import type { SearchConfigState } from '../types'

let root: Root
let container: HTMLDivElement
let execution: ReturnType<typeof useSearchExecution>
let params: ReturnType<typeof useSearchParamsState>
let calls: Array<Record<string, unknown>>
let wire: unknown
const emptyResult = { total: 0, chunks: [], doc_aggs: [], labels: {} }
const docAggs = [
  { doc_id: 'a', doc_name: 'Version one.pdf', count: 1 },
  { doc_id: 'b', doc_name: 'Version two.pdf', count: 1 },
]
const result = {
  total: 40,
  chunks: [
    {
      chunk_id: 'chunk-a',
      text: 'Answer',
      doc_id: 'a',
      docnm_kwd: 'Version one.pdf',
      kb_id: 'kb',
      similarity: 0.9,
      vector_similarity: 0.9,
      term_similarity: 0.5,
    },
  ],
  doc_aggs: docAggs,
  labels: {},
}
const config: SearchConfigState = {
  searchParams: DEFAULT_SEARCH_PARAMS,
  searchMode: DEFAULT_SEARCH_MODE,
  pageSize: 20,
  selectedLanguages: [],
  metadataMode: 'disabled',
  metadataCondition: { conditions: [] },
  metadataSemiAutoFields: [],
}

function Harness() {
  const p = useSearchParamsState()
  const e = useSearchExecution({
    kbId: 'kb',
    searchParams: p.searchParams,
    searchMode: p.searchMode,
    selectedLanguages: p.selectedLanguages,
    activeMetaDataFilter: p.activeMetaDataFilter,
  })
  useLayoutEffect(() => {
    params = p
    execution = e
  }, [p, e])
  return (
    <ResultPanel
      hasSearched={e.hasSearched}
      searchError={e.searchError}
      requestScope={e.requestScope}
      docOptions={e.docOptions}
      onRetry={e.retrySearch}
      onOpenConfig={vi.fn()}
      isSearching={e.isSearching}
      results={e.results}
      totalResults={e.totalResults}
      docAggs={e.docAggs}
      selectedDocIds={e.selectedDocIds}
      showDocFilter={e.showDocFilter}
      highlight
      currentPage={e.currentPage}
      pageSize={e.pageSize}
      totalPages={e.totalPages}
      pageNumbers={e.pageNumbers}
      onToggleDocFilter={e.toggleDocFilter}
      onDocFilter={e.handleDocFilter}
      onClearDocFilter={e.handleClearDocFilter}
      onSelectAllDocs={e.handleSelectAllDocs}
      onOpenResultPreview={vi.fn()}
      onPageChange={e.handlePageChange}
      onPageSizeChange={e.handlePageSizeChange}
    />
  )
}
function button(label: string) {
  const value = [...container.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === label,
  )
  expect(value, label).toBeTruthy()
  return value!
}
async function search() {
  await act(async () => execution.setQuery('Original question'))
  await act(async () => execution.handleSearchSubmit())
}
function envelope(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
  })
}
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
  calls = []
  wire = { code: 0, data: result }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      calls.push(JSON.parse(String(init.body)))
      return envelope(wire)
    }),
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root.render(<Harness />))
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('typing alone stays in the initial state; pagination uses the submitted query and controls', async () => {
  await act(async () => execution.setQuery('Original question'))
  expect(container.textContent).toContain('Start retrieval test')
  expect(container.textContent).not.toContain('No relevant results')
  await act(async () => execution.handleSearchSubmit())
  await act(async () => {
    execution.setQuery('Unsubmitted draft')
    params.setSearchParams({
      ...DEFAULT_SEARCH_PARAMS,
      similarity_threshold: 0.8,
    })
  })
  await act(async () => execution.handlePageChange(2))
  expect(calls.at(-1)).toMatchObject({
    question: 'Original question',
    page: 2,
    size: 20,
    similarity_threshold: 0.2,
  })
  await act(async () => execution.handlePageSizeChange(10))
  expect(calls.at(-1)).toMatchObject({
    question: 'Original question',
    page: 1,
    size: 10,
  })
})

it('disabling metadata filtering clears the immediate Apply request, rather than reusing the old filter', async () => {
  await act(async () => {
    params.setMetadataMode('manual')
    params.setMetadataCondition({
      conditions: [{ name: 'version', comparison_operator: 'is', value: 'v2' }],
    })
  })
  await search()
  expect(calls.at(-1)?.meta_data_filter).toEqual({
    method: 'manual',
    logic: 'and',
    manual: [{ key: 'version', op: '=', value: 'v2' }],
  })
  await act(async () =>
    execution.runSearch({
      page: 1,
      config: { activeMetaDataFilter: undefined },
    }),
  )
  expect(calls.at(-1)).not.toHaveProperty('meta_data_filter')
  expect(container.textContent).toContain('Metadata: filtering disabled')
})

it('document options survive narrower results and zero matches, and Clear preserves the metadata filter', async () => {
  await act(async () => {
    params.setMetadataMode('auto')
  })
  await search()
  await act(async () => button('Document filter').click())
  expect(execution.showDocFilter).toBe(false)
  // A successful response does not immediately force the collapsed panel open.
  await act(async () => execution.runSearch())
  expect(execution.showDocFilter).toBe(false)
  wire = { code: 0, data: { ...result, total: 1, doc_aggs: [docAggs[0]] } }
  await act(async () => execution.handleDocFilter('a', true))
  expect(execution.docOptions.map((doc) => doc.doc_id)).toEqual(['a', 'b'])
  expect(container.textContent).toContain(
    'Document scope and metadata conditions are intersected',
  )
  wire = { code: 0, data: emptyResult }
  await act(async () => execution.runSearch())
  expect(container.textContent).toContain('No relevant results')
  expect(container.textContent).toContain('Version one.pdf')
  await act(async () => button('Clear document restriction').click())
  expect(calls.at(-1)).toMatchObject({
    doc_ids: null,
    meta_data_filter: { method: 'auto' },
    page: 1,
  })
  expect(container.textContent).toContain('Documents: entire knowledge base')
})

it.each(['auto', 'semi_auto', 'manual'] as const)(
  'zero matches in %s mode stay an explicit successful empty result',
  async (mode) => {
    wire = { code: 0, data: emptyResult }
    await act(async () => {
      params.setMetadataMode(mode)
      params.setMetadataSemiAutoFields([{ key: 'version', op: 'is' }])
      params.setMetadataCondition({
        conditions: [
          { name: 'version', comparison_operator: 'is', value: 'missing' },
        ],
      })
    })
    await search()
    expect(execution.searchError).toBeUndefined()
    expect(container.textContent).toContain('No relevant results')
    expect(container.textContent).not.toContain('Search failed')
    expect(calls).toHaveLength(1)
    expect(calls[0].meta_data_filter).toMatchObject({ method: mode })
  },
)

it('business failure is visible and safe; Retry repeats the failed request including its scope', async () => {
  await search()
  wire = { code: 102, message: 'private model credentials', data: null }
  await act(async () => execution.handleDocFilter('b', true))
  expect(container.textContent).toContain('Search failed')
  expect(container.textContent).not.toContain('No relevant results')
  expect(container.textContent).not.toContain('private model credentials')
  expect(container.textContent).not.toContain('0 relevant chunks found')
  expect(button('Clear document restriction')).toBeTruthy()
  const failed = calls.at(-1)
  wire = { code: 0, data: emptyResult }
  await act(async () => execution.setQuery('Another draft'))
  await act(async () => button('Retry').click())
  expect(calls.at(-1)).toEqual(failed)
  expect(container.textContent).toContain('No relevant results')
})

it('a late result cannot overwrite the latest scope or failure', async () => {
  let resolveOld!: (response: Response) => void
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValue(envelope({ code: 102, message: 'failed' })),
  )
  await act(async () => {
    execution.setQuery('Old question')
  })
  await act(async () => {
    execution.handleSearchSubmit()
  })
  await act(async () => {
    execution.setQuery('New question')
  })
  await act(async () => execution.handleSearchSubmit())
  await act(async () => resolveOld(envelope({ code: 0, data: result })))
  expect(execution.requestScope?.question).toBe('New question')
  expect(execution.searchError).toBe('failed')
  expect(execution.results).toEqual([])
})

it.each(['manual', 'semi_auto'] as const)(
  'the %s config explains why Apply is blocked, even with advanced controls collapsed',
  async (mode) => {
    const apply = vi.fn()
    await act(async () =>
      root.render(
        <ConfigPanelSheet
          open
          onClose={vi.fn()}
          onApply={apply}
          initialConfig={{ ...config, metadataMode: mode }}
          advancedOpen={false}
          onToggleAdvanced={vi.fn()}
          rerankModels={[]}
          rerankLoading={false}
          metadataFields={[]}
          metadataFieldsLoading={false}
          metadataFieldsError={false}
          onRetryMetadataFields={vi.fn()}
        />,
      ),
    )
    expect(button('Apply').disabled).toBe(true)
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      mode === 'manual' ? 'Add at least one complete' : 'Select at least one',
    )
    expect(apply).not.toHaveBeenCalled()
  },
)

it('the shared metadata editor displays numeric zero rather than a blank input', async () => {
  await act(async () =>
    root.render(
      <MetadataFilter
        mode="manual"
        onModeChange={vi.fn()}
        value={{
          conditions: [
            { name: 'revision', comparison_operator: 'is', value: 0 },
          ],
        }}
        onChange={vi.fn()}
      />,
    ),
  )
  expect(
    container.querySelector<HTMLInputElement>(
      'input[placeholder="Enter value"]',
    )?.value,
  ).toBe('0')
})

it('knowledge graph search cannot silently bypass either document or metadata restrictions', async () => {
  await search()
  await act(async () => {
    params.setSearchParams({ ...DEFAULT_SEARCH_PARAMS, use_kg: true })
  })
  await act(async () => execution.handleDocFilter('a', true))
  const before = calls.length
  await act(async () => execution.runSearch())
  expect(calls).toHaveLength(before)
  expect(execution.searchError).toBe('graphScope')
  expect(button('Review search settings')).toBeTruthy()
  await act(async () => execution.handleClearDocFilter())
  expect(execution.searchError).toBeUndefined()
  expect(calls.at(-1)).toMatchObject({ use_kg: true, doc_ids: null })
  await act(async () => params.setMetadataMode('auto'))
  const unfiltered = calls.length
  await act(async () => execution.runSearch())
  expect(calls).toHaveLength(unfiltered)
  expect(execution.searchError).toBe('graphScope')
})

it('an HTTP-200 authorization failure explains access rather than an empty search or model problem', async () => {
  wire = { code: 109, message: 'private tenant details', data: null }
  await search()
  expect(execution.searchError).toBe('access')
  expect(container.textContent).toContain(
    'Check your sign-in status and permissions',
  )
  expect(container.textContent).not.toContain('No relevant results')
  expect(container.textContent).not.toContain('private tenant details')
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { documentKeys } from '@/hooks/use-document-request'
import { knowledgeKeys } from '@/hooks/use-knowledge-request'
import { createQueryClient } from '@/lib/query-client'
import type { Document } from '@/types/api'
import { useDocumentActions } from '../hooks/use-document-actions'
import { useDocumentListState } from '../hooks/use-document-list-state'
import { DocumentEnableSwitch } from '../document-status-cell'
import { BulkActionToolbar } from '../bulk-action-toolbar'

const mocks = vi.hoisted(() => ({
  changeStatus: vi.fn(),
  list: vi.fn(),
  getFilter: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock('@/api/knowledge', () => ({
  knowledgeAPI: {
    document: {
      changeStatus: mocks.changeStatus,
      list: mocks.list,
      getFilter: mocks.getFilter,
    },
  },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, warning: mocks.warning, error: mocks.error },
}))
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, counts?: unknown) => JSON.stringify({ key, counts }),
  }),
}))

describe('document status actions and original request ownership', () => {
  let root: Root
  let container: HTMLDivElement
  let queryClient: QueryClient
  let actions: ReturnType<typeof useDocumentActions>
  let state: ReturnType<typeof useDocumentListState>
  let navigate: ReturnType<typeof useNavigate>
  let rows: Document[]
  let callback: ReturnType<typeof vi.fn<() => void>>

  function Harness() {
    const { id } = useParams()
    navigate = useNavigate()
    state = useDocumentListState()
    actions = useDocumentActions(callback, id, state.removeSelectedDocs)
    return (
      <>
        {state.documents.map((doc) => (
          <DocumentEnableSwitch
            key={doc.id}
            document={doc}
            onToggle={() => actions.handleToggleStatus(doc)}
          />
        ))}
        <BulkActionToolbar
          selectedCount={state.selectedDocs.size}
          onEnable={() => actions.handleBulkEnable([...state.selectedDocs])}
          onDisable={() => actions.handleBulkDisable([...state.selectedDocs])}
          onStartParse={() => {}}
          onStopParse={() => {}}
          onDelete={() => {}}
          onClearSelection={state.clearSelection}
          isLoading={actions.isChangingStatus}
        />
      </>
    )
  }
  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    Object.values(mocks).forEach((mock) => mock.mockReset())
    callback = vi.fn()
    rows = [
      { id: 'a', status: '1', run: '3' },
      { id: 'b', status: '1', run: '3' },
    ] as Document[]
    mocks.list.mockImplementation(async () => ({
      docs: rows.map((r) => ({ ...r })),
      total: rows.length,
    }))
    mocks.getFilter.mockResolvedValue({
      filter: { suffix: [], run_status: [] },
      total: 2,
    })
    queryClient = createQueryClient({ notifyMutationError: vi.fn() })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/knowledge/one/documents']}>
            <Routes>
              <Route path="/knowledge/:id/documents" element={<Harness />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    queryClient.clear()
    container.remove()
    vi.unstubAllGlobals()
  })

  it('actual single switch follows confirmed readback and refreshes on code0 missing data', async () => {
    mocks.changeStatus.mockImplementation(async () => {
      rows[0].status = '0'
      return { a: { status: '0' } }
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[role="switch"]')!.click()
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(mocks.changeStatus).toHaveBeenCalledWith('one', {
      doc_ids: ['a'],
      status: 0,
    })
    expect(
      container.querySelector('[role="switch"]')?.getAttribute('aria-checked'),
    ).toBe('false')
    expect(mocks.success).toHaveBeenCalledOnce()
    mocks.changeStatus.mockResolvedValue({ extra: { status: '1' } })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[role="switch"]')!.click()
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(mocks.error).toHaveBeenCalledOnce()
    expect(
      container.querySelector('[role="switch"]')?.getAttribute('aria-checked'),
    ).toBe('false')
    expect(mocks.list.mock.calls.length).toBeGreaterThanOrEqual(3)
    expect(callback).not.toHaveBeenCalled()
  })

  it('partial business details count requested IDs only, refresh, and retain failed/new selections', async () => {
    await act(async () => {
      state.selectDoc('a', true)
      state.selectDoc('b', true)
    })
    let settle!: (error: unknown) => void
    mocks.changeStatus.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          settle = reject
        }),
    )
    let operation: Promise<void>
    await act(async () => {
      operation = actions.handleBulkDisable(['a', 'a', 'b'])
    })
    await act(async () => {
      state.selectDoc('new-selection', true)
      rows[0].status = '0'
      settle(
        new APIError(200, '500', 'secret raw message', {
          a: { status: '0' },
          b: { error: 'secret raw detail' },
          extra: { status: '0' },
        }),
      )
      await operation!
    })
    expect([...state.selectedDocs]).toEqual(['b', 'new-selection'])
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.warning.mock.calls[0][0]).toContain(
      '"successCount":1,"errorCount":1',
    )
    expect(JSON.stringify(mocks.warning.mock.calls)).not.toContain('secret')
    expect(state.documents[0].status).toBe('0')
    expect(mocks.getFilter.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(callback).not.toHaveBeenCalled()
  })

  it.each([401, 109, 422, 500])(
    'status %s produces safe feedback and refreshes original cache',
    async (code) => {
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
      mocks.changeStatus.mockRejectedValue(
        new APIError(code === 109 ? 200 : code, String(code), 'unsafe', {
          a: { status: '1' },
          secret: 'unsafe',
        }),
      )
      await act(async () => {
        await actions.handleBulkEnable(['a', 'b'])
      })
      expect(mocks.success).not.toHaveBeenCalled()
      expect(mocks.warning.mock.calls[0][0]).toContain(
        '"successCount":0,"errorCount":2',
      )
      expect(JSON.stringify(mocks.warning.mock.calls)).not.toContain('unsafe')
      for (const queryKey of [
        documentKeys.datasetLists('one'),
        documentKeys.filter('one'),
        knowledgeKeys.detail('one'),
        documentKeys.detail('a'),
        documentKeys.standaloneDetail('a'),
        documentKeys.documentChunks('a'),
        documentKeys.documentChunkList('a'),
      ])
        expect(invalidate).toHaveBeenCalledWith({ queryKey })
    },
  )

  it('late results invalidate only original dataset and never report/clear in a new route', async () => {
    let settle!: (result: unknown) => void
    mocks.changeStatus.mockImplementation(
      () =>
        new Promise((resolve) => {
          settle = resolve
        }),
    )
    let operation: Promise<void>
    await act(async () => {
      operation = actions.handleBulkDisable(['a'])
    })
    await act(async () => {
      navigate('/knowledge/two/documents')
      state.selectDoc('new', true)
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await act(async () => {
      settle({ a: { status: '0' } })
      await operation!
    })
    expect(state.selectedDocs.has('new')).toBe(true)
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.warning).not.toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: documentKeys.datasetLists('one'),
    })
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: documentKeys.datasetLists('two'),
    })
  })

  it('full success only removes the requested selection and missing results remain retryable', async () => {
    await act(async () => {
      state.selectDoc('a', true)
      state.selectDoc('b', true)
    })
    mocks.changeStatus.mockResolvedValue({ a: { status: '1' } })
    await act(async () => {
      await actions.handleBulkEnable(['a'])
    })
    expect([...state.selectedDocs]).toEqual(['b'])
    expect(mocks.success.mock.calls[0][0]).toContain('"count":1')
    mocks.changeStatus.mockResolvedValue({ b: { status: 1 } })
    await act(async () => {
      await actions.handleBulkEnable(['b'])
    })
    expect([...state.selectedDocs]).toEqual(['b'])
    expect(mocks.warning).toHaveBeenCalledOnce()
  })
})

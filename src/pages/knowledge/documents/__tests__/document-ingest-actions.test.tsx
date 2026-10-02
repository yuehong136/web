import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import {
  MemoryRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { documentKeys } from '@/hooks/use-document-request'
import { knowledgeKeys } from '@/hooks/use-knowledge-request'
import { createQueryClient } from '@/lib/query-client'
import { ReparseConfirmModal } from '@/components/knowledge/ReparseConfirmModal'
import type { Document, KnowledgeBase } from '@/types/api'
import { useDocumentActions } from '../hooks/use-document-actions'
import { useDocumentListState } from '../hooks/use-document-list-state'
import { useDocumentPageModals } from '../hooks/use-document-page-modals'

const mocks = vi.hoisted(() => ({
  parse: vi.fn(),
  stop: vi.fn(),
  ingest: vi.fn(),
  list: vi.fn(),
  getFilter: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock('@/api/knowledge', () => ({ knowledgeAPI: { document: mocks } }))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, warning: mocks.warning, error: mocks.error },
}))
vi.mock('react-i18next', async (original) => ({
  ...(await original<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, counts?: unknown) => JSON.stringify({ key, counts }),
  }),
}))

describe('document operations in actual list/actions/page-modal ownership', () => {
  let root: Root
  let container: HTMLDivElement
  let client: QueryClient
  let state: ReturnType<typeof useDocumentListState>
  let actions: ReturnType<typeof useDocumentActions>
  let modals: ReturnType<typeof useDocumentPageModals>
  let navigate: ReturnType<typeof useNavigate>
  let setDetailReady: (ready: boolean) => void
  let metadata: boolean
  let rows: Document[]
  const genericSuccess = vi.fn()
  function Harness() {
    const { id } = useParams()
    navigate = useNavigate()
    const [detailReady, updateDetailReady] = useState(true)
    setDetailReady = updateDetailReady
    state = useDocumentListState()
    actions = useDocumentActions(genericSuccess, id, state.removeSelectedDocs)
    modals = useDocumentPageModals({
      datasetId: id ?? '',
      currentKnowledgeBase: detailReady
        ? ({
            id,
            parser_config: { enable_metadata: metadata },
          } as unknown as KnowledgeBase)
        : null,
      listState: state,
      actions,
    })
    return (
      <>
        <button onClick={modals.handleBatchStartParse}>
          Open confirmation
        </button>
        <ReparseConfirmModal
          open={modals.reparseModalOpen}
          onClose={modals.closeReparse}
          onConfirm={modals.handleConfirmParse}
          documents={modals.reparsingDocs}
          options={modals.reparseOptions}
          onOptionsChange={modals.setReparseOptions}
          knowledgeBase={
            detailReady
              ? ({
                  id,
                  parser_config: { enable_metadata: metadata },
                } as unknown as KnowledgeBase)
              : null
          }
          isLoading={modals.isReparsing}
        />
        <output>{[...state.selectedDocs].join(',')}</output>
      </>
    )
  }
  function Page() {
    const { id } = useParams()
    return <Harness key={id} />
  }
  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    Object.values(mocks).forEach((mock) => mock.mockReset())
    genericSuccess.mockClear()
    metadata = true
    rows = [
      { id: 'a', name: 'a.txt', chunk_num: 3, run: '3' },
      { id: 'b', name: 'b.txt', chunk_num: 2, run: '3' },
      { id: 'new', name: 'new.txt', chunk_num: 0, run: '0' },
    ] as Document[]
    mocks.list.mockImplementation(async () => ({
      docs: rows.map((row) => ({ ...row })),
      total: rows.length,
    }))
    mocks.getFilter.mockResolvedValue({
      filter: { suffix: [], run_status: [] },
      total: 3,
    })
    mocks.parse.mockResolvedValue(undefined)
    mocks.ingest.mockResolvedValue(undefined)
    mocks.stop.mockResolvedValue(undefined)
    client = createQueryClient({ notifyMutationError: vi.fn() })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/knowledge/one/documents']}>
            <Routes>
              <Route path="/knowledge/:id/documents" element={<Page />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25))
    })
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
  async function select(...ids: string[]) {
    await act(async () => {
      ids.forEach((id) => state.selectDoc(id, true))
    })
  }
  async function open() {
    await act(async () => modals.handleBatchStartParse())
  }
  function dialogButtons() {
    return [
      ...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
    ]
  }
  async function confirm() {
    await act(async () => dialogButtons().at(-1)!.click())
  }
  async function chooseKeep() {
    await act(async () => {
      document
        .querySelectorAll<HTMLElement>('[role="checkbox"]')
        .forEach((checkbox) => checkbox.click())
    })
  }
  it('new sessions default visible options to true; cancel makes no request; invisible options are false', async () => {
    await select('a')
    await open()
    expect(modals.reparseOptions).toEqual({
      deleteChunks: true,
      applyMetadataSettings: true,
    })
    await chooseKeep()
    await act(async () => modals.closeReparse())
    expect(mocks.ingest).not.toHaveBeenCalled()
    await open()
    await confirm()
    expect(mocks.ingest).toHaveBeenCalledWith('one', ['a'], {
      run: 1,
      delete: true,
      apply_kb: true,
    })
    expect(modals.reparseModalOpen).toBe(false)
    expect(genericSuccess).not.toHaveBeenCalled()
    await act(async () => {
      metadata = false
      modals.setReparsingDocs([rows[2]])
      modals.setReparseModalOpen(true)
    })
    await confirm()
    expect(mocks.ingest).toHaveBeenLastCalledWith('one', ['new'], {
      run: 1,
      delete: false,
      apply_kb: false,
    })
  })
  it('partial confirmation keeps failed IDs/options and new selections, then retries only failed targets', async () => {
    mocks.ingest.mockRejectedValueOnce(
      new APIError(200, '500', 'private', {
        results: {
          a: { run: '1' },
          b: { error: 'secret', queued_task_ids: ['t'] },
        },
      }),
    )
    await select('a', 'b')
    await open()
    await chooseKeep()
    await confirm()
    expect([...state.selectedDocs]).toEqual(['b'])
    expect(modals.reparsingDocs.map((doc) => doc.id)).toEqual(['b'])
    expect(modals.reparseModalOpen).toBe(true)
    expect(modals.reparseOptions).toEqual({
      deleteChunks: false,
      applyMetadataSettings: false,
    })
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.warning).toHaveBeenCalledWith(
      expect.stringContaining('"successCount":1'),
    )
    expect(document.body.textContent).not.toContain('secret')
    await select('new')
    await confirm()
    expect(mocks.ingest).toHaveBeenLastCalledWith('one', ['b'], {
      run: 1,
      delete: false,
      apply_kb: false,
    })
    expect([...state.selectedDocs]).toEqual(['new'])
    expect(modals.reparseModalOpen).toBe(false)
  })
  it('pending submission locks every modal control, prevents duplicate HTTP and preserves later selections', async () => {
    let resolve!: () => void
    mocks.ingest.mockImplementation(
      () =>
        new Promise<void>((done) => {
          resolve = done
        }),
    )
    await select('a')
    await open()
    await confirm()
    await confirm()
    expect(mocks.ingest).toHaveBeenCalledTimes(1)
    expect(dialogButtons().every((button) => button.disabled)).toBe(true)
    expect(
      document.querySelector<HTMLButtonElement>(
        'button[aria-label*="common.close"]',
      )!.disabled,
    ).toBe(true)
    expect(
      [...document.querySelectorAll('[role="checkbox"]')].every(
        (checkbox) => checkbox.getAttribute('data-disabled') !== null,
      ),
    ).toBe(true)
    await act(async () => modals.closeReparse())
    expect(modals.reparseModalOpen).toBe(true)
    await select('new')
    await act(async () => resolve())
    expect([...state.selectedDocs]).toEqual(['new'])
    expect(modals.reparseModalOpen).toBe(false)
  })
  it('keeps Radix focus scope while busy, blocks Escape, and restores the keyboard opener after failure/cancel', async () => {
    let reject!: (error: Error) => void
    mocks.ingest.mockImplementation(
      () =>
        new Promise<void>((_resolve, fail) => {
          reject = fail
        }),
    )
    await select('a')
    const opener = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Open confirmation',
    )!
    opener.focus()
    await act(async () => opener.click())
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.contains(document.activeElement)).toBe(true)
    await chooseKeep()
    await confirm()
    expect(document.activeElement).toBe(dialog)
    await act(async () => {
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        }),
      )
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(document.activeElement).toBe(dialog)
    expect(modals.reparseModalOpen).toBe(true)
    expect(mocks.ingest).toHaveBeenCalledTimes(1)
    await act(async () =>
      reject(
        new APIError(200, '500', 'private', {
          results: { a: { error: 'failed' } },
        }),
      ),
    )
    expect(dialog.getAttribute('aria-busy')).toBe('false')
    expect(modals.reparseOptions).toEqual({
      deleteChunks: false,
      applyMetadataSettings: false,
    })
    await act(async () =>
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      ),
    )
    expect(modals.reparseModalOpen).toBe(false)
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
    expect(document.activeElement).toBe(opener)
    expect([...state.selectedDocs]).toEqual(['a'])
    expect(mocks.ingest).toHaveBeenCalledTimes(1)
  })
  it.each([
    new APIError(200, '102', 'secret'),
    new APIError(200, '109', 'secret'),
    new APIError(401, '401', 'secret'),
    new APIError(422, 'HTTP_ERROR', 'secret'),
    new APIError(500, '500', 'secret'),
    new APIError(0, 'NETWORK_ERROR', 'secret'),
    new APIError(408, 'TIMEOUT', 'secret'),
  ])(
    'unconfirmed error retains selection/options/dialog and reconciles original cache: %s',
    async (failure) => {
      mocks.ingest.mockRejectedValue(failure)
      const invalidate = vi.spyOn(client, 'invalidateQueries')
      await select('a')
      await open()
      await chooseKeep()
      await confirm()
      expect([...state.selectedDocs]).toEqual(['a'])
      expect(modals.reparseModalOpen).toBe(true)
      expect(modals.reparseOptions).toEqual({
        deleteChunks: false,
        applyMetadataSettings: false,
      })
      expect(mocks.success).not.toHaveBeenCalled()
      expect(genericSuccess).not.toHaveBeenCalled()
      for (const key of [
        documentKeys.datasetLists('one'),
        documentKeys.filter('one'),
        knowledgeKeys.detail('one'),
        documentKeys.detail('a'),
        documentKeys.standaloneDetail('a'),
        documentKeys.documentChunks('a'),
        documentKeys.documentChunkList('a'),
      ]) {
        expect(invalidate).toHaveBeenCalledWith({ queryKey: key })
      }
      expect(invalidate).not.toHaveBeenCalledWith({
        queryKey: documentKeys.lists(),
      })
      expect(document.body.textContent).not.toContain('secret')
    },
  )
  it('ordinary bulk parse keeps failed/new selections and uses canonical defaults', async () => {
    metadata = false
    rows = rows.map((row) => ({ ...row, chunk_num: 0 }))
    await act(async () => {
      await state.refetch()
    })
    await select('a', 'b')
    mocks.parse.mockRejectedValueOnce(
      new APIError(200, '102', 'private', {
        results: { a: { run: '1' }, b: { error: 'failure' } },
      }),
    )
    await open()
    expect(mocks.parse).toHaveBeenCalledWith('one', ['a', 'b'])
    expect(mocks.ingest).not.toHaveBeenCalled()
    expect([...state.selectedDocs]).toEqual(['b'])
    expect(modals.reparseModalOpen).toBe(false)
  })
  it('stop submits canonical cancellation, leaves completion state to list readback', async () => {
    await select('a', 'b')
    await act(async () => {
      await actions.handleStopParse(['a'])
    })
    expect(mocks.stop).toHaveBeenCalledWith('one', ['a'])
    expect(mocks.ingest).not.toHaveBeenCalled()
    expect([...state.selectedDocs]).toEqual(['b'])
    expect(mocks.success).toHaveBeenCalledWith(
      expect.stringContaining('parseStopped'),
    )
    expect(state.documents.find((doc) => doc.id === 'a')!.run).toBe('3')
  })
  it.each([true, false])(
    'same-route detail arrival cannot strand pending confirmation; complete=%s',
    async (complete) => {
      let resolve!: () => void
      let reject!: (error: unknown) => void
      mocks.ingest.mockImplementationOnce(
        () =>
          new Promise<void>((done, fail) => {
            resolve = done
            reject = fail
          }),
      )
      await act(async () => setDetailReady(false))
      await select('a')
      await open()
      await chooseKeep()
      await confirm()
      expect(modals.isReparsing).toBe(true)
      await act(async () => setDetailReady(true))
      await act(async () => {
        if (complete) resolve()
        else reject(new APIError(200, '102', 'private'))
      })
      expect(modals.isReparsing).toBe(false)
      expect(modals.reparseOptions).toEqual({
        deleteChunks: false,
        applyMetadataSettings: false,
      })
      if (complete) {
        expect(modals.reparseModalOpen).toBe(false)
        expect([...state.selectedDocs]).toEqual([])
      } else {
        expect(modals.reparseModalOpen).toBe(true)
        expect([...state.selectedDocs]).toEqual(['a'])
        expect(dialogButtons().every((button) => button.disabled)).toBe(false)
        await confirm()
        expect(mocks.ingest).toHaveBeenLastCalledWith('one', ['a'], {
          run: 1,
          delete: false,
          apply_kb: false,
        })
        expect(modals.reparseModalOpen).toBe(false)
      }
    },
  )

  it('route change makes the old result cache-only without touching new dialog/selection or toast', async () => {
    let resolve!: () => void
    mocks.ingest.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done
        }),
    )
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await select('a')
    await open()
    await confirm()
    await act(async () => navigate('/knowledge/two/documents'))
    await act(async () => {
      await new Promise((done) => setTimeout(done, 25))
    })
    await select('b')
    await open()
    await act(async () => resolve())
    expect([...state.selectedDocs]).toEqual(['b'])
    expect(modals.reparseModalOpen).toBe(true)
    expect(modals.reparsingDocs.map((doc) => doc.id)).toEqual(['b'])
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.warning).not.toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: documentKeys.datasetLists('one'),
    })
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: documentKeys.datasetLists('two'),
    })
  })
})

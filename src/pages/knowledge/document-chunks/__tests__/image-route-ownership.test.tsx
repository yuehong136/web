import { act, useEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { knowledgeAPI } from '@/api/knowledge'
import { apiClient } from '@/api/client'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth'
import type { UserInfo } from '@/types/api'
import { DocumentImage } from '@/components/knowledge/document-image'
import { ChunkEditOverlay } from '../components/chunk-edit-overlay'
import { useDocumentChunksController } from '../hooks/use-document-chunks-controller'
import * as utilities from '@/lib/utils'
import type { UploadFile } from '@/components/ui/file-uploader'
import type { ChunkData } from '../types'
import { ChunkSideSheet } from '../components/document-chunks-shell'
import { ChunkMetadataModal } from '../components/chunk-metadata-modal'

vi.mock('@/components/knowledge/document-preview', () => ({
  DocumentPreview: () => null,
}))

const KB = 'a'.repeat(32)
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])
const list = (doc: string) => ({
  total: 1,
  doc: { id: doc, name: doc },
  chunks: [
    {
      chunk_id: `chunk-${doc}`,
      doc_id: doc,
      docnm_kwd: doc,
      content_with_weight: doc,
      important_kwd: [],
      question_kwd: [],
      img_id: `${KB}-${doc}.png`,
      available_int: 1,
      positions: [],
      doc_type_kwd: 'image',
    },
  ],
})
let root: Root
let container: HTMLDivElement
let controller: ReturnType<typeof useDocumentChunksController>
let navigate: ReturnType<typeof useNavigate>
let calls: { url: string; signal: AbortSignal }[]
let nextUrl: number
function Surface() {
  const currentNavigate = useNavigate()
  const currentController = useDocumentChunksController()
  useEffect(() => {
    navigate = currentNavigate
    controller = currentController
  }, [currentNavigate, currentController])
  return (
    <>
      <output>
        {currentController.list.docId}|
        {currentController.list.docInfo?.name ?? 'pending'}
      </output>
      {currentController.list.chunks.map((chunk: ChunkData) => (
        <DocumentImage
          key={chunk.chunk_id}
          source={{ kind: 'dataset', imageId: chunk.img_id }}
          alt={chunk.docnm_kwd}
        />
      ))}
      {currentController.editForm.selectedChunk && (
        <ChunkEditOverlay
          selectedChunk={currentController.editForm.selectedChunk}
          editingChunkContent={currentController.editForm.editingChunkContent}
          onEditingChunkContentChange={
            currentController.editForm.setEditingChunkContent
          }
          editingImportantKwd={currentController.editForm.editingImportantKwd}
          onEditingImportantKwdChange={
            currentController.editForm.setEditingImportantKwd
          }
          editingQuestionKwd={currentController.editForm.editingQuestionKwd}
          onEditingQuestionKwdChange={
            currentController.editForm.setEditingQuestionKwd
          }
          editingImage={currentController.editForm.editingImage}
          onEditingImageChange={currentController.editForm.setEditingImage}
          isMarkdownPreview={currentController.editForm.isMarkdownPreview}
          onMarkdownPreviewChange={
            currentController.editForm.setIsMarkdownPreview
          }
          onCancel={currentController.editForm.reset}
          onSave={currentController.handleEditChunk}
          onPreviewImage={currentController.setPreviewImageId}
        />
      )}
    </>
  )
}
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
// Query results, blob reads and decoding land on later macrotasks with no
// bounded duration, so wait for the observable outcome instead of a fixed delay.
// The bound only detects hangs; keep it well above a render under parallel load.
async function waitForState(check: () => void) {
  await vi.waitFor(
    async () => {
      await flush()
      check()
    },
    { timeout: 4000 },
  )
}
const imageSource = (alt: string) =>
  container.querySelector(`img[alt="${alt}"]`)?.getAttribute('src')
async function waitForDocument(doc: string) {
  await waitForState(() => {
    expect(controller.list.docInfo?.name).toBe(doc)
    expect(imageSource(doc)).toMatch(/^blob:/)
  })
}
async function openDocument(doc: string) {
  await act(async () => navigate(`/knowledge/${KB}/documents/${doc}/chunks`))
  await waitForDocument(doc)
}
beforeEach(async () => {
  calls = []
  nextUrl = 0
  queryClient.clear()
  apiClient.setAuthToken('owner-a')
  useAuthStore.setState({
    user: { id: 'owner-a' } as UserInfo,
    token: 'owner-a',
    isAuthenticated: true,
  })
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ close: vi.fn() })),
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, config) => {
      calls.push({ url: String(url), signal: config.signal })
      return new Response(PNG, { headers: { 'Content-Type': 'image/png' } })
    }),
  )
  URL.createObjectURL = vi.fn(() => `blob:route-${++nextUrl}`)
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(knowledgeAPI.document, 'listChunks').mockImplementation(
    async ({ doc_id }) => list(doc_id) as never,
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[`/knowledge/${KB}/documents/doc-a/chunks`]}
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
  await waitForDocument('doc-a')
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  queryClient.clear()
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  apiClient.setAuthToken(null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('shows the existing canonical image in the edit panel when the wire omits its type', async () => {
  const chunk = { ...controller.list.chunks[0], doc_type_kwd: undefined }
  await act(async () => controller.handleStartEdit(chunk))
  await waitForState(() =>
    expect(container.querySelectorAll('img')).toHaveLength(2),
  )
  expect(container.querySelectorAll('img')[1].getAttribute('src')).toBe(
    'blob:route-1',
  )
  expect(chunk.doc_type_kwd).toBeUndefined()
})
it('clears rows and existing edit images immediately while another document is pending', async () => {
  expect(container.querySelector('img')?.getAttribute('src')).toBe(
    'blob:route-1',
  )
  await act(async () => controller.handleStartEdit(controller.list.chunks[0]))
  const nativeFile = new File(['local replacement'], 'replacement.png', {
    type: 'image/png',
  })
  await act(async () => controller.editForm.setEditingImage([nativeFile]))
  let resolveB!: (value: unknown) => void
  vi.mocked(knowledgeAPI.document.listChunks).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveB = resolve as never
      }),
  )
  await act(async () => navigate(`/knowledge/${KB}/documents/doc-b/chunks`))
  expect(controller.list.docId).toBe('doc-b')
  expect(controller.list.loading).toBe(true)
  expect(container.querySelector('img')).toBeNull()
  expect(controller.editForm.selectedChunk).toBeNull()
  expect(controller.editForm.editingImage).toEqual([])
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:route-1')
  await act(async () => resolveB(list('doc-b')))
  await waitForDocument('doc-b')
  expect(container.querySelector('img')?.getAttribute('alt')).toBe('doc-b')
  expect(container.textContent).not.toContain('doc-a')
})
it('retains the current document placeholder and exact native File while paging', async () => {
  await act(async () => controller.handleStartEdit(controller.list.chunks[0]))
  const nativeFile = new File(['local'], 'replacement.png', {
    type: 'image/png',
  })
  await act(async () => controller.editForm.setEditingImage([nativeFile]))
  let finishPage!: (value: unknown) => void
  vi.mocked(knowledgeAPI.document.listChunks).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishPage = resolve as never
      }),
  )
  await act(async () => controller.list.setPage(2))
  expect(controller.list.docInfo?.name).toBe('doc-a')
  expect(controller.list.chunks).toHaveLength(1)
  expect(controller.editForm.editingImage[0]).toBe(nativeFile)
  expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  await act(async () => finishPage(list('doc-a')))
  await waitForState(() =>
    expect(controller.list.isPlaceholderData).toBe(false),
  )
})
it('aborts a pending old image when the route changes and ignores its late response', async () => {
  await openDocument('doc-late')
  let late!: (response: Response) => void
  let oldSignal: AbortSignal | undefined
  const read = vi.spyOn(apiClient, 'get')
  vi.stubGlobal(
    'fetch',
    vi.fn((url, config) => {
      if (String(url).includes('doc-pending')) {
        oldSignal = config.signal
        return new Promise((resolve) => {
          late = resolve
        })
      }
      return Promise.resolve(
        new Response(PNG, { headers: { 'Content-Type': 'image/png' } }),
      )
    }),
  )
  await act(async () =>
    navigate(`/knowledge/${KB}/documents/doc-pending/chunks`),
  )
  await waitForState(() => expect(oldSignal).toBeDefined())
  const oldRead = read.mock.results[
    read.mock.calls.findIndex(([url]) => url.includes('doc-pending'))
  ].value as Promise<unknown>
  await openDocument('doc-new')
  expect(oldSignal?.aborted).toBe(true)
  const created = vi.mocked(URL.createObjectURL).mock.calls.length
  await act(async () =>
    late(new Response(PNG, { headers: { 'Content-Type': 'image/png' } })),
  )
  await expect(oldRead).rejects.toMatchObject({ name: 'AbortError' })
  await flush()
  expect(URL.createObjectURL).toHaveBeenCalledTimes(created)
  expect(container.querySelector('img')?.getAttribute('alt')).toBe('doc-new')
})

it('resets document-owned selection, forms, delete dialogs, and pagination on navigation', async () => {
  await act(async () => {
    controller.selection.toggleSingle(controller.list.chunks[0].chunk_id, true)
    controller.addForm.open()
    controller.addForm.setContent('Draft for document A')
    controller.handleStartMetaAnnotation()
    controller.metaForm.addField()
    controller.deleteState.openDeleteSingle(controller.list.chunks[0].chunk_id)
    controller.deleteState.openBulkDelete()
    controller.list.setPage(2)
  })
  await waitForState(() =>
    expect(controller.list.isPlaceholderData).toBe(false),
  )
  await openDocument('doc-b')
  expect(controller.list.page).toBe(1)
  expect(controller.selection.selectedChunkIds).toEqual([])
  expect(controller.addForm.addChunkModalOpen).toBe(false)
  expect(controller.addForm.content).toBe('')
  expect(controller.metaForm.metaModalOpen).toBe(false)
  expect(controller.metaForm.editingMeta).toEqual([])
  expect(controller.deleteState.deleteConfirmOpen).toBe(false)
  expect(controller.deleteState.deleteSelectedConfirmOpen).toBe(false)
  expect(controller.deleteState.deletingChunkId).toBe('')
})

it('clears an uploaded replacement when another chunk is selected or edited', async () => {
  const document = list('doc-a')
  document.chunks.push({ ...document.chunks[0], chunk_id: 'other-chunk' })
  vi.mocked(knowledgeAPI.document.listChunks).mockResolvedValue(
    document as never,
  )
  await act(async () => controller.list.refetchChunkList())
  const file = new File(['replacement'], 'replacement.png', {
    type: 'image/png',
  })
  await act(async () => controller.handleStartEdit(controller.list.chunks[0]))
  await act(async () => controller.editForm.setEditingImage([file]))
  await act(async () => controller.handleStartEdit(controller.list.chunks[1]))
  expect(controller.editForm.editingImage).toEqual([])
  expect(controller.editForm.selectedChunk?.chunk_id).toBe('other-chunk')
  await act(async () => controller.editForm.setEditingImage([file]))
  await act(async () => controller.handleSelectChunk(controller.list.chunks[0]))
  expect(controller.editForm.isEditMode).toBe(false)
  expect(controller.editForm.editingImage).toEqual([])
})

it('does not submit a superseded image conversion into another document', async () => {
  let finishImage!: (image: string) => void
  vi.spyOn(utilities, 'fileToBase64').mockImplementation(
    () =>
      new Promise((resolve) => {
        finishImage = resolve
      }),
  )
  const create = vi
    .spyOn(knowledgeAPI.document, 'createChunk')
    .mockResolvedValue(true)
  await act(async () => {
    controller.addForm.open()
    controller.addForm.setContent('Document A draft')
    controller.addForm.setImage([
      new File(['image'], 'image.png', { type: 'image/png' }) as UploadFile,
    ])
  })
  let first!: Promise<void>
  await act(async () => {
    first = controller.handleCreateChunk()
  })
  expect(controller.pending.create).toBe(true)
  await act(async () => controller.handleCreateChunk())
  expect(utilities.fileToBase64).toHaveBeenCalledTimes(1)
  await openDocument('doc-b')
  await act(async () => {
    controller.addForm.open()
    controller.addForm.setContent('Document B draft')
  })
  await act(async () => {
    finishImage('aW1hZ2U=')
    await first
  })
  expect(create).not.toHaveBeenCalled()
  expect(controller.addForm.addChunkModalOpen).toBe(true)
  expect(controller.addForm.content).toBe('Document B draft')
  expect(controller.pending.create).toBe(false)
})

it('keeps the submitted document owner and preserves a newer form after late success', async () => {
  let finishCreate!: (result: boolean) => void
  const create = vi
    .spyOn(knowledgeAPI.document, 'createChunk')
    .mockImplementation(
      () =>
        new Promise((resolve) => {
          finishCreate = resolve
        }),
    )
  await act(async () => {
    controller.addForm.open()
    controller.addForm.setContent('Document A draft')
  })
  let first!: Promise<void>
  await act(async () => {
    first = controller.handleCreateChunk()
  })
  expect(create.mock.calls[0]?.[0]).toMatchObject({
    kb_id: KB,
    doc_id: 'doc-a',
    content_with_weight: 'Document A draft',
  })
  await openDocument('doc-b')
  await act(async () => {
    controller.addForm.open()
    controller.addForm.setContent('Document B draft')
  })
  await act(async () => {
    finishCreate(true)
    await first
  })
  expect(controller.addForm.addChunkModalOpen).toBe(true)
  expect(controller.addForm.content).toBe('Document B draft')
  expect(controller.list.docId).toBe('doc-b')
})

it('suppresses duplicate create requests and preserves the draft after failure', async () => {
  let rejectCreate!: (reason: Error) => void
  const create = vi
    .spyOn(knowledgeAPI.document, 'createChunk')
    .mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectCreate = reject
        }),
    )
  await act(async () => {
    controller.addForm.open()
    controller.addForm.setContent('Recoverable draft')
    controller.addForm.setImportantKwd(['retained keyword'])
  })
  let first!: Promise<void>
  await act(async () => {
    first = controller.handleCreateChunk()
  })
  await act(async () => controller.handleCreateChunk())
  expect(create).toHaveBeenCalledTimes(1)
  expect(controller.pending.create).toBe(true)
  await act(async () => {
    rejectCreate(new Error('Private backend details'))
    await first
  })
  expect(controller.pending.create).toBe(false)
  expect(controller.addForm.addChunkModalOpen).toBe(true)
  expect(controller.addForm.content).toBe('Recoverable draft')
  expect(controller.addForm.importantKwd).toEqual(['retained keyword'])
  expect(document.body.textContent).not.toContain('Private backend details')
})

it('preserves an editing draft after failure and suppresses duplicate saves', async () => {
  let rejectSave!: (reason: Error) => void
  const save = vi.spyOn(knowledgeAPI.document, 'setChunk').mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        rejectSave = reject
      }),
  )
  await act(async () => controller.handleStartEdit(controller.list.chunks[0]))
  await act(async () => {
    controller.editForm.setEditingChunkContent('Edited content')
    controller.editForm.setEditingImportantKwd(['important'])
  })
  let first!: Promise<void>
  await act(async () => {
    first = controller.handleEditChunk()
  })
  await act(async () => controller.handleEditChunk())
  expect(save).toHaveBeenCalledTimes(1)
  expect(save.mock.calls[0]?.[0]).toMatchObject({
    kb_id: KB,
    doc_id: 'doc-a',
    content_with_weight: 'Edited content',
    image_base64: undefined,
  })
  await act(async () => {
    rejectSave(new Error('Private error'))
    await first
  })
  expect(controller.editForm.isEditMode).toBe(true)
  expect(controller.editForm.editingChunkContent).toBe('Edited content')
  expect(controller.editForm.editingImportantKwd).toEqual(['important'])
  expect(controller.pending.save).toBe(false)
})

it('does not clear a new document selection when an old bulk mutation finishes', async () => {
  let finishSwitch!: (result: boolean) => void
  const toggle = vi
    .spyOn(knowledgeAPI.document, 'switchChunks')
    .mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSwitch = resolve
        }),
    )
  await act(async () => controller.handleSelectAll(true))
  let first!: Promise<void>
  await act(async () => {
    first = controller.handleBulkDisable()
  })
  await act(async () => controller.handleBulkDisable())
  expect(toggle).toHaveBeenCalledTimes(1)
  expect(toggle.mock.calls[0]?.[0]).toMatchObject({
    kb_id: KB,
    doc_id: 'doc-a',
    available_int: 0,
  })
  await openDocument('doc-b')
  await act(async () => controller.handleSelectAll(true))
  const currentSelection = [...controller.selection.selectedChunkIds]
  await act(async () => {
    finishSwitch(true)
    await first
  })
  expect(controller.selection.selectedChunkIds).toEqual(currentSelection)
  expect(controller.pending.bulkSwitch).toBe(false)
})

it('returns to the last valid page after a refreshed page becomes empty', async () => {
  vi.mocked(knowledgeAPI.document.listChunks).mockImplementation(
    async ({ page }) =>
      ({
        ...list('doc-a'),
        chunks: page === 2 ? [] : list('doc-a').chunks,
      }) as never,
  )
  await act(async () => controller.list.setPage(2))
  await waitForState(() => {
    expect(controller.list.page).toBe(1)
    expect(controller.list.chunks).toHaveLength(1)
  })
})

it('does not mistake unrelated selected IDs for all visible chunks', async () => {
  await act(async () =>
    controller.selection.toggleSingle('unrelated-chunk', true),
  )
  expect(
    controller.selection.isAllSelected(controller.list.filteredChunks),
  ).toBe(false)
  expect(
    controller.selection.isPartialSelected(controller.list.filteredChunks),
  ).toBe(false)
  await act(async () => controller.handleSelectAll(true))
  expect(
    controller.selection.isAllSelected(controller.list.filteredChunks),
  ).toBe(true)
})

it('cannot open or save empty metadata before the document has been read', async () => {
  let finishList!: (value: unknown) => void
  vi.mocked(knowledgeAPI.document.listChunks).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishList = resolve as never
      }),
  )
  const update = vi
    .spyOn(knowledgeAPI.metadata, 'updateDocumentMeta')
    .mockResolvedValue(undefined as never)
  await act(async () =>
    navigate(`/knowledge/${KB}/documents/doc-pending/chunks`),
  )
  expect(controller.list.loading).toBe(true)
  expect(controller.list.docInfo).toBeNull()
  await act(async () => controller.handleStartMetaAnnotation())
  expect(controller.metaForm.metaModalOpen).toBe(false)
  await act(async () => controller.handleSaveMeta())
  expect(update).not.toHaveBeenCalled()
  await act(async () => finishList(list('doc-pending')))
  await waitForDocument('doc-pending')
  await act(async () => controller.handleStartMetaAnnotation())
  expect(controller.metaForm.metaModalOpen).toBe(true)
})

it('allows a metadata dialog inside a sheet to own focus and escape independently', async () => {
  function NestedMetadata() {
    const [open, setOpen] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(true)
    return (
      <ChunkSideSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Document info"
      >
        <button onClick={() => setOpen(true)}>Edit metadata</button>
        <ChunkMetadataModal
          open={open}
          onClose={() => setOpen(false)}
          editingMeta={[{ id: 'field', key: 'owner', value: 'value' }]}
          onAddMetaField={() => {}}
          onRemoveMetaField={() => {}}
          onUpdateMetaKey={() => {}}
          onUpdateMetaValue={() => {}}
          onSaveMeta={() => {}}
        />
      </ChunkSideSheet>
    )
  }
  await act(async () => root.render(<NestedMetadata />))
  const edit = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === 'Edit metadata',
  )!
  await act(async () => edit.click())
  const input = document.querySelector<HTMLInputElement>(
    '#chunk-meta-field-key',
  )!
  await act(async () => input.focus())
  expect(document.activeElement).toBe(input)
  expect(input.closest('[role="dialog"]')?.getAttribute('style')).toContain(
    'pointer-events: auto',
  )
  await act(async () =>
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  await waitForState(() =>
    expect(document.querySelector('#chunk-meta-field-key')).toBeNull(),
  )
  expect(document.body.textContent).toContain('Edit metadata')
})

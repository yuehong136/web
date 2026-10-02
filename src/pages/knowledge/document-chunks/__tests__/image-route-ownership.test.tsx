import { act, useEffect } from 'react'
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
import type { ChunkData } from '../types'

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
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 15))
  })
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
  await settle()
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
  await settle()
  expect(container.querySelectorAll('img')).toHaveLength(2)
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
  await settle()
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
  await settle()
})
it('aborts a pending old image when the route changes and ignores its late response', async () => {
  await act(async () => navigate(`/knowledge/${KB}/documents/doc-late/chunks`))
  await settle()
  let late!: (response: Response) => void
  let oldSignal!: AbortSignal
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
  await settle()
  await act(async () => navigate(`/knowledge/${KB}/documents/doc-new/chunks`))
  await settle()
  expect(oldSignal.aborted).toBe(true)
  const created = vi.mocked(URL.createObjectURL).mock.calls.length
  await act(async () =>
    late(new Response(PNG, { headers: { 'Content-Type': 'image/png' } })),
  )
  await settle()
  expect(URL.createObjectURL).toHaveBeenCalledTimes(created)
  expect(container.querySelector('img')?.getAttribute('alt')).toBe('doc-new')
})

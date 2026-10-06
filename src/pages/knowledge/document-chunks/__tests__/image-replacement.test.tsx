import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { knowledgeAPI } from '@/api/knowledge'
import { apiClient } from '@/api/client'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth'
import i18n from '@/locales/i18n'
import type { UserInfo } from '@/types/api'
import { DocumentImage } from '@/components/knowledge/document-image'
import {
  evictDocumentImage,
  getDocumentImageEpoch,
} from '@/lib/document-image-resources'
import * as utilities from '@/lib/utils'
import { useDocumentChunksController } from '../hooks/use-document-chunks-controller'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
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
      img_id: `${KB}-chunk-${doc}`,
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
let reads: { url: string; signal: AbortSignal }[]
let bodies: Record<string, unknown>[]
let code: number
function Surface() {
  const current = useDocumentChunksController()
  const currentNavigate = useNavigate()
  useEffect(() => {
    controller = current
    navigate = currentNavigate
  }, [current, currentNavigate])
  return (
    <>
      {current.list.chunks.map((chunk) => (
        <DocumentImage
          key={chunk.chunk_id}
          source={{ kind: 'dataset', imageId: chunk.img_id }}
          alt={chunk.docnm_kwd}
        />
      ))}
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
const imageSource = () => container.querySelector('img')?.src
async function waitForDocument(doc: string) {
  await waitForState(() => {
    expect(controller.list.docInfo?.name).toBe(doc)
    expect(
      container.querySelector<HTMLImageElement>(`img[alt="${doc}"]`)?.src,
    ).toMatch(/^blob:/)
  })
}
async function openDocument(doc: string) {
  await act(async () => navigate(`/knowledge/${KB}/documents/${doc}/chunks`))
  await waitForDocument(doc)
}
const replacement = () =>
  new File(['replacement'], 'replacement.png', { type: 'image/png' })
async function editImage() {
  await act(async () => controller.handleStartEdit(controller.list.chunks[0]))
  await act(async () => controller.editForm.setEditingImage([replacement()]))
}
beforeEach(async () => {
  reads = []
  bodies = []
  code = 0
  queryClient.clear()
  useAuthStore.setState({
    user: { id: 'owner' } as UserInfo,
    token: 'owner',
    isAuthenticated: true,
  })
  apiClient.setAuthToken('owner')
  let nextUrl = 0
  URL.createObjectURL = vi.fn(() => `blob:replace-${++nextUrl}`)
  URL.revokeObjectURL = vi.fn()
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ close: vi.fn() })),
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, init) => {
      if (init.method === 'PATCH') {
        bodies.push(JSON.parse(init.body))
        return new Response(
          JSON.stringify({ code, message: 'PRIVATE', data: {} }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      }
      reads.push({ url: String(url), signal: init.signal })
      return new Response(PNG, { headers: { 'Content-Type': 'image/png' } })
    }),
  )
  vi.spyOn(knowledgeAPI.document, 'listChunks').mockImplementation(
    async ({ doc_id }) => list(doc_id) as never,
  )
  vi.spyOn(utilities, 'fileToBase64').mockResolvedValue('aW1hZ2U=')
  await i18n.changeLanguage('en-US')
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
  vi.mocked(toast.error).mockClear()
})
it('content-only edits omit mode and keep the existing image bytes', async () => {
  await act(async () => controller.handleStartEdit(controller.list.chunks[0]))
  await act(async () => controller.handleEditChunk())
  expect(bodies[0]).not.toHaveProperty('image_update_mode')
  expect(bodies[0]).not.toHaveProperty('image_base64')
  expect(reads).toHaveLength(1)
  expect(URL.revokeObjectURL).not.toHaveBeenCalled()
})
it('successful replacement sends replace, drops the old blob and rereads the unchanged ID', async () => {
  await editImage()
  await act(async () => controller.handleEditChunk())
  await waitForState(() => expect(imageSource()).toBe('blob:replace-2'))
  expect(bodies[0]).toMatchObject({
    image_update_mode: 'replace',
    image_base64: 'aW1hZ2U=',
  })
  expect(bodies[0]).not.toHaveProperty('imageId')
  expect(reads).toHaveLength(2)
  expect(reads[0].url).toBe(reads[1].url)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:replace-1')
  expect(controller.editForm.selectedChunk).toBeNull()
  expect(toast.error).not.toHaveBeenCalled()
})
it.each(['en-US', 'zh-CN'])(
  'business failure preserves replacement and old image with safe %s feedback',
  async (language) => {
    await i18n.changeLanguage(language)
    code = 102
    await editImage()
    await act(async () => controller.handleEditChunk())
    expect(controller.editForm.editingImage[0].name).toBe('replacement.png')
    expect(controller.editForm.isEditMode).toBe(true)
    expect(reads).toHaveLength(1)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      i18n.t('knowledge.chunks.errors.save'),
    )
    expect(JSON.stringify(vi.mocked(toast.error).mock.calls)).not.toContain(
      'PRIVATE',
    )
  },
)
it('an empty image conversion fails without silently preserving the previous image', async () => {
  vi.mocked(utilities.fileToBase64).mockResolvedValue('')
  await editImage()
  await act(async () => controller.handleEditChunk())
  expect(bodies).toHaveLength(0)
  expect(controller.editForm.editingImage).toHaveLength(1)
  expect(toast.error).toHaveBeenCalledWith(
    i18n.t('knowledge.chunks.errors.save'),
  )
})
it('acknowledged save remains successful when image readback fails and allows retry', async () => {
  await editImage()
  const fetchImage = globalThis.fetch
  let failRead = true
  vi.stubGlobal(
    'fetch',
    vi.fn((url, init) =>
      init?.method !== 'PATCH' && failRead
        ? Promise.resolve(
            new Response(JSON.stringify({ code: 102, message: 'PRIVATE' }), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )
        : fetchImage(url, init),
    ),
  )
  await act(async () => controller.handleEditChunk())
  // Only the failed-read feedback renders a (retry) button.
  await waitForState(() =>
    expect(container.querySelector('button')).not.toBeNull(),
  )
  expect(controller.editForm.selectedChunk).toBeNull()
  expect(container.querySelector('img')).toBeNull()
  expect(toast.error).not.toHaveBeenCalled()
  expect(container.textContent).not.toContain('PRIVATE')
  failRead = false
  await act(async () =>
    container.querySelector<HTMLButtonElement>('button')!.click(),
  )
  await waitForState(() => expect(imageSource()).toBe('blob:replace-2'))
})

it('an older edit conversion never writes into the new document', async () => {
  let finish!: (value: string) => void
  vi.mocked(utilities.fileToBase64).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  await editImage()
  let pending!: Promise<void>
  await act(async () => {
    pending = controller.handleEditChunk()
  })
  await openDocument('doc-b')
  await act(async () => {
    finish('aW1hZ2U=')
    await pending
  })
  expect(bodies).toHaveLength(0)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:replace-1')
  expect(container.querySelector('img')?.alt).toBe('doc-b')
})
it('late successful replacement evicts only its own document and leaves newer edits intact', async () => {
  let finish!: (value: boolean) => void
  const save = vi.spyOn(knowledgeAPI.document, 'setChunk').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  await editImage()
  let pending!: Promise<void>
  await act(async () => {
    pending = controller.handleEditChunk()
  })
  await openDocument('doc-b')
  await editImage()
  const oldRevocations = vi.mocked(URL.revokeObjectURL).mock.calls.length
  await act(async () => {
    finish(true)
    await pending
  })
  await flush()
  expect(save.mock.calls[0][0]).toMatchObject({
    doc_id: 'doc-a',
    image_update_mode: 'replace',
  })
  expect(controller.editForm.selectedChunk?.doc_id).toBe('doc-b')
  expect(controller.editForm.editingImage[0].name).toBe('replacement.png')
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(oldRevocations)
  expect(reads).toHaveLength(2)
})
it('eviction cancels an older same-ID read; its late bytes cannot restore the stale blob', async () => {
  let oldRead!: (value: Response) => void
  let oldSignal: AbortSignal | undefined
  let readCount = 0
  const read = vi.spyOn(apiClient, 'get')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      if (++readCount === 1) {
        oldSignal = init.signal
        return new Promise<Response>((resolve) => {
          oldRead = resolve
        })
      }
      return new Response(PNG, { headers: { 'Content-Type': 'image/png' } })
    }),
  )
  await act(async () =>
    evictDocumentImage(list('doc-a').chunks[0].img_id, getDocumentImageEpoch()),
  )
  await waitForState(() => expect(oldSignal).toBeDefined())
  const oldRequest = read.mock.results[0].value as Promise<unknown>
  await act(async () =>
    evictDocumentImage(list('doc-a').chunks[0].img_id, getDocumentImageEpoch()),
  )
  await waitForState(() => expect(imageSource()).toBe('blob:replace-2'))
  expect(oldSignal?.aborted).toBe(true)
  const created = vi.mocked(URL.createObjectURL).mock.calls.length
  await act(async () =>
    oldRead(new Response(PNG, { headers: { 'Content-Type': 'image/png' } })),
  )
  await expect(oldRequest).rejects.toMatchObject({ name: 'AbortError' })
  await flush()
  expect(URL.createObjectURL).toHaveBeenCalledTimes(created)
  expect(imageSource()).toBe('blob:replace-2')
})

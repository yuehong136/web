import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth'
import type { UserInfo } from '@/types/api'
import i18n from '@/locales/i18n'
import {
  evictDocumentImage,
  getDocumentImageEpoch,
} from '@/lib/document-image-resources'
import { DocumentImage, DocumentImagePreviewProvider } from '../document-image'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { ImageCarousel } from '@/components/chat/ImageCarousel'
import { ExploreMessageAttachments } from '@/pages/explore/components/message-attachments'
import { ChunkImagePreviewModal } from '@/pages/knowledge/document-chunks/components/chunk-image-preview-modal'
import { ChunkEditImageSection } from '@/pages/knowledge/document-chunks/components/chunk-edit-image-section'
import SearchSummaryCard from '@/pages/search/detail/components/search-summary-card'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { ChunkData } from '@/pages/knowledge/document-chunks/types'
import type { UploadedFileInfo } from '@/config/chat'

// Mermaid is unrelated to image ownership; its Node-only Prism import cannot resolve.
vi.mock('@ant-design/x', () => ({ Mermaid: () => null }))
vi.mock('@/components/chat/CodeBlock', () => ({ CodeBlock: () => null }))

const KB = 'a'.repeat(32)
const FILE = 'b'.repeat(32)
const ID = `${KB}-folder/picture 10%.png`
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])
const response = (status = 200, code = 0) =>
  status === 200
    ? new Response(PNG, { headers: { 'Content-Type': 'image/png' } })
    : new Response(
        JSON.stringify({ code, message: 'PRIVATE KEY OWNER', data: null }),
        { status, headers: { 'Content-Type': 'application/json' } },
      )
const chunk: ReferenceChunk = {
  id: 'chunk',
  content: 'body',
  dataset_id: KB,
  document_id: FILE,
  document_name: 'image',
  image_id: ID,
  doc_type_kwd: 'image',
}
function session(owner = 'owner-a', token = 'token-a') {
  apiClient.setAuthToken(token)
  useAuthStore.setState({
    user: { id: owner } as UserInfo,
    token,
    isAuthenticated: true,
  })
}

describe('actual image consumers and authenticated resource ownership', () => {
  let container: HTMLDivElement
  let root: Root
  let nextUrl: number
  const requests: { url: string; signal: AbortSignal }[] = []
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
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }))
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ close: vi.fn() })),
    )
    nextUrl = 0
    requests.length = 0
    URL.createObjectURL = vi.fn(() => `blob:owned-${++nextUrl}`)
    URL.revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, config) => {
        requests.push({ url: String(url), signal: config.signal })
        return response()
      }),
    )
    queryClient.clear()
    session()
    await i18n.changeLanguage('en-US')
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
    apiClient.setAuthToken(null)
    queryClient.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
  async function render(content: React.ReactNode) {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          {content}
        </QueryClientProvider>,
      )
      await new Promise((resolve) => setTimeout(resolve, 25))
    })
    await act(async () => new Promise((resolve) => setTimeout(resolve, 25)))
  }
  const image = (id = ID) => (
    <DocumentImage
      source={{ kind: 'dataset', imageId: id }}
      alt="owned image"
    />
  )

  it('two consumers share one fetched blob; unmount releases only the last lease', async () => {
    await render(
      <>
        {image()}
        {image()}
      </>,
    )
    expect(requests).toHaveLength(1)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect([...container.querySelectorAll('img')].map((x) => x.src)).toEqual([
      'blob:owned-1',
      'blob:owned-1',
    ])
    await render(image())
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    await render(null)
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:owned-1')
  })
  it('source change hides/revokes old image and consumes the new URL', async () => {
    await render(image())
    await render(image(`${KB}-second.png`))
    expect(requests).toHaveLength(2)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned-1')
    expect(container.querySelector('img')?.src).toBe('blob:owned-2')
  })
  it('owner/token switch closes fullscreen and never carries the old blob into new queries', async () => {
    await render(
      <DocumentImagePreviewProvider resetKey={ID}>
        <DocumentImage
          source={{ kind: 'dataset', imageId: ID }}
          alt="preview"
          preview
        />
      </DocumentImagePreviewProvider>,
    )
    await act(async () =>
      container.querySelector<HTMLButtonElement>('button')!.click(),
    )
    expect(document.querySelector('.PhotoView-Slider__Backdrop')).not.toBeNull()
    await act(async () => session('owner-b', 'token-b'))
    expect(document.querySelector('.PhotoView-Slider__Backdrop')).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned-1')
    expect(container.querySelector('img')?.src).not.toBe('blob:owned-1')
    expect(
      JSON.stringify(
        queryClient
          .getQueryCache()
          .getAll()
          .map((q) => q.queryKey),
      ),
    ).not.toContain('token-')
  })
  it('source switch aborts the actual old request; a late response cannot create its blob', async () => {
    let finish!: (r: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, config) => {
        requests.push({ url: String(url), signal: config.signal })
        if (String(url).includes('picture'))
          return new Promise<Response>((resolve) => {
            finish = resolve
          })
        return response()
      }),
    )
    await render(image())
    await render(image(`${KB}-second.png`))
    expect(requests[0].signal.aborted).toBe(true)
    await act(async () => {
      finish(response())
      await new Promise((resolve) => setTimeout(resolve, 25))
    })
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(container.querySelector('img')?.src).toBe('blob:owned-1')
  })
  it('logout aborts a pending fetch, renders safe auth feedback, and ignores late resolution', async () => {
    let finish!: (r: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, config) => {
        requests.push({ url: String(url), signal: config.signal })
        return new Promise<Response>((resolve) => {
          finish = resolve
        })
      }),
    )
    await render(image())
    await act(async () =>
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
    )
    expect(requests[0].signal.aborted).toBe(true)
    await act(async () => {
      finish(response())
      await new Promise((resolve) => setTimeout(resolve, 25))
    })
    expect(container.querySelector('img')).toBeNull()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Sign in')
  })
  it.each([
    [404, 102],
    [415, 102],
    [500, 500],
  ])(
    'HTTP%s has fixed bilingual error, no blob, and explicit successful retry',
    async (status, code) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => response(status, code)),
      )
      await render(image())
      expect(URL.createObjectURL).not.toHaveBeenCalled()
      expect(container.textContent).not.toContain('PRIVATE')
      expect(container.querySelector('button')?.textContent).toBe('Retry image')
      await act(async () => i18n.changeLanguage('zh-CN'))
      expect(container.textContent).toContain(
        status === 415 ? '图片数据无效' : '图片暂不可用',
      )
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => response()),
      )
      await act(async () =>
        container.querySelector<HTMLButtonElement>('button')!.click(),
      )
      await render(image())
      expect(container.querySelector('img')?.src).toBe('blob:owned-1')
    },
  )
  it('real ReferenceImageList and ImageCarousel consume doc_type_kwd and keyed reference positions', async () => {
    const references = [{ ...chunk, reference_index: 3 }]
    await render(
      <>
        <ReferenceImageList
          referenceChunks={references}
          messageContent="answer[ID:3]"
        />
        <ImageCarousel
          chunks={references}
          group={[{ id: '3', fullMatch: '[ID:3]', start: 0, end: 6 }]}
        />
      </>,
    )
    expect(requests).toHaveLength(1)
    expect(container.querySelectorAll('img[src="blob:owned-1"]')).toHaveLength(
      2,
    )
    expect(container.textContent).toContain('Fig. 4')
  })
  it('reference image preview and citation caption perform separate actions', async () => {
    const onImageClick = vi.fn()
    await render(
      <ReferenceImageList
        referenceChunks={[chunk]}
        messageContent="answer[ID:0]"
        onImageClick={onImageClick}
      />,
    )
    await act(async () =>
      container.querySelector<HTMLImageElement>('img')!.click(),
    )
    expect(document.querySelector('.PhotoView-Slider__Backdrop')).not.toBeNull()
    expect(onImageClick).not.toHaveBeenCalled()
    await render(null)
    expect(document.querySelector('.PhotoView-Slider__Backdrop')).toBeNull()
    await render(
      <ReferenceImageList
        referenceChunks={[chunk]}
        messageContent="answer[ID:0]"
        onImageClick={onImageClick}
      />,
    )
    const caption = [
      ...container.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent === 'Fig. 1')!
    await act(async () => caption.click())
    expect(onImageClick).toHaveBeenCalledExactlyOnceWith(chunk, 0)
    expect(document.querySelector('.PhotoView-Slider__Backdrop')).toBeNull()
  })
  it('actual Search summary maps real img_id/doc_type_kwd while text with img_id stays text', async () => {
    const wire = {
      chunk_id: 'c',
      doc_id: FILE,
      docnm_kwd: 'image',
      kb_id: KB,
      text: 'content',
      similarity: 1,
      vector_similarity: 1,
      term_similarity: 0,
      img_id: ID,
      doc_type_kwd: 'table',
    }
    await render(
      <SearchSummaryCard
        summary="result[ID:0]"
        isStreaming={false}
        references={[wire]}
        onViewDetail={() => {}}
      />,
    )
    expect(container.querySelector('img[src="blob:owned-1"]')).not.toBeNull()
    await render(
      <ReferenceImageList
        messageContent="result[ID:0]"
        referenceChunks={[{ ...chunk, doc_type_kwd: 'text' }]}
      />,
    )
    expect(container.querySelector('img')).toBeNull()
  })
  it('Explore historical attachment trusts only runtime file.id, never created_by or preview_url', async () => {
    const file = {
      id: FILE,
      name: 'history.png',
      mime_type: 'image/png',
      size: 12,
      created_by: 'forged-owner',
      preview_url: 'https://evil.test/private.png',
    } as UploadedFileInfo
    await render(<ExploreMessageAttachments files={[file]} />)
    expect(requests[0].url).toContain(`/api/v1/documents/runtime/${FILE}/image`)
    expect(requests[0].url).not.toContain('forged')
    expect(container.querySelector('img')?.src).toBe('blob:owned-1')
  })
  it('edit existing image and fullscreen modal share a lease; controlled replacement File is preserved', async () => {
    const setFile = vi.fn()
    const selected = { img_id: ID, chunk_id: 'chunk' } as ChunkData
    await render(
      <>
        <ChunkEditImageSection
          selectedChunk={selected}
          editingImage={[]}
          onEditingImageChange={setFile}
          onPreviewImage={() => {}}
        />
        <ChunkImagePreviewModal previewImageId={ID} onClose={() => {}} />
      </>,
    )
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(document.querySelectorAll('img[src="blob:owned-1"]')).toHaveLength(2)
    const file = new File(['bytes'], 'replace.png', { type: 'image/png' })
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    await act(async () =>
      input.dispatchEvent(new Event('change', { bubbles: true })),
    )
    expect(setFile.mock.calls[0][0][0]).toBe(file)
  })
  it.each(['owner switch', 'page hide'])(
    'new window retains its own blob after modal closes, clears opener/referrer, and closes on %s',
    async (reason) => {
      const popup = {
        opener: window,
        document: document.implementation.createHTMLDocument(),
        closed: false,
        close: vi.fn(),
      }
      vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
      await render(
        <ChunkImagePreviewModal previewImageId={ID} onClose={() => {}} />,
      )
      const open = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('new tab'),
      )!
      await act(async () => open.click())
      expect(popup.opener).toBeNull()
      expect(popup.document.querySelector('img')?.referrerPolicy).toBe(
        'no-referrer',
      )
      await render(null)
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
      await act(async () => {
        if (reason === 'owner switch') session('owner-b', 'token-b')
        else window.dispatchEvent(new Event('pagehide'))
      })
      expect(popup.close).toHaveBeenCalledTimes(1)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned-1')
    },
  )
  it('unmount cancels actual pending fetch without error UI or a late object URL', async () => {
    let finish!: (r: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, config) => {
        requests.push({ url: String(url), signal: config.signal })
        return new Promise<Response>((resolve) => {
          finish = resolve
        })
      }),
    )
    await render(image())
    await render(null)
    expect(requests[0].signal.aborted).toBe(true)
    await act(async () => {
      finish(response())
      await new Promise((resolve) => setTimeout(resolve, 25))
    })
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
  it('replacement retires matching popup leases while unrelated images remain cached', async () => {
    const popup = {
      opener: window,
      document: document.implementation.createHTMLDocument(),
      closed: false,
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    await render(
      <>
        {image(`${KB}-unrelated.png`)}
        <ChunkImagePreviewModal previewImageId={ID} onClose={() => {}} />
      </>,
    )
    const unrelatedUrl = container.querySelector('img')!.src
    const replacedUrl = document
      .querySelector('[role="dialog"] img')!
      .getAttribute('src')!
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('new tab'),
    )!
    await act(async () => button.click())
    await act(async () => evictDocumentImage(ID, getDocumentImageEpoch()))
    await render(
      <>
        {image(`${KB}-unrelated.png`)}
        <ChunkImagePreviewModal previewImageId={ID} onClose={() => {}} />
      </>,
    )
    expect(popup.close).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(replacedUrl)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(unrelatedUrl)
    expect(requests).toHaveLength(3)
    expect(container.querySelector('img')!.src).toBe(unrelatedUrl)
    expect(
      document.querySelector('[role="dialog"] img')!.getAttribute('src'),
    ).not.toBe(replacedUrl)
  })
  it('same-ID replacement never leaves a fullscreen preview using the revoked blob', async () => {
    const surface = (
      <DocumentImagePreviewProvider resetKey={ID}>
        <DocumentImage
          source={{ kind: 'dataset', imageId: ID }}
          alt="preview"
          preview
        />
      </DocumentImagePreviewProvider>
    )
    await render(surface)
    await act(async () =>
      container.querySelector<HTMLButtonElement>('button')!.click(),
    )
    expect(document.querySelector('.PhotoView-Slider__Backdrop')).not.toBeNull()
    await act(async () => evictDocumentImage(ID, getDocumentImageEpoch()))
    await render(surface)
    expect(document.querySelector('img[src="blob:owned-1"]')).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned-1')
  })
  it('replacement closes a detached popup even after its query has been garbage collected', async () => {
    const popup = {
      opener: window,
      document: document.implementation.createHTMLDocument(),
      closed: false,
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    await render(
      <ChunkImagePreviewModal previewImageId={ID} onClose={() => {}} />,
    )
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('new tab'),
    )!
    await act(async () => button.click())
    await render(null)
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    await act(async () => evictDocumentImage(ID, getDocumentImageEpoch()))
    expect(popup.close).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned-1')
  })
  it('late eviction from an older authenticated owner cannot retire the current owner image', async () => {
    await render(image())
    const oldEpoch = getDocumentImageEpoch()
    await act(async () => session('owner-b', 'token-b'))
    await render(image())
    const currentUrl = container.querySelector('img')!.src
    const count = requests.length
    await act(async () => evictDocumentImage(ID, oldEpoch))
    expect(container.querySelector('img')!.src).toBe(currentUrl)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(currentUrl)
    expect(requests).toHaveLength(count)
  })
  it('blocked image window has safe feedback and preserves the current lease', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    await render(
      <ChunkImagePreviewModal previewImageId={ID} onClose={() => {}} />,
    )
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('new tab'),
    )!
    await act(async () => button.click())
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    expect(document.querySelector('img[src="blob:owned-1"]')).not.toBeNull()
  })
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentUploadModal } from '../document-upload-modal'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  parse: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
vi.mock('@/api/knowledge', () => ({
  knowledgeAPI: { document: { upload: mocks.upload, parse: mocks.parse } },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error, info: mocks.info },
}))
vi.mock('react-i18next', async (original) => ({
  ...(await original<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}))

function button(text: string) {
  return [...document.body.querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === text,
  )!
}

describe('dataset upload and parsing', () => {
  let root: Root
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    Object.values(mocks).forEach((mock) => mock.mockReset())
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('retains native file bytes, name and size through pending/uploaded states when parse fails', async () => {
    let resolveUpload!: (docs: { id: string }[]) => void
    mocks.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve
        }),
    )
    mocks.parse.mockRejectedValue(new Error('private parse detail'))
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    await act(async () =>
      root.render(
        <DocumentUploadModal
          open
          kbId="kb"
          onClose={onClose}
          onSuccess={onSuccess}
        />,
      ),
    )
    const file = new File(['original bytes'], 'original.txt', {
      type: 'text/plain',
      lastModified: 123,
    })
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(document.body.textContent).toContain('original.txt')
    expect(document.body.textContent).toContain('14 Bytes')
    await act(async () =>
      button('knowledge.documents.upload.uploadCount').click(),
    )
    expect(mocks.upload).toHaveBeenCalledWith('kb', [file])
    expect(mocks.upload.mock.calls[0][1][0]).toBe(file)
    expect(file).toBeInstanceOf(File)
    expect(file.lastModified).toBe(123)
    expect(document.body.textContent).toContain('original.txt')
    expect(document.body.textContent).toContain('14 Bytes')
    expect(document.body.textContent).not.toContain('NaN')
    vi.useFakeTimers()
    await act(async () => {
      resolveUpload([{ id: 'created-doc' }])
    })
    expect(mocks.parse).toHaveBeenCalledWith('kb', ['created-doc'])
    expect(mocks.success).toHaveBeenCalledWith(
      'knowledge.documents.upload.success',
    )
    expect(mocks.success).not.toHaveBeenCalledWith(
      'knowledge.documents.toasts.parseStarted',
    )
    expect(mocks.error).toHaveBeenCalledWith(
      'knowledge.documents.upload.autoParseError',
    )
    expect(mocks.error).not.toHaveBeenCalledWith('private parse detail')
    expect(document.body.textContent).toContain('original.txt')
    expect(document.body.textContent).toContain('14 Bytes')
    expect(document.body.textContent).not.toContain('NaN')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800)
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})

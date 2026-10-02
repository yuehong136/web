import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import {
  attachmentMetadata,
  UploadXHR,
} from '@/api/__tests__/helpers/upload-xhr'
import { ControlledAttachments } from '@/components/chat/controlled-attachments'
import { useChatUpload } from '../use-chat-upload'
import { useMcpUpload } from '../use-mcp-upload'

// Load the real vendor implementation without unrelated markdown barrel exports.
vi.mock('@ant-design/x', async () => ({
  Attachments: (await import('@ant-design/x/es/attachments')).default,
  FileCard: (await import('@ant-design/x/es/file-card/FileCard')).default,
}))
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

describe.each([
  ['Explore', useChatUpload],
  ['MCP', useMcpUpload],
] as const)('%s controlled composer', (_name, useUpload) => {
  let root: Root
  let container: HTMLDivElement
  let hook: ReturnType<typeof useChatUpload>
  const removed = vi.fn()
  function Harness() {
    hook = useUpload()
    return (
      <ControlledAttachments
        maxCount={1}
        uploadLabel="Upload file"
        removeLabel={(name) => `Remove ${name}`}
        retryLabel={(name) => `Retry ${name}`}
        failureLabel="Upload failed"
        items={hook.files.map(
          ({ originFileObj: _originFileObj, ...file }) => file,
        )}
        onRetry={
          _name === 'Explore'
            ? (uid) => {
                void hook.retry(uid)
              }
            : undefined
        }
        onRemove={(uid) => {
          removed(uid)
          hook.removeFile(uid)
        }}
        onUpload={async (file) => {
          await hook.upload(file)
        }}
      />
    )
  }
  beforeEach(async () => {
    UploadXHR.instances = []
    vi.stubGlobal('XMLHttpRequest', UploadXHR)
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
      }),
    )
    apiClient.setAuthToken('test-jwt')
    removed.mockClear()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => root.render(<Harness />))
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    apiClient.setAuthToken(null)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
  async function selectFile(name: string | string[] = 'sample.txt') {
    const files = (Array.isArray(name) ? name : [name]).map(
      (filename) => new File(['fixture'], filename, { type: 'text/plain' }),
    )
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!
    await act(async () => {
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: files,
      })
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    return UploadXHR.instances.at(-1)!
  }
  async function removeCard() {
    const control = container.querySelector<HTMLElement>(
      'button[aria-label^="Remove "]',
    )!
    expect(control).not.toBeNull()
    await act(async () => control.click())
  }
  it('removes a completed row and never revives it during the next selection', async () => {
    const first = await selectFile()
    await act(async () =>
      first.respond({ code: 0, data: attachmentMetadata('first') }),
    )
    const uid = hook.files[0].uid
    await removeCard()
    expect(removed).toHaveBeenCalledWith(uid)
    expect(hook.getUploadedFiles()).toEqual([])
    expect(hook.files).toEqual([])
    const second = await selectFile('second.txt')
    await act(async () =>
      second.respond({
        code: 0,
        data: { ...attachmentMetadata('second'), name: 'second.txt' },
      }),
    )
    expect(hook.getUploadedFiles().map((file) => file.id)).toEqual(['second'])
    expect(container.textContent).not.toContain('sample.txt')
    expect(container.textContent).toContain('second.txt')
    expect(UploadXHR.instances).toHaveLength(2)
  })
  it('keeps removal available while uploading and rejects a late completion after abort', async () => {
    const xhr = await selectFile()
    const late = xhr.onload!
    expect(hook.uploading).toBe(true)
    await removeCard()
    expect(xhr.aborted).toBe(true)
    await act(async () => {
      xhr.responseText = JSON.stringify({
        code: 0,
        data: attachmentMetadata('late'),
      })
      late()
    })
    expect(hook.files).toEqual([])
    expect(hook.getUploadedFiles()).toEqual([])
    expect(container.textContent).not.toContain('sample.txt')
  })
  it('limits a multi-file selection without disabling removal at capacity', async () => {
    await selectFile(['sample.txt', 'extra.txt'])
    expect(UploadXHR.instances).toHaveLength(1)
    expect(hook.files).toHaveLength(1)
    expect(
      container
        .querySelector('.ant-attachment-placeholder')!
        .getAttribute('aria-hidden'),
    ).toBe('true')
    await removeCard()
    expect(hook.files).toEqual([])
    expect(
      container
        .querySelector('.ant-attachment-placeholder')!
        .getAttribute('aria-hidden'),
    ).toBe('false')
  })
  if (_name === 'Explore') {
    it('retries through the rendered failed card without retaining the failed row', async () => {
      const xhr = await selectFile()
      await act(async () => xhr.respond({ code: 100, data: null }))
      const retry = container.querySelector<HTMLElement>(
        'button[aria-label="Retry sample.txt"]',
      )!
      expect(retry).not.toBeNull()
      await act(async () => retry.click())
      expect(UploadXHR.instances).toHaveLength(2)
      await act(async () =>
        UploadXHR.instances[1].respond({
          code: 0,
          data: attachmentMetadata('retried'),
        }),
      )
      expect(hook.files).toHaveLength(1)
      expect(hook.getUploadedFiles().map((file) => file.id)).toEqual([
        'retried',
      ])
    })
  }
  it('renders failure without eligible metadata and removes it through the same control', async () => {
    const xhr = await selectFile()
    await act(async () =>
      xhr.respond({ code: 100, message: 'secret-detail', data: null }),
    )
    expect(hook.files[0].status).toBe('error')
    expect(hook.getUploadedFiles()).toEqual([])
    expect(container.textContent).not.toContain('secret-detail')
    await removeCard()
    expect(hook.files).toEqual([])
    expect(container.textContent).not.toContain('sample.txt')
  })
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { conversationAPI } from '@/api/conversation'
import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import {
  attachmentMetadata,
  UploadXHR,
} from '@/api/__tests__/helpers/upload-xhr'
import { streamStructuredChat } from '@/components/chat/structured-chat-stream'
import { useChatUpload } from '../use-chat-upload'
import { useMcpUpload } from '../use-mcp-upload'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const textFile = () =>
  new File(['fixture'], 'sample.txt', { type: 'text/plain' })
const imageFile = () => new File(['image'], 'image.png', { type: 'image/png' })
const latest = () => UploadXHR.instances.at(-1)!
type UploadHook = ReturnType<typeof useChatUpload> & {
  getFileIds?: () => string[]
}

describe.each([
  ['Explore', useChatUpload],
  ['MCP', useMcpUpload],
] as const)('%s attachment lifecycle', (_name, useUpload) => {
  let root: Root
  let container: HTMLDivElement
  let hook: UploadHook
  let unmounted: boolean
  const revoke = vi.fn()
  function Harness() {
    hook = useUpload()
    return (
      <output aria-busy={hook.uploading}>
        {hook.files
          .map((file) => `${file.name}:${file.status}:${file.percent}`)
          .join('|')}
      </output>
    )
  }
  beforeEach(async () => {
    UploadXHR.instances = []
    vi.stubGlobal('XMLHttpRequest', UploadXHR)
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = vi.fn(() => 'blob:test-preview')
        static override revokeObjectURL = revoke
      },
    )
    revoke.mockClear()
    apiClient.setAuthToken('test-jwt')
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    unmounted = false
    await act(async () => root.render(<Harness />))
  })
  afterEach(async () => {
    if (!unmounted) await act(async () => root.unmount())
    container.remove()
    apiClient.setAuthToken(null)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uploads successive files with progress and forwards only successful metadata to real chat API consumers', async () => {
    let first!: ReturnType<UploadHook['upload']>
    let second!: ReturnType<UploadHook['upload']>
    await act(async () => {
      first = hook.upload(textFile())
      second = hook.upload(textFile())
    })
    expect(UploadXHR.instances).toHaveLength(2)
    expect(hook.uploading).toBe(true)
    await act(async () => {
      UploadXHR.instances[0].progress(1, 2)
      UploadXHR.instances[1].respond({
        code: 0,
        data: attachmentMetadata('second'),
      })
      await second
    })
    expect(hook.files[0].percent).toBe(50)
    expect(hook.uploading).toBe(true)
    expect(hook.getUploadedFiles().map((file) => file.id)).toEqual(['second'])
    await act(async () => {
      UploadXHR.instances[0].respond({
        code: 0,
        data: attachmentMetadata('first'),
      })
      await first
    })
    expect(hook.uploading).toBe(false)
    expect(hook.allDone).toBe(true)
    expect(hook.doneCount).toBe(2)
    expect(container.textContent).toContain('done:100')
    const fetchRequest = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchRequest)
    if (hook.getFileIds) {
      // The MCP page sends the uploaded IDs through streamStructuredChat.
      fetchRequest.mockResolvedValueOnce(
        new Response('', { headers: { 'Content-Type': 'text/event-stream' } }),
      )
      const request: MCPChatServiceRequest = {
        prompt: '',
        messages: [{ role: 'user', content: 'fixture' }],
        llm_name: 'fixture-model',
        stream: true,
        gen_conf: {},
        files: hook.getFileIds(),
      }
      await streamStructuredChat({
        url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`,
        requestBody: request,
        onMessage: () => {},
      })
      expect(fetchRequest.mock.calls[0][0]).toMatch(
        /\/v1\/llm\/enhanced_chat_sse$/,
      )
      expect(JSON.parse(fetchRequest.mock.calls[0][1].body).files).toEqual([
        'first',
        'second',
      ])
    } else {
      await conversationAPI.completion({
        conversation_id: 'fixture-conversation',
        messages: [
          { role: 'user', content: 'fixture', files: hook.getUploadedFiles() },
        ],
      })
      expect(fetchRequest.mock.calls[0][0]).toMatch(
        /\/v1\/conversation\/completion$/,
      )
      expect(
        JSON.parse(fetchRequest.mock.calls[0][1].body).messages[0].files,
      ).toEqual([attachmentMetadata('first'), attachmentMetadata('second')])
    }
  })

  it('business and shape failures remain errors, keep safe UI feedback and can retry', async () => {
    let failed!: ReturnType<UploadHook['upload']>
    await act(async () => {
      failed = hook.upload(textFile())
    })
    await act(async () => {
      latest().respond({
        code: 102,
        message: 'secret-backend-detail',
        data: null,
      })
      await failed
    })
    expect(hook.hasError).toBe(true)
    expect(hook.getUploadedFiles()).toEqual([])
    expect(String(hook.files[0].error)).not.toContain('secret-backend-detail')
    let retry!: ReturnType<UploadHook['retry']>
    await act(async () => {
      retry = hook.retry(hook.files[0].uid)
    })
    await act(async () => {
      latest().respond({ code: 0, data: { id: '' } })
      await retry
    })
    expect(hook.files).toHaveLength(1)
    expect(hook.files[0].status).toBe('error')
    await act(async () => {
      retry = hook.retry(hook.files[0].uid)
    })
    await act(async () => {
      latest().respond({ code: 0, data: attachmentMetadata() })
      await retry
    })
    expect(hook.getUploadedFiles()).toHaveLength(1)
  })

  it('authentication failure never becomes a pending attachment and permits a new authenticated retry', async () => {
    let upload!: ReturnType<UploadHook['upload']>
    await act(async () => {
      upload = hook.upload(textFile())
    })
    await act(async () => {
      latest().respond({ detail: 'expired session detail' }, 401)
      await upload
    })
    expect(hook.files[0].error).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    expect(hook.getUploadedFiles()).toEqual([])
    expect(hook.uploading).toBe(false)
    apiClient.setAuthToken('renewed-jwt')
    await act(async () => {
      upload = hook.retry(hook.files[0].uid)
    })
    expect(latest().headers.Authorization).toBe('Bearer renewed-jwt')
    await act(async () => {
      latest().respond({ code: 0, data: attachmentMetadata() })
      await upload
    })
    expect(hook.getUploadedFiles()).toHaveLength(1)
  })

  it('cancel/remove and late transport completion cannot resurrect attachments or send IDs', async () => {
    let upload!: ReturnType<UploadHook['upload']>
    await act(async () => {
      upload = hook.upload(textFile())
    })
    const xhr = latest()
    const late = xhr.onload!
    const row = hook.files[0]
    await act(async () => {
      hook.cancel(row.uid)
      xhr.responseText = JSON.stringify({ code: 0, data: attachmentMetadata() })
      late()
      expect(await upload).toBeNull()
      hook.setFiles([row]) // a stale controlled attachment callback
    })
    expect(xhr.aborted).toBe(true)
    expect(hook.files).toEqual([])
    expect(hook.uploading).toBe(false)
    expect(hook.getUploadedFiles()).toEqual([])
    await act(async () => {
      upload = hook.upload(textFile())
    })
    await act(async () => {
      // The transport is already fulfilled; only composer ownership can reject this race.
      latest().respond({ code: 0, data: attachmentMetadata() })
      hook.cancel(hook.files[0].uid)
      expect(await upload).toBeNull()
    })
    expect(hook.getUploadedFiles()).toEqual([])
    await act(async () => {
      upload = hook.upload(textFile())
    })
    await act(async () => {
      hook.removeFile(hook.files[0].uid)
      await upload
    })
    expect(hook.files).toEqual([])
  })

  it('cancelAll retains finished rows and clear/unmount abort outstanding requests', async () => {
    let pending!: ReturnType<UploadHook['uploadMultiple']>
    await act(async () => {
      pending = hook.uploadMultiple([textFile(), textFile()])
    })
    await act(async () => {
      UploadXHR.instances[0].respond({ code: 0, data: attachmentMetadata() })
    })
    await act(async () => {
      hook.cancelAll()
      await pending
    })
    expect(hook.files).toHaveLength(1)
    expect(hook.files[0].status).toBe('done')
    let upload!: ReturnType<UploadHook['upload']>
    await act(async () => {
      upload = hook.upload(textFile())
    })
    await act(async () => {
      hook.clearFiles()
      await upload
    })
    expect(hook.files).toEqual([])
    await act(async () => {
      upload = hook.upload(textFile())
    })
    await act(async () => {
      root.unmount()
      unmounted = true
      expect(await upload).toBeNull()
    })
    expect(latest().aborted).toBe(true)
  })

  if (_name === 'MCP') {
    it('releases owned blob previews on failure, retry, remove, clear and unmount exactly once', async () => {
      let upload!: ReturnType<UploadHook['upload']>
      await act(async () => {
        upload = hook.upload(imageFile())
      })
      expect(hook.files[0].thumbUrl).toBe('blob:test-preview')
      await act(async () => {
        latest().onerror?.()
        await upload
      })
      expect(revoke).toHaveBeenCalledTimes(1)
      expect(hook.files[0].thumbUrl).toBeUndefined()
      await act(async () => {
        upload = hook.retry(hook.files[0].uid)
      })
      await act(async () => {
        latest().respond({ code: 0, data: attachmentMetadata() })
        await upload
        hook.removeFile(hook.files[0].uid)
      })
      expect(revoke).toHaveBeenCalledTimes(2)
      await act(async () => {
        upload = hook.upload(imageFile())
      })
      await act(async () => {
        hook.cancelAll()
        await upload
      })
      expect(revoke).toHaveBeenCalledTimes(3)
      await act(async () => {
        upload = hook.upload(imageFile())
      })
      await act(async () => {
        hook.clearFiles()
        await upload
      })
      expect(revoke).toHaveBeenCalledTimes(4)
      await act(async () => {
        upload = hook.upload(imageFile())
      })
      await act(async () => {
        root.unmount()
        unmounted = true
        await upload
      })
      expect(revoke).toHaveBeenCalledTimes(5)
    })
  } else {
    it('registers an image row before FileReader completes, cancellation aborts reading and sends nothing', async () => {
      const readers: FileReader[] = []
      const read = vi
        .spyOn(FileReader.prototype, 'readAsDataURL')
        .mockImplementation(function (this: FileReader) {
          readers.push(this)
        })
      const abort = vi.spyOn(FileReader.prototype, 'abort')
      let upload!: ReturnType<UploadHook['upload']>
      await act(async () => {
        upload = hook.upload(imageFile())
      })
      const reader = readers[0]
      expect(hook.uploading).toBe(true)
      expect(hook.files).toHaveLength(1)
      const lateRead = reader.onload!
      await act(async () => {
        hook.cancel(hook.files[0].uid)
        lateRead.call(
          reader,
          new ProgressEvent('load') as ProgressEvent<FileReader>,
        )
        expect(await upload).toBeNull()
      })
      expect(read).toHaveBeenCalledTimes(1)
      expect(abort).toHaveBeenCalledTimes(1)
      expect(UploadXHR.instances).toHaveLength(0)
      expect(hook.files).toEqual([])
      expect(reader.onload).toBeNull()
    })

    it('keeps a data URI preview on message metadata after composer clear', async () => {
      const readers: FileReader[] = []
      vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(
        function (this: FileReader) {
          readers.push(this)
        },
      )
      let upload!: ReturnType<UploadHook['upload']>
      await act(async () => {
        upload = hook.upload(imageFile())
      })
      const reader = readers[0]
      Object.defineProperty(reader, 'result', {
        value: 'data:image/png;base64,aW1hZ2U=',
      })
      await act(async () => {
        reader.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>)
      })
      await act(async () => {
        latest().respond({
          code: 0,
          data: {
            ...attachmentMetadata(),
            name: 'image.png',
            mime_type: 'image/png',
          },
        })
        await upload
      })
      const messages = [{ role: 'user', files: hook.getUploadedFiles() }]
      await act(async () => hook.clearFiles())
      expect(messages[0].files[0].preview_url).toBe(
        'data:image/png;base64,aW1hZ2U=',
      )
      expect(revoke).not.toHaveBeenCalled()
    })
  }
})

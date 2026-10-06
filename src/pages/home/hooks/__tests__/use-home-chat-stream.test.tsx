import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import i18n, { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import { useHomeChat } from '../useHomeChat'

const app = { id: 'dialog-1', name: 'App' } as DialogApp
type ChatOptions = Parameters<typeof useHomeChat>[0]
const defaultOptions: ChatOptions = {
  selectedMCPIds: [],
  selectedModelId: '',
  selectedApp: app,
  selectedConversationId: 'conversation-1',
}
let chat: ReturnType<typeof useHomeChat>
let root: Root
let container: HTMLDivElement

function Surface(options: ChatOptions) {
  const current = useHomeChat(options)
  useEffect(() => {
    chat = current
  }, [current])
  return null
}

const renderSurface = (options: ChatOptions) =>
  act(async () => root.render(<Surface {...options} />))

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const sse = (...frames: unknown[]) =>
  new Response(
    frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } },
  )

const send = async (response: Response) => {
  vi.spyOn(conversationAPI, 'completion').mockResolvedValue(response)
  await act(async () => chat.sendMessage('问题'))
}

const answer = () => chat.messages.at(-1)

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  vi.spyOn(conversationAPI, 'getConversationDetail').mockResolvedValue({
    message: [],
  })
  vi.spyOn(toast, 'error').mockImplementation(() => 1)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await renderSurface(defaultOptions)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('shows the final answer with inserted citations once instead of appending it', async () => {
  const chunks = [{ id: 'chunk-0', content: '原文', doc_id: 'doc-1' }]
  await send(
    sse(
      { retcode: 0, data: { answer: '根据文档，', reference: {} } },
      { retcode: 0, data: { answer: '答案是 42。', reference: {} } },
      {
        retcode: 0,
        data: {
          answer: '根据文档，答案是 42 [ID:0]。',
          reference: { chunks },
          final: true,
        },
      },
      { retcode: 0, data: true },
    ),
  )

  expect(answer()?.role).toBe('assistant')
  expect(answer()?.content).toBe('根据文档，答案是 42 [ID:0]。')
  expect(answer()?.references).toEqual(chunks)
  expect(toast.error).not.toHaveBeenCalled()
})

it('keeps the partial answer after an error frame and only shows a fixed notice', async () => {
  await send(
    sse(
      { retcode: 0, data: { answer: '已生成的部分', reference: {} } },
      {
        retcode: 500,
        retmsg: 'upstream secret',
        data: { answer: '**ERROR**: upstream secret', reference: [] },
      },
      { retcode: 0, data: true },
    ),
  )

  expect(answer()?.content).toBe('已生成的部分')
  expect(toast.error).toHaveBeenCalledTimes(1)
  expect(toast.error).toHaveBeenCalledWith(i18n.t('chat.stream.interrupted'))
  expect(JSON.stringify(chat.messages)).not.toContain('upstream secret')
})

it('replaces an empty failed answer with the localized failure text', async () => {
  await send(
    sse(
      {
        retcode: 0,
        data: {
          answer: '**ERROR**: AUTH_ERROR - invalid key sk-1',
          reference: {},
        },
      },
      { retcode: 0, data: true },
    ),
  )

  expect(answer()?.content).toBe(i18n.t('chat.stream.failed'))
  expect(answer()?.content).toBe('生成失败，请重试。')
  expect(JSON.stringify(chat.messages)).not.toContain('sk-1')
  expect(toast.error).not.toHaveBeenCalled()
})

it('accepts one send at a time and reopens once the answer settles', async () => {
  const pending = deferred<Response>()
  vi.spyOn(conversationAPI, 'completion').mockReturnValue(pending.promise)

  let first: ReturnType<typeof chat.sendMessage> = false
  let second: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    first = chat.sendMessage('第一条')
    second = chat.sendMessage('第二条')
  })

  expect(first).not.toBe(false)
  expect(second).toBe(false)
  expect(chat.isSendPending).toBe(true)
  expect(conversationAPI.completion).toHaveBeenCalledTimes(1)
  expect(chat.sendMessage('生成中再按 Enter')).toBe(false)

  await act(async () => {
    pending.resolve(
      sse(
        { retcode: 0, data: { answer: '完成', reference: {} } },
        { retcode: 0, data: true },
      ),
    )
    await first
  })

  expect(chat.isSendPending).toBe(false)
  expect(chat.messages.filter((msg) => msg.role === 'user')).toHaveLength(1)
  await send(sse({ retcode: 0, data: true }))
  expect(chat.messages.filter((msg) => msg.role === 'user')).toHaveLength(2)
})

it('rejects a repeated send while a new conversation is still being created', async () => {
  await renderSurface({ ...defaultOptions, selectedConversationId: null })
  const created = deferred<{ id: string }>()
  const setConversation = vi
    .spyOn(conversationAPI, 'setConversation')
    .mockReturnValue(created.promise)
  vi.spyOn(conversationAPI, 'completion').mockResolvedValue(
    sse({ retcode: 0, data: true }),
  )

  let first: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    first = chat.sendMessage('新会话第一条')
  })
  expect(chat.sendMessage('连续 Enter')).toBe(false)

  await act(async () => {
    created.resolve({ id: 'conversation-new' })
    await first
  })

  expect(setConversation).toHaveBeenCalledTimes(1)
  expect(conversationAPI.completion).toHaveBeenCalledTimes(1)
})

it('rejects an MCP send without a chat model so the draft can stay', async () => {
  await renderSurface({ ...defaultOptions, selectedApp: null })

  expect(chat.sendMessage('没有模型')).toBe(false)
  expect(toast.error).toHaveBeenCalledWith(
    i18n.t('home.input.selectModelFirst'),
  )
  expect(chat.messages).toHaveLength(0)
})

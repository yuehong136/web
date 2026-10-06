import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import i18n, { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import { useHomeChat } from '../useHomeChat'

const app = { id: 'dialog-1', name: 'App' } as DialogApp
let chat: ReturnType<typeof useHomeChat>
let root: Root
let container: HTMLDivElement

function Surface() {
  const current = useHomeChat({
    selectedMCPIds: [],
    selectedModelId: '',
    selectedApp: app,
    selectedConversationId: 'conversation-1',
  })
  useEffect(() => {
    chat = current
  }, [current])
  return null
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
  await act(async () => root.render(<Surface />))
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

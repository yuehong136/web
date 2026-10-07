import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client-types'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import i18n, { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import { useHomeChat } from '../useHomeChat'
import { delta, done, flush, openStream, sse } from './stream-fixtures'

// W3：只有完成帧算完成；其余结束方式保留已收到的内容，并按固定分类显示状态

const app = { id: 'dialog-1', name: 'App' } as DialogApp
type ChatOptions = Parameters<typeof useHomeChat>[0]
const appOptions: ChatOptions = {
  selectedMCPIds: [],
  selectedModelId: '',
  selectedApp: app,
  selectedConversationId: 'conversation-1',
}
const mcpOptions: ChatOptions = {
  selectedMCPIds: ['mcp-1'],
  selectedModelId: 'qwen-plus',
  selectedApp: null,
  selectedConversationId: null,
}
let chat: ReturnType<typeof useHomeChat>
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient

function Surface(options: ChatOptions) {
  const current = useHomeChat(options)
  useEffect(() => {
    chat = current
  }, [current])
  return null
}

const renderSurface = (options: ChatOptions) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <Surface {...options} />
      </QueryClientProvider>,
    ),
  )

const answer = () => chat.messages.at(-1)
const statusText = (key: string) => i18n.t(`home.answerStatus.${key}`)
// 界面上能看到的一切：消息与两类 toast 的参数
const shown = () =>
  JSON.stringify([
    chat.messages,
    vi.mocked(toast.error).mock.calls,
    vi.mocked(toast.warning).mock.calls,
  ])

const sendApp = async (response: Response) => {
  vi.spyOn(conversationAPI, 'completion').mockResolvedValue(response)
  await act(async () => chat.sendMessage('问题'))
}

/** Starts an app answer on a stream the test feeds frame by frame. */
const startApp = async () => {
  const stream = openStream()
  const completion = vi
    .spyOn(conversationAPI, 'completion')
    .mockResolvedValue(stream.response)
  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('问题')
    await flush()
  })
  const push = (...frames: unknown[]) =>
    act(async () => {
      frames.forEach(stream.push)
      await flush()
    })
  const settle = (end: () => void) =>
    act(async () => {
      end()
      await pending
    })
  return { stream, completion, push, settle }
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

/** Runs one MCP answer against a stubbed fetch, on the real stream path. */
const sendMCP = async (response: Response) => {
  const fetchMock = vi.fn(() => Promise.resolve(response))
  vi.stubGlobal('fetch', fetchMock)
  await renderSurface(mcpOptions)
  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('问题')
    await flush()
  })
  return { fetchMock, pending }
}

const mcpText = (content: string) => ({
  retcode: 0,
  data: { type: 'text', content },
})
const mcpToolStart = { retcode: 0, data: { type: 'tool_start', content: '' } }
const mcpToolCall = (callId: string) => ({
  retcode: 0,
  data: {
    type: 'tool_call',
    content: { tool_name: 'search', arguments: { q: '制度' }, call_id: callId },
  },
})
const mcpToolResult = (callId: string) => ({
  retcode: 0,
  data: {
    type: 'tool_result',
    content: { tool_name: 'search', result: '三条', call_id: callId },
  },
})
const mcpComplete = { retcode: 0, retmsg: 'Stream completed', data: true }

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  queryClient = new QueryClient()
  vi.spyOn(conversationAPI, 'getConversationDetail').mockResolvedValue({
    message: [],
  })
  vi.spyOn(toast, 'error').mockImplementation(() => 1)
  vi.spyOn(toast, 'warning').mockImplementation(() => 1)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await renderSurface(appOptions)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('marks an answer without a completion frame as unconfirmed and keeps it', async () => {
  await sendApp(sse(delta('半截回答')))

  expect(answer()?.content).toBe('半截回答')
  expect(answer()?.status).toEqual({ kind: 'unconfirmed', partial: true })
  expect(toast.warning).toHaveBeenCalledWith(statusText('unconfirmed'))
  expect(toast.error).not.toHaveBeenCalled()
  // 没有幂等保证，不自动重发
  expect(conversationAPI.completion).toHaveBeenCalledTimes(1)
  expect(chat.isStreaming).toBe(false)
})

it('keeps partial text and references after an error frame, without its text', async () => {
  const chunks = [{ id: 'chunk-0', content: '原文', doc_id: 'doc-1' }]
  await sendApp(
    sse(
      { retcode: 0, data: { answer: '已生成的部分', reference: { chunks } } },
      {
        retcode: 500,
        retmsg: 'upstream secret',
        data: { answer: '**ERROR**: upstream secret', reference: [] },
      },
      delta('错误帧之后晚到的正文'),
      done,
    ),
  )

  expect(answer()?.content).toBe('已生成的部分')
  expect(answer()?.references).toEqual(chunks)
  expect(answer()?.status).toEqual({ kind: 'business', partial: true })
  expect(toast.error).toHaveBeenCalledTimes(1)
  expect(toast.error).toHaveBeenCalledWith(statusText('business'))
  expect(shown()).not.toContain('upstream secret')
  expect(conversationAPI.completion).toHaveBeenCalledTimes(1)
})

it('treats the **ERROR** sentinel as a business failure and never shows it', async () => {
  await sendApp(
    sse(delta('部分'), delta('**ERROR**: AUTH_ERROR - invalid key sk-1'), done),
  )
  expect(answer()?.content).toBe('部分')
  expect(answer()?.status).toEqual({ kind: 'business', partial: true })

  await sendApp(
    sse(delta('**ERROR**: RATE_LIMIT_EXCEEDED - key sk-2 throttled'), done),
  )
  expect(answer()?.content).toBe('')
  expect(answer()?.status).toEqual({ kind: 'business', partial: false })
  expect(shown()).not.toMatch(/sk-1|sk-2|ERROR/)
})

it('ignores frames that arrive after the completion frame', async () => {
  const late = [{ id: 'late', content: '晚到的引用', doc_id: 'doc-9' }]
  await sendApp(
    sse(
      delta('完整回答'),
      done,
      delta('晚到的正文'),
      { retcode: 0, data: { answer: '', reference: { chunks: late } } },
      { retcode: 500, retmsg: 'late secret', data: {} },
    ),
  )

  expect(answer()?.content).toBe('完整回答')
  expect(answer()?.references).toEqual([])
  expect(answer()?.status).toBeUndefined()
  expect(toast.error).not.toHaveBeenCalled()
  expect(toast.warning).not.toHaveBeenCalled()
})

it('classifies a 401 before the stream as an expired session and keeps the question', async () => {
  await sendApp(jsonResponse(401, { detail: 'token sk-secret expired' }))

  expect(chat.messages.map((msg) => [msg.role, msg.content])).toEqual([
    ['user', '问题'],
    ['assistant', ''],
  ])
  expect(answer()?.status).toEqual({ kind: 'unauthorized', partial: false })
  expect(toast.error).toHaveBeenCalledWith(statusText('unauthorized'))
  expect(shown()).not.toContain('sk-secret')
})

it('classifies a connection that breaks mid-answer as a network interruption', async () => {
  const { push, settle, stream } = await startApp()
  await push(delta('已收到的部分'))
  await settle(() =>
    stream.fail(new TypeError('network error: upstream secret')),
  )

  expect(answer()?.content).toBe('已收到的部分')
  expect(answer()?.status).toEqual({ kind: 'network', partial: true })
  expect(toast.error).toHaveBeenCalledWith(statusText('network'))
  expect(shown()).not.toContain('upstream secret')
  expect(conversationAPI.completion).toHaveBeenCalledTimes(1)
})

it('marks a local stop as stopped receiving, not as cancelled', async () => {
  const { completion, push, stream } = await startApp()
  await push(delta('停止前的内容'))
  await act(async () => chat.stopStreaming())
  await push(delta('停止后晚到的内容'))
  stream.close()

  expect(completion.mock.calls[0][1]?.signal?.aborted).toBe(true)
  expect(answer()?.content).toBe('停止前的内容')
  expect(answer()?.status).toEqual({ kind: 'stopped', partial: true })
  expect(toast.error).not.toHaveBeenCalled()
  expect(toast.warning).not.toHaveBeenCalled()
  expect(statusText('stopped')).toBe('已停止接收回答')
  expect(statusText('stopped')).not.toContain('取消')
  expect(i18n.t('home.answerStatus.stopped', { lng: 'en-US' })).not.toMatch(
    /cancel/i,
  )
})

it('keeps a completed answer complete when stop comes before the stream closes', async () => {
  const { push } = await startApp()
  await push(delta('完整回答'), done)
  await act(async () => chat.stopStreaming())

  expect(answer()?.content).toBe('完整回答')
  expect(answer()?.status).toBeUndefined()
  expect(toast.error).not.toHaveBeenCalled()
})

it('keeps a business failure when the connection breaks after the error frame', async () => {
  const { push, settle, stream } = await startApp()
  await push(delta('部分'), { retcode: 500, retmsg: 'upstream secret' })
  await settle(() => stream.fail(new TypeError('network error')))

  expect(answer()?.status).toEqual({ kind: 'business', partial: true })
  expect(toast.error).toHaveBeenCalledTimes(1)
  expect(toast.error).toHaveBeenCalledWith(statusText('business'))
})

it('reports a failed conversation creation with fixed text only', async () => {
  await renderSurface({ ...appOptions, selectedConversationId: null })
  const setConversation = vi
    .spyOn(conversationAPI, 'setConversation')
    .mockRejectedValueOnce(new APIError(408, 'TIMEOUT', 'timeout secret'))
    .mockRejectedValueOnce(new Error('upstream secret'))

  await act(async () => chat.sendMessage('第一条'))
  expect(toast.error).toHaveBeenLastCalledWith(statusText('timeout'))
  await act(async () => chat.sendMessage('第一条'))
  expect(toast.error).toHaveBeenLastCalledWith(
    i18n.t('home.history.createFailed'),
  )

  expect(setConversation).toHaveBeenCalledTimes(2)
  expect(chat.messages).toEqual([])
  expect(shown()).not.toMatch(/timeout secret|upstream secret/)
})

it('MCP: keeps text and received steps when an error frame ends the run', async () => {
  const { pending } = await sendMCP(
    sse(
      mcpToolStart,
      mcpToolCall('call-1'),
      mcpToolResult('call-1'),
      mcpToolCall('call-2'),
      mcpText('部分回答'),
      {
        retcode: 500,
        retmsg: 'upstream secret',
        data: { type: 'error', content: { error: 'upstream secret' } },
      },
    ),
  )
  await act(async () => pending)

  expect(answer()?.content).toBe('部分回答')
  expect(
    answer()?.timelineNodes?.map((node) => [node.id, node.status]),
  ).toEqual([
    ['tool-analysis', 'abort'],
    ['call-1', 'success'],
    ['call-2', 'abort'],
  ])
  expect(answer()?.status).toEqual({ kind: 'business', partial: true })
  expect(answer()?.isStreaming).toBe(false)
  expect(toast.error).toHaveBeenCalledWith(statusText('business'))
  expect(shown()).not.toContain('upstream secret')
  expect(chat.isStreaming).toBe(false)
})

it('MCP: a broken connection keeps what arrived instead of writing the error into it', async () => {
  const stream = openStream()
  const { pending } = await sendMCP(stream.response)
  await act(async () => {
    stream.push(mcpText('已收到'))
    await flush()
  })
  await act(async () => {
    stream.fail(new TypeError('network error: upstream secret'))
    await pending
  })

  expect(answer()?.content).toBe('已收到')
  expect(answer()?.timelineNodes).toEqual([])
  expect(answer()?.status).toEqual({ kind: 'network', partial: true })
  expect(shown()).not.toContain('upstream secret')
})

it('MCP: an HTTP 401 shows the expired-session status without the body', async () => {
  const { fetchMock, pending } = await sendMCP(
    jsonResponse(401, { detail: 'Signature has expired: secret-claims' }),
  )
  await act(async () => pending)

  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(answer()?.content).toBe('')
  expect(answer()?.status).toEqual({ kind: 'unauthorized', partial: false })
  expect(toast.error).toHaveBeenCalledWith(statusText('unauthorized'))
  expect(shown()).not.toContain('secret-claims')
})

it('MCP: only the completion frame completes the run', async () => {
  const first = await sendMCP(sse(mcpText('完整回答'), mcpComplete))
  await act(async () => first.pending)
  expect(answer()?.content).toBe('完整回答')
  expect(answer()?.status).toBeUndefined()

  const second = await sendMCP(sse(mcpText('没有完成帧')))
  await act(async () => second.pending)
  expect(answer()?.status).toEqual({ kind: 'unconfirmed', partial: true })
  expect(toast.warning).toHaveBeenCalledTimes(1)
  expect(toast.error).not.toHaveBeenCalled()
})

it('MCP: stop marks the answer stopped and closes the running steps', async () => {
  const stream = openStream()
  const { fetchMock, pending } = await sendMCP(stream.response)
  await act(async () => {
    stream.push(mcpToolStart)
    stream.push(mcpToolCall('call-1'))
    await flush()
  })
  await act(async () => {
    chat.stopStreaming()
    await pending
  })

  expect(
    (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].signal
      ?.aborted,
  ).toBe(true)
  expect(
    answer()?.timelineNodes?.map((node) => [node.id, node.status]),
  ).toEqual([
    ['tool-analysis', 'abort'],
    ['call-1', 'abort'],
  ])
  expect(answer()?.status).toEqual({ kind: 'stopped', partial: true })
  expect(toast.error).not.toHaveBeenCalled()
})

import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { chatKeys } from '@/hooks/use-chat-request'
import { createInitialAgentTimelineState } from '@/lib/streaming'
import { toast } from '@/lib/toast'
import i18n, { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import { streamMCPAgentChat } from '../../utils/mcp-agent-stream'
import { useHomeChat } from '../useHomeChat'

vi.mock('../../utils/mcp-agent-stream', () => ({
  streamMCPAgentChat: vi.fn(),
}))

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

const select = (
  selectedConversationId: string | null,
  options: Partial<ChatOptions> = {},
) => renderSurface({ ...defaultOptions, ...options, selectedConversationId })

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((settle, fail) => {
    resolve = settle
    reject = fail
  })
  return { promise, resolve, reject }
}

// 让流管道与 promise 链都推进一轮
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const sse = (...frames: unknown[]) =>
  new Response(
    frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } },
  )

/** An SSE response whose frames the test pushes one by one. */
const openStream = () => {
  const encoder = new TextEncoder()
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start: (streamController) => {
      controller = streamController
    },
  })
  return {
    response: new Response(body, {
      headers: { 'content-type': 'text/event-stream' },
    }),
    // 订阅被取消后再推送会抛错，正如服务端仍在输出但本地已不再读取
    push: (frame: unknown) => {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`))
      } catch {
        // reader already cancelled
      }
    },
    close: () => {
      try {
        controller.close()
      } catch {
        // reader already cancelled
      }
    },
  }
}

const delta = (text: string) => ({
  retcode: 0,
  data: { answer: text, reference: {} },
})
const done = { retcode: 0, data: true }

const historyOf = (...contents: string[]) => ({
  message: contents.map((content, index) => ({
    id: `history-${content}`,
    role: index % 2 ? 'assistant' : 'user',
    content,
  })),
})

// 按会话 id 返回历史；未登记的会话返回空历史
const histories = new Map<string, Promise<unknown>>()

const send = async (response: Response) => {
  vi.spyOn(conversationAPI, 'completion').mockResolvedValue(response)
  await act(async () => chat.sendMessage('问题'))
}

const answer = () => chat.messages.at(-1)
const contents = () => chat.messages.map((msg) => msg.content)

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  histories.clear()
  queryClient = new QueryClient()
  vi.mocked(streamMCPAgentChat).mockReset()
  vi.spyOn(conversationAPI, 'getConversationDetail').mockImplementation(
    (conversationId: string) =>
      histories.get(conversationId) ?? Promise.resolve({ message: [] }),
  )
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

it('shows the last selected conversation when an earlier history answers late', async () => {
  const slowA = deferred<unknown>()
  histories.set('conversation-a', slowA.promise)
  histories.set(
    'conversation-b',
    Promise.resolve(historyOf('B 的问题', 'B 的回答')),
  )

  await select('conversation-a')
  expect(chat.isLoadingHistory).toBe(true)
  await select('conversation-b')

  expect(chat.currentConversationId).toBe('conversation-b')
  expect(contents()).toEqual(['B 的问题', 'B 的回答'])
  expect(chat.isLoadingHistory).toBe(false)

  await act(async () => {
    slowA.resolve(historyOf('A 的问题', 'A 的回答'))
    await flush()
  })

  expect(chat.currentConversationId).toBe('conversation-b')
  expect(contents()).toEqual(['B 的问题', 'B 的回答'])
})

it('lets the last selection win when going from A to B and back to A', async () => {
  histories.set(
    'conversation-a',
    Promise.resolve(historyOf('A 的问题', 'A 的回答')),
  )
  await select('conversation-a')
  const slowB = deferred<unknown>()
  histories.set('conversation-b', slowB.promise)
  await select('conversation-b')
  const againA = deferred<unknown>()
  histories.set('conversation-a', againA.promise)
  await select('conversation-a')

  await act(async () => {
    slowB.resolve(historyOf('B 的问题', 'B 的回答'))
    await flush()
  })
  // B 晚到：既不落地，也不提前结束 A 的加载
  expect(chat.messages).toEqual([])
  expect(chat.isLoadingHistory).toBe(true)

  await act(async () => {
    againA.resolve(historyOf('A 的问题', 'A 的回答'))
    await flush()
  })
  expect(chat.currentConversationId).toBe('conversation-a')
  expect(contents()).toEqual(['A 的问题', 'A 的回答'])
  expect(chat.isLoadingHistory).toBe(false)
})

it('gives each history message its own id when a question and its answer share one', async () => {
  histories.set(
    'conversation-a',
    Promise.resolve({
      message: [
        { id: 'turn-1', role: 'user', content: '问题' },
        { id: 'turn-1', role: 'assistant', content: '回答' },
      ],
    }),
  )
  await select('conversation-a')

  expect(contents()).toEqual(['问题', '回答'])
  expect(chat.messages[0].id).toBe('turn-1')
  expect(new Set(chat.messages.map((msg) => msg.id)).size).toBe(2)
})

it('starts a clean conversation when a new one is opened while history loads', async () => {
  const slowA = deferred<unknown>()
  histories.set('conversation-a', slowA.promise)
  await select('conversation-a')
  await select(null)
  expect(chat.isLoadingHistory).toBe(false)

  await act(async () => {
    slowA.resolve(historyOf('A 的问题', 'A 的回答'))
    await flush()
  })
  expect(chat.messages).toEqual([])
  expect(chat.currentConversationId).toBeNull()

  vi.spyOn(conversationAPI, 'setConversation').mockResolvedValue({
    id: 'conversation-new',
  })
  const completion = vi
    .spyOn(conversationAPI, 'completion')
    .mockResolvedValue(sse(done))
  await act(async () => chat.sendMessage('新会话的问题'))

  expect(completion.mock.calls[0][0]).toMatchObject({
    conversation_id: 'conversation-new',
    messages: [{ role: 'user', content: '新会话的问题' }],
  })
})

it('clears the history spinner when creating the conversation fails', async () => {
  await select(null)
  const setConversation = vi
    .spyOn(conversationAPI, 'setConversation')
    .mockRejectedValueOnce(new Error('network down'))
  await act(async () => chat.sendMessage('第一条'))

  expect(chat.isLoadingHistory).toBe(false)
  expect(chat.isSendPending).toBe(false)

  setConversation.mockResolvedValue({ id: 'conversation-new' })
  vi.spyOn(conversationAPI, 'completion').mockResolvedValue(sse(done))
  let retry: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    retry = chat.sendMessage('再试一次')
    await retry
  })
  expect(retry).not.toBe(false)
  expect(conversationAPI.completion).toHaveBeenCalledTimes(1)
})

it('loads the opening of a new conversation and keeps streaming after adopting its id', async () => {
  const adopted: Array<string | null> = []
  const options = {
    onConversationIdChange: (id: string | null) => adopted.push(id),
  }
  await select(null, options)
  vi.spyOn(conversationAPI, 'setConversation').mockResolvedValue({
    id: 'conversation-new',
  })
  histories.set(
    'conversation-new',
    Promise.resolve({
      message: [
        { id: 'opening', role: 'assistant', content: '你好，我是助手' },
      ],
    }),
  )
  const stream = openStream()
  const completion = vi
    .spyOn(conversationAPI, 'completion')
    .mockResolvedValue(stream.response)
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('第一条')
    await flush()
  })
  expect(adopted).toEqual(['conversation-new'])
  // 侧栏会话列表随之刷新，新会话的标题能与选中项对应
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: chatKeys.conversationsByDialog('dialog-1'),
  })
  expect(completion.mock.calls[0][0].messages).toEqual([
    { role: 'assistant', content: '你好，我是助手' },
    { role: 'user', content: '第一条' },
  ])

  // HomePage 把新会话写回选中项；这是本次发送自己的会话，流式不受影响
  await select('conversation-new', options)
  await act(async () => {
    stream.push(delta('回答'))
    stream.push(done)
    stream.close()
    await pending
  })

  expect(contents()).toEqual(['你好，我是助手', '第一条', '回答'])
  expect(chat.currentConversationId).toBe('conversation-new')
  expect(completion.mock.calls[0][1]?.signal?.aborted).toBe(false)
  expect(
    vi
      .mocked(conversationAPI.getConversationDetail)
      .mock.calls.map(([id]) => id),
  ).toEqual(['conversation-1', 'conversation-new'])
})

it('drops the answer of a conversation that was switched away mid-stream', async () => {
  const stream = openStream()
  const completion = vi
    .spyOn(conversationAPI, 'completion')
    .mockResolvedValueOnce(stream.response)
    .mockResolvedValueOnce(sse(done))
  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('A 的问题')
    await flush()
  })
  await act(async () => {
    stream.push(delta('A 的部分'))
    await flush()
  })
  expect(answer()?.content).toBe('A 的部分')

  histories.set(
    'conversation-b',
    Promise.resolve(historyOf('B 的问题', 'B 的回答')),
  )
  await select('conversation-b')

  // 切换只收回本地订阅：连接被中止，流式状态复位，旧消息不再显示
  expect(completion.mock.calls[0][1]?.signal?.aborted).toBe(true)
  expect(chat.isStreaming).toBe(false)
  expect(contents()).toEqual(['B 的问题', 'B 的回答'])

  await act(async () => {
    stream.push(delta('A 晚到的正文'))
    stream.close()
    await pending
    await flush()
  })
  expect(contents()).toEqual(['B 的问题', 'B 的回答'])
  expect(toast.error).not.toHaveBeenCalled()

  await act(async () => chat.sendMessage('B 的追问'))
  expect(completion.mock.calls[1][0].conversation_id).toBe('conversation-b')
})

it('ignores a late error from a request whose conversation was switched away', async () => {
  const pending = deferred<Response>()
  vi.spyOn(conversationAPI, 'completion').mockReturnValue(pending.promise)
  let sendA: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    sendA = chat.sendMessage('A 的问题')
  })

  histories.set(
    'conversation-b',
    Promise.resolve(historyOf('B 的问题', 'B 的回答')),
  )
  await select('conversation-b')
  await act(async () => {
    pending.reject(new Error('upstream secret'))
    await sendA
  })

  expect(toast.error).not.toHaveBeenCalled()
  expect(contents()).toEqual(['B 的问题', 'B 的回答'])
  expect(chat.isStreaming).toBe(false)
  expect(chat.isSendPending).toBe(false)
})

it('abandons a first send whose new conversation was replaced by another selection', async () => {
  const adopted: Array<string | null> = []
  const options = {
    onConversationIdChange: (id: string | null) => adopted.push(id),
  }
  await select(null, options)
  const created = deferred<{ id: string }>()
  vi.spyOn(conversationAPI, 'setConversation').mockReturnValue(created.promise)
  const completion = vi.spyOn(conversationAPI, 'completion')
  const slowB = deferred<unknown>()
  histories.set('conversation-b', slowB.promise)

  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('第一条')
  })
  await select('conversation-b', options)
  await act(async () => {
    created.resolve({ id: 'conversation-new' })
    await pending
  })

  // 被取代的创建不接管选中项、不发请求，也不提前结束 B 的加载
  expect(adopted).toEqual([])
  expect(completion).not.toHaveBeenCalled()
  expect(chat.isLoadingHistory).toBe(true)

  await act(async () => {
    slowB.resolve(historyOf('B 的问题', 'B 的回答'))
    await flush()
  })
  expect(chat.currentConversationId).toBe('conversation-b')
  expect(contents()).toEqual(['B 的问题', 'B 的回答'])
  expect(chat.isLoadingHistory).toBe(false)
  expect(chat.isSendPending).toBe(false)
})

it('abandons a first send when the app changes while its conversation is created', async () => {
  const adopted: Array<string | null> = []
  const options = {
    onConversationIdChange: (id: string | null) => adopted.push(id),
  }
  await select(null, options)
  const created = deferred<{ id: string }>()
  vi.spyOn(conversationAPI, 'setConversation').mockReturnValue(created.promise)
  const completion = vi.spyOn(conversationAPI, 'completion')

  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('第一条')
  })
  const otherApp = { id: 'dialog-2', name: 'Other' } as DialogApp
  await select(null, { ...options, selectedApp: otherApp })
  await act(async () => {
    created.resolve({ id: 'conversation-new' })
    await pending
  })

  expect(adopted).toEqual([])
  expect(completion).not.toHaveBeenCalled()
  expect(chat.messages).toEqual([])
  expect(chat.isLoadingHistory).toBe(false)
})

it('keeps a stopped answer and streams the next send into its own message', async () => {
  const first = openStream()
  const second = openStream()
  const completion = vi
    .spyOn(conversationAPI, 'completion')
    .mockResolvedValueOnce(first.response)
    .mockResolvedValueOnce(second.response)

  let firstSend: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    firstSend = chat.sendMessage('第一问')
    await flush()
  })
  await act(async () => {
    first.push(delta('第一段'))
    await flush()
  })
  await act(async () => {
    chat.stopStreaming()
    await firstSend
  })
  expect(chat.isStreaming).toBe(false)
  expect(chat.isSendPending).toBe(false)

  let secondSend: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    secondSend = chat.sendMessage('第二问')
    await flush()
  })
  expect(secondSend).not.toBe(false)
  await act(async () => {
    first.push(delta('第一段晚到的内容'))
    second.push(delta('第二段'))
    second.push(done)
    second.close()
    await secondSend
  })

  expect(contents()).toEqual(['第一问', '第一段', '第二问', '第二段'])
  expect(completion.mock.calls[0][1]?.signal?.aborted).toBe(true)
  expect(completion.mock.calls[1][1]?.signal?.aborted).toBe(false)
  expect(chat.isStreaming).toBe(false)
  expect(toast.error).not.toHaveBeenCalled()
})

it('updates MCP answers by message id and drops updates from a stopped run', async () => {
  await select(null, { selectedApp: null, selectedModelId: 'qwen-plus' })
  const runs: Array<{ emit: (text: string) => void; finish: () => void }> = []
  vi.mocked(streamMCPAgentChat).mockImplementation(
    ({ onState, signal }) =>
      new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve())
        runs.push({
          emit: (text) =>
            onState({ ...createInitialAgentTimelineState(), answer: text }),
          finish: resolve,
        })
      }),
  )

  let first: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    first = chat.sendMessage('第一问')
  })
  await act(async () => runs[0].emit('第一段'))
  await act(async () => {
    chat.stopStreaming()
    await first
  })

  let second: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    second = chat.sendMessage('第二问')
  })
  await act(async () => {
    // 已停止的运行仍回调状态：归属已收回，不能写进任何消息
    runs[0].emit('第一段晚到的内容')
    runs[1].emit('第二段')
    runs[1].finish()
    await second
  })

  expect(contents()).toEqual(['第一问', '第一段', '第二问', '第二段'])
  expect(chat.messages.some((msg) => msg.isStreaming)).toBe(false)
  expect(chat.isStreaming).toBe(false)
})

it('drops the previous identity stream and reloads history for the new identity', async () => {
  const stream = openStream()
  const completion = vi
    .spyOn(conversationAPI, 'completion')
    .mockResolvedValue(stream.response)
  await act(async () => {
    void chat.sendMessage('问题')
    await flush()
  })

  histories.set(
    'conversation-1',
    Promise.resolve(historyOf('新身份的问题', '新身份的回答')),
  )
  await select('conversation-1', { identity: 'user-b:tenant-b' })

  expect(completion.mock.calls[0][1]?.signal?.aborted).toBe(true)
  expect(chat.isStreaming).toBe(false)
  expect(contents()).toEqual(['新身份的问题', '新身份的回答'])
})

it('releases the stream on unmount without reporting it as an error', async () => {
  const stream = openStream()
  const completion = vi
    .spyOn(conversationAPI, 'completion')
    .mockResolvedValue(stream.response)
  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('问题')
    await flush()
  })

  await act(async () => root.unmount())
  await act(async () => {
    stream.push(delta('卸载后晚到'))
    await pending
  })

  expect(completion.mock.calls[0][1]?.signal?.aborted).toBe(true)
  expect(toast.error).not.toHaveBeenCalled()
  root = createRoot(container)
})

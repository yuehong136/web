import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { useHomeChat } from '../useHomeChat'
import { answerFrame, delta, done, flush, openStream } from './stream-fixtures'

// W4：引用按帧合并，增量帧的空数组不清空，终帧为准

const app = { id: 'dialog-1', name: 'App' } as DialogApp
type ChatOptions = Parameters<typeof useHomeChat>[0]
const appOptions: ChatOptions = {
  selectedMCPIds: [],
  selectedModelId: '',
  selectedApp: app,
  selectedConversationId: 'conversation-1',
}
let chat: ReturnType<typeof useHomeChat>
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient
const histories = new Map<string, unknown>()

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

const chunk = (
  index: number,
  overrides: Partial<ReferenceChunk> = {},
): ReferenceChunk => ({
  id: `chunk-${index}`,
  content: `片段 ${index}`,
  document_id: 'doc-1',
  document_name: 'harness.pdf',
  dataset_id: 'kb-1',
  similarity: 0.62,
  positions: [[1, 10, 20, 30, 40]],
  document_metadata: { year: 2024 },
  ...overrides,
})
const base = () => [chunk(0), chunk(1), chunk(2, { document_id: 'doc-2' })]

const answer = () => chat.messages.at(-1)
const references = () => answer()?.references

/** Starts an app answer on a stream the test feeds frame by frame. */
const startApp = async () => {
  const stream = openStream()
  vi.spyOn(conversationAPI, 'completion').mockResolvedValue(stream.response)
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
  return { stream, push, settle }
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  histories.clear()
  queryClient = new QueryClient()
  vi.spyOn(conversationAPI, 'getConversationDetail').mockImplementation(
    async (conversationId: string) =>
      histories.get(conversationId) ?? { message: [] },
  )
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

it.each<[string, Partial<ReferenceChunk>]>([
  ['metadata', { document_metadata: { year: 2025 } }],
  ['score', { similarity: 0.91 }],
  ['name', { document_name: 'harness-v2.pdf' }],
  ['positions', { positions: [[3, 12, 22, 32, 42]] }],
  ['image', { image_id: 'kb-1-img-1', doc_type: 'image' }],
])(
  'updates a reference whose %s changes only in the final frame',
  async (_field, change) => {
    const { push } = await startApp()
    await push(answerFrame('部分', { chunks: base() }))
    const received = references()!
    expect(received).toEqual(base())

    const final = base()
    final[1] = { ...final[1], ...change }
    await push(
      answerFrame('部分 [ID:1]', { chunks: final }, { final: true }),
      done,
    )

    expect(references()).toEqual(final)
    // 没变的条目沿用原对象
    expect(references()![0]).toBe(received[0])
    expect(answer()?.status).toBeUndefined()
  },
)

it('keeps the same references array while frames repeat the snapshot', async () => {
  const { push } = await startApp()
  await push(answerFrame('第一段', { chunks: base() }))
  const received = references()

  await push(answerFrame('第二段', { chunks: base() }))
  expect(answer()?.content).toBe('第一段第二段')
  expect(references()).toBe(received)

  // 什么都没变的帧不产生新的消息列表
  const messages = chat.messages
  await push(answerFrame('', { chunks: base() }))
  expect(chat.messages).toBe(messages)

  await push(
    answerFrame('第一段第二段', { chunks: base() }, { final: true }),
    done,
  )
  expect(references()).toBe(received)
})

it('keeps references through empty incremental frames and lets the final frame decide', async () => {
  const { push } = await startApp()
  await push(answerFrame('甲', { chunks: base() }))
  const received = references()

  // 真实后端的增量帧：reference 为 {chunks: []} 或 {}
  await push(answerFrame('乙', { chunks: [] }), delta('丙'))
  expect(answer()?.content).toBe('甲乙丙')
  expect(references()).toBe(received)

  const final = [chunk(7), chunk(8)]
  await push(answerFrame('甲乙丙 [ID:0]', { chunks: final }, { final: true }))
  expect(references()).toEqual(final)
})

it.each([
  ['without a chunks key (no knowledge base)', {}],
  ['with an empty chunks list', { chunks: [] }],
])(
  'clears references when the final frame is explicitly empty %s',
  async (_case, reference) => {
    const { push } = await startApp()
    await push(answerFrame('部分', { chunks: base() }))
    await push(answerFrame('完整回答', reference, { final: true }), done)

    expect(answer()?.content).toBe('完整回答')
    expect(references()).toEqual([])
    expect(answer()?.status).toBeUndefined()
  },
)

it('keeps received references when a failing final frame carries none', async () => {
  const { push, settle, stream } = await startApp()
  await push(answerFrame('部分', { chunks: base() }))
  const received = references()
  await push(
    answerFrame(
      '部分 **ERROR**: AUTH_ERROR - invalid key sk-1',
      {},
      { final: true },
    ),
    done,
  )
  await settle(() => stream.close())

  expect(answer()?.content).toBe('部分')
  expect(references()).toBe(received)
  expect(answer()?.status).toEqual({ kind: 'business', partial: true })
})

it('ignores references carried by an error frame', async () => {
  const { push, settle, stream } = await startApp()
  await push(answerFrame('部分', { chunks: base() }))
  const received = references()
  await push({
    retcode: 500,
    retmsg: 'upstream secret',
    data: {
      answer: '**ERROR**: upstream secret',
      reference: { chunks: [chunk(9)] },
    },
  })
  await settle(() => stream.close())

  expect(references()).toBe(received)
  expect(answer()?.status).toEqual({ kind: 'business', partial: true })
})

it('reads keyed chunks with their reference index and key', async () => {
  const { push } = await startApp()
  await push(
    answerFrame(
      '依据 [ID:2] 与 [ID:10]',
      { chunks: { '10': chunk(10), '0': chunk(0), '2': chunk(2) } },
      { final: true },
    ),
    done,
  )

  expect(
    references()?.map((item) => [
      item.id,
      item.reference_index,
      item.reference_key,
    ]),
  ).toEqual([
    ['chunk-0', 0, '0'],
    ['chunk-2', 2, '2'],
    ['chunk-10', 10, '10'],
  ])
})

it('keeps citation positions for repeated, out-of-order and same-document chunks', async () => {
  const { push } = await startApp()
  // 同一片段出现两次、同文档多段：编号按位置对应，不去重也不重排
  const final = [
    chunk(0),
    chunk(1),
    chunk(0),
    chunk(3, { document_id: 'doc-2' }),
  ]
  await push(
    answerFrame(
      '乙[ID:3]甲[ID:0][ID:0]丁[ID:2]缺[ID:9]',
      { chunks: final },
      { final: true },
    ),
    done,
  )

  expect(answer()?.content).toBe('乙[ID:3]甲[ID:0][ID:0]丁[ID:2]缺[ID:9]')
  expect(references()).toEqual(final)
})

it('keeps the final references of an answer stopped before the stream closes', async () => {
  const { push } = await startApp()
  await push(
    answerFrame('完整回答 [ID:0]', { chunks: base() }, { final: true }),
  )
  await act(async () => chat.stopStreaming())

  expect(references()).toEqual(base())
  expect(answer()?.status).toEqual({ kind: 'stopped', partial: true })
})

it('keeps received references when the connection breaks afterwards', async () => {
  const { push, settle, stream } = await startApp()
  await push(
    answerFrame('完整回答 [ID:0]', { chunks: base() }, { final: true }),
  )
  await settle(() => stream.fail(new TypeError('network error')))

  expect(references()).toEqual(base())
  expect(answer()?.status).toEqual({ kind: 'network', partial: true })
})

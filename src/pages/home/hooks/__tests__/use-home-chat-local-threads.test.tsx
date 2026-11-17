import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createInitialAgentTimelineState } from '@/lib/streaming'
import { toast } from '@/lib/toast'
import { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import { streamMCPAgentChat } from '../../utils/mcp-agent-stream'
import { useHomeChat } from '../useHomeChat'
import {
  MCP_TIMEOUT_MAX,
  MCP_TIMEOUT_MIN,
  clampMcpTimeout,
  useHomeChatOptions,
} from '../use-home-chat-options'

vi.mock('../../utils/mcp-agent-stream', () => ({
  streamMCPAgentChat: vi.fn(),
}))

type ChatOptions = Parameters<typeof useHomeChat>[0]
const modelMode: ChatOptions = {
  selectedMCPIds: ['server-a'],
  selectedMCPServers: [
    {
      id: 'server-a',
      name: 'Research server',
      server_type: 'sse',
      url: 'https://fixture.invalid',
    },
  ],
  selectedModelId: 'model-a',
  selectedApp: null,
  selectedConversationId: null,
  identity: 'user-a:tenant-a',
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

const render = (options: Partial<ChatOptions> = {}) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <Surface {...modelMode} {...options} />
      </QueryClientProvider>,
    ),
  )

/** Each turn answers "re: <question>" and completes. */
const answerEveryTurn = () =>
  vi
    .mocked(streamMCPAgentChat)
    .mockImplementation(async ({ request, onState }) => {
      onState({
        ...createInitialAgentTimelineState(),
        answer: `re: ${request.messages.at(-1)?.content}`,
        final: true,
      })
      return { reason: 'eof' }
    })

const ask = (question: string, files?: string[]) =>
  act(async () => {
    await chat.sendMessage(question, files)
  })

const contents = () => chat.messages.map((message) => message.content)

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  queryClient = new QueryClient()
  vi.mocked(streamMCPAgentChat).mockReset()
  vi.spyOn(toast, 'error').mockImplementation(() => 1)
  useHomeChatOptions.setState({ mcpTimeout: MCP_TIMEOUT_MAX })
  useHomeChatOptions.setState({ verboseToolUse: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await render()
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('sends attachment ids and the MCP call options with model and MCP turns', async () => {
  answerEveryTurn()
  act(() => {
    useHomeChatOptions.getState().setMcpTimeout(1500)
    useHomeChatOptions.getState().setVerboseToolUse(false)
  })
  await ask('question', ['file-1', 'file-2'])
  const request = vi.mocked(streamMCPAgentChat).mock.calls[0][0].request
  expect(request.files).toEqual(['file-1', 'file-2'])
  expect(request.mcp_timeout).toBe(1500)
  expect(request.verbose_tool_use).toBe(false)
  expect(request.mcp_ids).toEqual(['server-a'])
  expect(request.structured_output).toBe(true)
})

it('keeps the MCP timeout inside the range the endpoint accepts', () => {
  expect(clampMcpTimeout(5)).toBe(MCP_TIMEOUT_MIN)
  expect(clampMcpTimeout(99_999)).toBe(MCP_TIMEOUT_MAX)
  expect(clampMcpTimeout(1234.4)).toBe(1234)
  expect(clampMcpTimeout(Number.NaN)).toBe(MCP_TIMEOUT_MAX)
})

it('sets a conversation aside on new chat and reopens it with its history', async () => {
  answerEveryTurn()
  await ask('first question')
  expect(chat.localThreads).toEqual([])
  await act(async () => chat.startNewChat())
  expect(chat.messages).toEqual([])
  expect(chat.localThreads.map((thread) => thread.title)).toEqual([
    'first question',
  ])

  await ask('second question')
  const first = chat.localThreads[0].id
  await act(async () => chat.openLocalThread(first))
  // The shown conversation swaps places with the reopened one.
  expect(contents()).toEqual(['first question', 're: first question'])
  expect(chat.localThreads.map((thread) => thread.title)).toEqual([
    'second question',
  ])

  // A follow-up carries the reopened conversation's history.
  await ask('follow-up')
  const followUp = vi.mocked(streamMCPAgentChat).mock.calls.at(-1)![0].request
  expect(followUp.messages.map((message) => message.content)).toEqual([
    'first question',
    're: first question',
    'follow-up',
  ])
})

it('settles a running answer as stopped when its conversation is set aside', async () => {
  let release: (() => void) | undefined
  vi.mocked(streamMCPAgentChat).mockImplementation(
    ({ onState, signal }) =>
      new Promise((resolve) => {
        onState({ ...createInitialAgentTimelineState(), answer: 'partial' })
        release = () => resolve({ reason: 'eof' })
        signal.addEventListener('abort', () => resolve({ reason: 'aborted' }))
      }),
  )
  let pending: ReturnType<typeof chat.sendMessage> = false
  await act(async () => {
    pending = chat.sendMessage('long question')
  })
  expect(chat.isStreaming).toBe(true)
  await act(async () => {
    chat.startNewChat()
    await pending
  })
  release?.()
  expect(chat.isStreaming).toBe(false)
  const [kept] = chat.localThreads
  const answer = kept.messages.at(-1)!
  expect(answer.content).toBe('partial')
  expect(answer.isStreaming).toBe(false)
  expect(answer.status?.kind).toBe('stopped')
})

it('drops this visit’s conversations when the identity changes', async () => {
  answerEveryTurn()
  await ask('private question')
  await act(async () => chat.startNewChat())
  expect(chat.localThreads).toHaveLength(1)
  await render({ identity: 'user-b:tenant-b' })
  expect(chat.localThreads).toEqual([])
})

it('keeps app conversations out of the local list', async () => {
  answerEveryTurn()
  await render({
    selectedApp: { id: 'dialog-1', name: 'App' } as DialogApp,
    selectedMCPIds: [],
    selectedMCPServers: [],
  })
  await act(async () => chat.startNewChat())
  expect(chat.localThreads).toEqual([])
  expect(streamMCPAgentChat).not.toHaveBeenCalled()
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { useHomeStore } from '@/stores/home'
import type { UserInfo } from '@/types/api'
import type { useHomeChat } from '../hooks'
import { HomePage } from '../HomePage'

interface SectionProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
}

let section: SectionProps
let chatOptions: Parameters<typeof useHomeChat>[0]
const sendMessage = vi.fn<(input: string) => Promise<void> | false>()

vi.mock('../hooks', () => ({
  useHomeChat: (options: Parameters<typeof useHomeChat>[0]) => {
    chatOptions = options
    return {
      messages: [],
      isStreaming: false,
      streamingContent: '',
      streamingThinking: '',
      isToolAnalyzing: false,
      isLoadingHistory: false,
      isSendPending: false,
      sendMessage,
      stopStreaming: () => undefined,
    }
  },
}))

vi.mock('../components', () => {
  const Section = (props: SectionProps) => {
    section = props
    return null
  }
  return { WelcomeSection: Section, ChatSection: Section }
})

let root: Root
let host: HTMLDivElement

const type = (value: string) => act(async () => section.onInputChange(value))
const send = () => act(async () => section.onSend())

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sendMessage.mockReset()
  useHomeStore.getState().reset()
  useAuthStore.setState({
    user: { id: 'user-a', tenant_id: 'tenant-a' } as UserInfo,
  })
  host = document.createElement('div')
  root = createRoot(host)
  await act(async () => root.render(<HomePage />))
})

afterEach(async () => {
  await act(async () => root.unmount())
  useAuthStore.setState({ user: null })
  vi.unstubAllGlobals()
})

it('keeps the draft when the send is rejected', async () => {
  sendMessage.mockReturnValue(false)
  await type('请保留我')
  await send()

  expect(sendMessage).toHaveBeenCalledWith('请保留我')
  expect(section.inputValue).toBe('请保留我')
})

it('clears only the draft that was accepted', async () => {
  sendMessage.mockReturnValue(Promise.resolve())
  await type('第一条')
  await send()

  expect(section.inputValue).toBe('')
})

it('carries the next draft over when the new conversation gets its id', async () => {
  sendMessage.mockReturnValue(Promise.resolve())
  await type('新会话第一条')
  await send()
  await type('准备期间写下的下一条')

  await act(async () => chatOptions.onConversationIdChange?.('conversation-1'))

  expect(useHomeStore.getState().selectedConversationId).toBe('conversation-1')
  expect(section.inputValue).toBe('准备期间写下的下一条')
})

it('shows each conversation its own draft', async () => {
  await type('写给新会话')
  await act(async () =>
    useHomeStore.getState().selectConversation('conversation-b'),
  )

  expect(section.inputValue).toBe('')

  await act(async () => useHomeStore.getState().selectConversation(null))

  expect(section.inputValue).toBe('写给新会话')
})

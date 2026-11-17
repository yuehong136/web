import { act, useEffect, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'
import { uploadConfig } from '@/config/chat'
import { toast } from '@/lib/toast'
import { setProductLanguage } from '@/locales/i18n'
import { useAuthStore } from '@/stores/auth'
import { useHomeStore } from '@/stores/home'
import type { DialogApp, UserInfo } from '@/types/api'
import {
  HomeAttachmentsContext,
  useHomeAttachments,
  type HomeAttachments,
} from '../../hooks/use-home-attachments'
import { useHomeChatOptions } from '../../hooks/use-home-chat-options'
import type { HomeLocalThread } from '../../hooks/use-home-local-threads'
import { HomeComposer } from '../home-composer'
import { HomeThreadActions, LocalThreadCards } from '../local-threads'

vi.mock('@/hooks/use-model-provider-request', () => ({
  useDefaultModelReference: () => ({
    reference: 'model-a',
    isPending: false,
    isError: false,
  }),
}))
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: () => ({
    myLLMs: {},
    isLoading: false,
    isPending: false,
    isError: false,
  }),
}))
vi.mock('@/hooks/use-chat-request', () => ({
  useFetchConversationsByDialog: () => ({ conversations: [] }),
}))
vi.mock('../SkillPanel', () => ({ SkillPanel: () => null }))
// The tray's picker loads the antd-x barrel, which Node cannot resolve.
vi.mock('@/components/chat/controlled-attachments', () => ({
  ControlledAttachments: () => <div data-attachment-picker />,
}))
vi.mock('@/components/chat/ChatModelSelector', () => ({
  ChatModelSelector: () => null,
}))

let root: Root
let container: HTMLDivElement
let attachments: HomeAttachments

function Tray({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  const tray = useHomeAttachments(enabled, null)
  useEffect(() => {
    attachments = tray
  }, [tray])
  return (
    <HomeAttachmentsContext.Provider value={tray}>
      {children}
    </HomeAttachmentsContext.Provider>
  )
}

function Composer({ enabled = true }: { enabled?: boolean }) {
  const [value, onChange] = useState('')
  return (
    <Tray enabled={enabled}>
      <HomeComposer
        value={value}
        onChange={onChange}
        onSend={() => undefined}
        request={{ phase: 'idle' }}
        placement="welcome"
      />
    </Tray>
  )
}

const render = (node: ReactNode) => act(async () => root.render(node))
const byLabel = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)

const thread = (id: string, title: string): HomeLocalThread => ({
  id,
  title,
  updatedAt: Date.now(),
  messages: [
    { id: `${id}-q`, role: 'user', content: title, timestamp: '' },
    { id: `${id}-a`, role: 'assistant', content: 'answer', timestamp: '' },
  ],
})

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  stubChatDOM()
  await setProductLanguage('en-US')
  useHomeStore.getState().reset()
  useHomeStore.getState().setSelectedModelId('model-a')
  useHomeChatOptions.setState({ fullWidth: false })
  useAuthStore.setState({
    user: { id: 'user-a', tenant_id: 'tenant-a' } as UserInfo,
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  useHomeStore.getState().reset()
  useAuthStore.setState({ user: null })
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('offers attachments and MCP call options on model and MCP turns', async () => {
  await render(<Composer />)
  const paperclip = byLabel('Add attachment')!
  expect(paperclip).toBeTruthy()
  // MCP options appear once an MCP service is in scope.
  expect(byLabel('MCP tool settings')).toBeNull()
  await act(async () =>
    useHomeStore.getState().selectSkill({
      id: 'server-a',
      name: 'Research server',
      server_type: 'sse',
      url: 'https://fixture.invalid',
    }),
  )
  expect(byLabel('MCP tool settings')).toBeTruthy()

  await act(async () => paperclip.click())
  expect(paperclip.getAttribute('aria-pressed')).toBe('true')
  expect(
    container.querySelector('section[aria-label="Attachments"]'),
  ).toBeTruthy()
  expect(container.querySelector('[data-attachment-picker]')).toBeTruthy()
  await act(async () => byLabel('Close attachments')!.click())
  expect(container.querySelector('[data-home-attachments]')).toBeNull()
})

it('hides attachments while an app answers', async () => {
  await act(async () =>
    useHomeStore
      .getState()
      .selectApp({ id: 'dialog-1', name: 'App' } as DialogApp),
  )
  await render(<Composer enabled={false} />)
  expect(byLabel('Add attachment')).toBeNull()
  expect(byLabel('MCP tool settings')).toBeNull()
})

it('refuses files over the size limit before uploading', async () => {
  const error = vi.spyOn(toast, 'error').mockImplementation(() => 1)
  await render(<Composer />)
  const big = new File(['x'], 'huge.pdf', { type: 'application/pdf' })
  Object.defineProperty(big, 'size', { value: uploadConfig.maxSize + 1 })
  await act(async () => attachments.add(big))
  expect(error).toHaveBeenCalledWith('File huge.pdf exceeds the size limit')
  expect(attachments.files).toEqual([])
})

it('reopens this visit’s chats from the header and the new chat page', async () => {
  const onOpen = vi.fn()
  const onNewChat = vi.fn()
  await render(
    <HomeThreadActions
      threads={[thread('t-1', 'Earlier question')]}
      onOpen={onOpen}
      onNewChat={onNewChat}
    />,
  )
  await act(async () => byLabel('New chat')!.click())
  expect(onNewChat).toHaveBeenCalledOnce()

  await act(async () => byLabel('Earlier chats')!.click())
  const item = [...document.querySelectorAll('[role="menuitem"]')].find(
    (node) => node.textContent?.includes('Earlier question'),
  ) as HTMLElement
  await act(async () => item.click())
  expect(onOpen).toHaveBeenCalledWith('t-1')

  const width = byLabel('Full width')!
  expect(width.getAttribute('aria-pressed')).toBe('false')
  await act(async () => width.click())
  expect(useHomeChatOptions.getState().fullWidth).toBe(true)
  expect(width.getAttribute('aria-pressed')).toBe('true')

  await render(
    <LocalThreadCards
      threads={[thread('t-2', 'Card question')]}
      onOpen={onOpen}
    />,
  )
  expect(container.textContent).toContain('Earlier in this visit')
  expect(container.textContent).toContain('2 messages')
  const open = [...container.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('Card question'),
  )!
  await act(async () => open.click())
  expect(onOpen).toHaveBeenLastCalledWith('t-2')
})

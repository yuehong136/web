import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HomeComposer } from '@/pages/home/components/home-composer'
import { RecentAppConversations } from '@/pages/home/components/recent-app-conversations'
import { useHomeStore } from '@/stores/home'
import { useAuthStore } from '@/stores/auth'
import { setProductLanguage } from '@/locales/i18n'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'
import { useFetchConversationsByDialog } from '@/hooks/use-chat-request'
import type { DialogApp, UserInfo } from '@/types/api'

const models = {
  provider: {
    tags: '',
    llm: [
      { name: 'model-a', type: 'chat', used_token: 0 },
      { name: 'model-b', type: 'chat', used_token: 0 },
    ],
  },
}
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: () => ({ myLLMs: models, isLoading: false }),
}))
vi.mock('@/hooks/use-chat-request', () => ({
  useFetchConversationsByDialog: vi.fn(),
}))
vi.mock('../SkillPanel', () => ({ SkillPanel: () => null }))
vi.mock('@/components/chat/ChatModelSelector', () => ({
  ChatModelSelector: () => null,
}))

let root: Root
let container: HTMLDivElement
function Surface() {
  const [value, onChange] = useState('草稿 draft')
  return (
    <HomeComposer
      value={value}
      onChange={onChange}
      onSend={() => undefined}
      request={{ phase: 'idle' }}
      placement="welcome"
    />
  )
}
beforeEach(async () => {
  stubChatDOM()
  await setProductLanguage('en-US')
  useHomeStore.getState().reset()
  useHomeStore.getState().setSelectedModelId('model-a')
  useAuthStore.setState({
    user: { id: 'user-a', tenant_id: 'tenant-a' } as UserInfo,
  })
  vi.mocked(useFetchConversationsByDialog).mockReturnValue({
    conversations: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch:
      vi.fn<ReturnType<typeof useFetchConversationsByDialog>['refetch']>(),
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
  vi.unstubAllGlobals()
})

it('expands real selected scope and retains the live draft across language and model changes', async () => {
  useHomeStore.getState().selectSkill({
    id: 'server-a',
    name: 'Actual server',
    server_type: 'sse',
    url: 'https://fixture.invalid',
  })
  await act(async () => root.render(<Surface />))
  const input = container.querySelector('textarea')!
  const details = container.querySelector('details')!
  await act(async () => container.querySelector('summary')!.click())
  expect(details.open).toBe(true)
  expect(details.textContent).toContain('model-a')
  expect(details.textContent).toContain('Actual server')
  expect(details.textContent).toContain('Availability unknown')
  expect(details.textContent).toContain('Selected')
  await act(async () => {
    useHomeStore.getState().setSelectedModelId('model-b')
    await setProductLanguage('zh-CN')
  })
  expect(container.querySelector('textarea')).toBe(input)
  expect(input.value).toBe('草稿 draft')
  expect(container.querySelector('details')).toBe(details)
  expect(details.open).toBe(true)
  expect(details.textContent).toContain('model-b')
  expect(details.textContent).not.toContain('model-a')
  expect(details.textContent).not.toContain('Turn context')
})

it('discloses app bindings and knowledge names rather than the unsent fallback model', async () => {
  useHomeStore.setState({
    selectedAppIds: ['app-a'],
    selectedApps: [
      {
        id: 'app-a',
        name: 'Actual app',
        llm_id: 'bound-model',
        kb_ids: ['kb-a'],
        kb_names: ['Actual knowledge'],
      } as DialogApp,
    ],
    selectedModelId: 'unsent-fallback',
    selectedMCPIds: ['unsent-server'],
  })
  await act(async () => root.render(<Surface />))
  const details = container.querySelector('details')!
  expect(details.textContent).toContain('Actual app')
  expect(details.textContent).toContain('bound-model')
  expect(details.textContent).toContain('Actual knowledge')
  expect(details.textContent).toContain('From conversation settings')
  expect(details.textContent).not.toContain('unsent-')
})

it('continues only real app conversations from the available history response', async () => {
  useHomeStore.setState({
    selectedApps: [{ id: 'app-a', name: 'Actual app' } as DialogApp],
  })
  vi.mocked(useFetchConversationsByDialog).mockReturnValue({
    conversations: [
      { id: 'older', name: 'Older conversation', update_time: 1 },
      { id: 'newer', title: 'Newer conversation', update_time: 2 },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch:
      vi.fn<ReturnType<typeof useFetchConversationsByDialog>['refetch']>(),
  })
  await act(async () => root.render(<RecentAppConversations />))
  const buttons = container.querySelectorAll('button')
  expect(buttons[0]?.textContent).toContain('Newer conversation')
  await act(async () => buttons[0]?.click())
  expect(useHomeStore.getState().selectedConversationId).toBe('newer')
  expect(useFetchConversationsByDialog).toHaveBeenCalledWith('app-a')
  vi.mocked(useFetchConversationsByDialog).mockReturnValue({
    conversations: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch:
      vi.fn<ReturnType<typeof useFetchConversationsByDialog>['refetch']>(),
  })
  await act(async () => root.render(<RecentAppConversations />))
  expect(container.querySelector('section')).toBeNull()
})

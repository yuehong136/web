import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'
import type { DialogApp } from '@/types/api'
import type { ExploreSidebar } from '../components/explore-sidebar'

type SidebarProps = Parameters<typeof ExploreSidebar>[0]

const app = {
  id: 'app-1',
  name: 'Explore 知识库兜底验证',
  description: 'Answers from the fallback knowledge base.',
  icon: '',
  status: '1',
  llm_id: '',
  prompt_config: { prologue: 'Hello, ask me anything.' },
} as unknown as DialogApp
const inactive = {
  ...app,
  id: 'app-2',
  name: 'Not yet added',
  status: '0',
} as DialogApp
let sidebar: SidebarProps
// The page adjusts state when hook results change identity, so hook results
// stay the same objects across renders, as Query results do.
const stable = vi.hoisted(() => ({
  apps: { data: [] as unknown[], isLoading: false, error: null },
  settings: {
    settings: { llmId: '', tavilyApiKey: '' },
    loading: false,
    saving: false,
    saveSettings: () => undefined,
  },
  knowledge: { knowledgeBases: [], loadKnowledgeBases: () => undefined },
  rerank: [],
  models: { myLLMs: {}, modelRequest: { loading: false, error: null } },
  conversations: {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => undefined,
  },
}))
stable.apps.data = [app, inactive]

vi.mock('@/hooks/use-model-selector-request', () => ({
  useModelSelectorRequest: () => stable.models,
}))
vi.mock('@/hooks/use-dialog-apps', () => ({
  useDialogApps: () => stable.apps,
}))
vi.mock('@/hooks/use-chat-settings', () => ({
  useChatSettings: () => stable.settings,
  useKnowledgeBases: () => stable.knowledge,
  useRerankModels: () => stable.rerank,
}))
vi.mock('@/hooks/use-chat-upload', () => ({
  useChatUpload: () => ({
    files: [],
    uploading: false,
    upload: vi.fn(),
    removeFile: vi.fn(),
    clearFiles: vi.fn(),
    getUploadedFiles: () => [],
    hasError: false,
    retry: vi.fn(),
  }),
}))
vi.mock('../hooks/use-dialog-conversations', () => ({
  useDialogConversations: () => stable.conversations,
}))
vi.mock('@/pages/explore/hooks/use-explore-conversation', () => ({
  useExploreConversation: () => ({
    messages: [],
    setMessages: vi.fn(),
    selectedConversationDetail: null,
    setSelectedConversationDetail: vi.fn(),
    activeConversationKey: undefined,
    isStreaming: false,
    isLoadingConversation: false,
    captureSession: () => () => true,
    resetConversation: vi.fn(),
    fetchConversationDetail: vi.fn(),
    abortChat: vi.fn(),
  }),
}))
vi.mock('@/pages/explore/hooks/use-explore-send', () => ({
  useExploreSend: () => vi.fn(),
}))
vi.mock('@/components/chat/ChatSettingsPanel', () => ({
  ChatSettingsPanel: () => null,
  defaultChatSettings: {},
}))
vi.mock('../components/explore-sidebar', () => ({
  ExploreSidebar: (props: SidebarProps) => {
    sidebar = props
    return null
  },
}))
// The thread and attachment list pull antd-x code blocks Vitest cannot load;
// this test is about the page's headings, not their rendering.
vi.mock('../components/explore-thread', () => ({ ExploreThread: () => null }))
vi.mock('@/components/chat/controlled-attachments', () => ({
  ControlledAttachments: () => null,
}))
vi.mock('../components/explore-chat-answer', () => ({
  ExploreChatAnswer: ({ content }: { content: string }) => <p>{content}</p>,
}))

const { ExplorePage } = await import('../ExplorePage')

let root: Root
let host: HTMLDivElement
beforeEach(async () => {
  stubChatDOM()
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

const headings = (level: string) =>
  [...host.querySelectorAll(level)].map((heading) => heading.textContent)

it('names the app once as the page heading in a new conversation', () => {
  expect(headings('h1')).toEqual(['Explore 知识库兜底验证'])
  // The empty state repeats the name only as a section heading.
  expect(headings('h2')).toContain('Explore 知识库兜底验证')
  expect(host.textContent).toContain('Hello, ask me anything.')
  expect(
    host.querySelectorAll('[aria-label="Ways to start"] button'),
  ).toHaveLength(4)
})

it('keeps one page heading in the app market and opens added apps from it', async () => {
  await act(async () => sidebar.onDiscoverClick())
  expect(headings('h1')).toEqual(['App Market'])
  const cards = host.querySelectorAll('[data-slot="resource-card"]')
  expect(cards).toHaveLength(2)
  // Only apps already in the workspace open a conversation.
  const added = cards[0].querySelector<HTMLButtonElement>(
    '[data-slot="resource-name"]',
  )!
  expect(added.tagName).toBe('BUTTON')
  expect(cards[1].querySelector('[data-slot="resource-name"]')!.tagName).toBe(
    'SPAN',
  )
  await act(async () => added.click())
  expect(headings('h1')).toEqual(['Explore 知识库兜底验证'])
})

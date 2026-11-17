import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import type { Memory, MemoryMessage } from '@/types/memory'
import { MemoryMessagesPage } from '../MemoryMessagesPage'
import { MemorySettingsPage } from '../MemorySettingsPage'

const mock = vi.hoisted(() => ({
  messages: vi.fn(),
  update: vi.fn(),
  forget: vi.fn(),
  save: vi.fn(),
  inspected: [] as unknown[],
}))
vi.mock('@/hooks/use-memory', () => ({
  useMemoryDetail: () => ({ data: memory }),
  useMemoryConfig: () => ({
    data: memory,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useMessageList: (_id: string, params: { page_size: number }) =>
    params.page_size === 1
      ? { data: { message_list: [], total_count: 3 }, isPending: false }
      : mock.messages(params),
  useUpdateMessageState: () => ({ mutate: mock.update, isPending: false }),
  useForgetMessage: () => ({ mutateAsync: mock.forget, isPending: false }),
  useUpdateMemory: () => ({ mutateAsync: mock.save, isPending: false }),
}))
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: () => ({ myLLMs: {}, isPending: false, isError: false }),
}))
vi.mock('@/components/memory/memory-recall-panel', () => ({
  MemoryRecallPanel: ({ open }: { open: boolean }) =>
    open ? <p>recall-panel</p> : null,
}))
vi.mock('@/components/memory/memory-message-inspector', () => ({
  MemoryMessageInspector: ({ message }: { message: unknown }) => {
    if (message) mock.inspected.push(message)
    return null
  },
}))
vi.mock('@/components/memory/memory-source-pagination', () => ({
  MemorySourcePagination: ({ page }: { page: number }) => (
    <nav aria-label="pager">page {page}</nav>
  ),
}))

const memory = {
  id: 'm1',
  name: 'Support memory',
  avatar: '',
  memory_type: ['raw', 'semantic'],
  storage_type: 'table',
  permissions: 'me',
  embd_id: 'bge-m3@BAAI',
  llm_id: 'gpt-4o@OpenAI',
  memory_size: 5242880,
  forgetting_policy: 'FIFO',
  temperature: 0.5,
  system_prompt: '',
  user_prompt: '',
} as unknown as Memory
const extract = {
  message_id: 11,
  source_id: 10,
  memory_id: 'm1',
  session_id: 'session-a',
  agent_name: 'Helper',
  message_type: 'semantic',
  valid_at: '2026-11-09',
  forget_at: 'None',
  status: true,
  content: 'Likes green tea',
} as MemoryMessage
const disabled = {
  ...extract,
  message_id: 12,
  status: false,
  content: 'Lives in Hangzhou',
} as MemoryMessage
const source = {
  ...extract,
  message_id: 10,
  message_type: 'raw',
  content: 'User Input: hi',
  extract: [extract, disabled],
} as MemoryMessage

let root: Root
let container: HTMLDivElement
const listMessages = (list: MemoryMessage[]) =>
  mock.messages.mockReturnValue({
    data: { message_list: list, total_count: list.length },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  })
const buttons = (scope: ParentNode = document.body) => [
  ...scope.querySelectorAll<HTMLButtonElement>('button'),
]
const byText = (text: string, scope?: ParentNode) =>
  buttons(scope).find((element) => element.textContent?.trim() === text)
const byLabel = (label: string) =>
  buttons().find((element) => element.getAttribute('aria-label') === label)

async function render(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/memory', element: <p>memory-list</p> },
      { path: '/agents', element: <p>agents</p> },
      { path: '/memory/:id', element: <MemoryMessagesPage /> },
      { path: '/memory/:id/settings', element: <MemorySettingsPage /> },
    ],
    { initialEntries: [path] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  return router
}

beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  mock.inspected.length = 0
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('heads the workspace with the memory identity and extraction model', async () => {
  listMessages([source])
  await render('/memory/m1')
  const head = container.querySelector('[data-slot="page-title-bar"]')!
  expect(head.querySelector('h1')?.textContent).toBe('Memory workspace')
  expect(head.textContent).toContain('Support memory')
  const avatar = head.querySelector('[data-slot="entity-avatar"] span')!
  expect(avatar.className).toContain('bg-components-avatar-8-bg')
  expect(avatar.querySelector('svg')).toBeTruthy()
  const model = head.querySelector('[data-slot="memory-model"]')!
  expect(model.textContent).toBe('gpt-4o')
  expect(model.querySelector('[data-slot="provider-logo"]')).toBeTruthy()
  expect(head.textContent).toContain('Raw, Semantic')
  const back = head.querySelector<HTMLAnchorElement>('a[href="/memory"]')!
  expect(back.textContent).toBe('All memory banks')
  await act(async () => byText('Test retrieval', head)!.click())
  expect(container.textContent).toContain('recall-panel')
})

it('keeps every record action on the entry cards', async () => {
  listMessages([source])
  await render('/memory/m1')
  const cards = container.querySelectorAll('article')
  expect(cards).toHaveLength(2)
  const dots = [...container.querySelectorAll('[data-slot="status-dot"]')]
  expect(dots.map((dot) => dot.getAttribute('data-tone'))).toEqual([
    'success',
    'neutral',
  ])
  await act(async () => byLabel('Toggle message 11')!.click())
  expect(mock.update).toHaveBeenCalledWith({
    memoryId: 'm1',
    messageId: 11,
    status: false,
  })
  await act(async () => byText('Source', cards[0])!.click())
  expect(mock.inspected.at(-1)).toBe(source)
  await act(async () => byText('Likes green tea', cards[0])!.click())
  expect(mock.inspected.at(-1)).toBe(extract)

  mock.forget.mockResolvedValue(undefined)
  await act(async () => byLabel('Forget record #12')!.click())
  const confirm = buttons(document.querySelector('[role="alertdialog"]')!)
  await act(async () =>
    confirm.find((b) => b.textContent === 'Forget')!.click(),
  )
  expect(mock.forget).toHaveBeenCalledWith({ memoryId: 'm1', messageId: 12 })

  const disabledFilter = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  ].find((radio) => radio.textContent?.startsWith('Disabled'))!
  expect(disabledFilter.textContent).toContain('1')
  await act(async () => disabledFilter.click())
  expect(container.querySelectorAll('article')).toHaveLength(1)
  expect(container.textContent).toContain('Lives in Hangzhou')
})

it('offers start paths when the memory has no messages yet', async () => {
  listMessages([])
  const router = await render('/memory/m1')
  const empty = container.querySelector('[data-slot="empty-start"]')!
  expect(empty.textContent).toContain('No messages')
  await act(async () =>
    buttons(empty)
      .find((button) => button.textContent?.startsWith('Tune memory'))!
      .click(),
  )
  expect(router.state.location.pathname).toBe('/memory/m1/settings')
})

it('shows locked models with their logos and saves without the memory type', async () => {
  listMessages([])
  mock.save.mockResolvedValue(undefined)
  await render('/memory/m1/settings')
  const head = container.querySelector('[data-slot="page-title-bar"]')!
  expect(head.querySelector('h1')?.textContent).toBe('Settings & policies')
  expect(
    head.querySelector<HTMLAnchorElement>('a[href="/memory/m1"]')?.textContent,
  ).toBe('Support memory')
  expect(
    head.querySelector('[data-slot="status-dot"]')?.getAttribute('data-tone'),
  ).toBe('success')
  const rows = [...container.querySelectorAll('[data-slot="memory-model-row"]')]
  expect(rows.map((row) => row.textContent)).toEqual([
    expect.stringContaining('bge-m3@BAAI'),
    expect.stringContaining('gpt-4o@OpenAI'),
  ])
  expect(rows[1].querySelector('[data-slot="provider-logo"]')).toBeTruthy()

  const save = byText('Save', head)!
  expect(save.disabled).toBe(true)
  const name = container.querySelector<HTMLInputElement>('input[name="name"]')!
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!
    setter.call(name, 'Renamed memory')
    name.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(
    head.querySelector('[data-slot="status-dot"]')?.getAttribute('data-tone'),
  ).toBe('warning')
  await act(async () => save.click())
  await vi.waitFor(() => expect(mock.save).toHaveBeenCalled())
  const [{ id, data }] = mock.save.mock.calls[0]
  expect(id).toBe('m1')
  expect(data.name).toBe('Renamed memory')
  expect(data.memory_type).toBeUndefined()
})

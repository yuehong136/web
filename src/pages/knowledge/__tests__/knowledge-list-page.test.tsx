import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import type { KnowledgeBase } from '@/types/api'
import { KnowledgeListPage } from '../KnowledgeListPage'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  deleteKnowledge: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))
vi.mock('@/hooks/use-knowledge-request', () => ({
  useFetchKnowledgeList: mocks.list,
  useDeleteKnowledge: () => ({ deleteKnowledge: mocks.deleteKnowledge }),
  useUpdateKnowledge: () => ({ updateKnowledge: vi.fn() }),
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

const base = (
  id: string,
  overrides: Partial<KnowledgeBase> = {},
): KnowledgeBase =>
  ({
    id,
    name: id,
    tenant_id: 'tenant',
    permission: 'me',
    doc_num: 0,
    chunk_num: 0,
    token_num: 0,
    parser_id: 'naive',
    embd_id: 'bge-m3',
    update_time: 1_763_000_000_000,
    ...overrides,
  }) as KnowledgeBase

// One page of a 40-base collection.
const page = [
  base('Manuals', { doc_num: 4, chunk_num: 120, permission: 'team' }),
  base('Drafts'),
  base('Contracts', { doc_num: 2, chunk_num: 30 }),
]

let root: Root
let container: HTMLDivElement
const click = (element: Element) =>
  act(async () => (element as HTMLElement).click())
const buttonByText = (text: string, scope: ParentNode = document) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === text,
  )

async function render() {
  const router = createMemoryRouter(
    [
      { path: '/knowledge', element: <KnowledgeListPage /> },
      { path: '/knowledge/create', element: <h1>Create page</h1> },
      { path: '/settings/datasource', element: <h1>Data sources</h1> },
    ],
    { initialEntries: ['/knowledge'] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  return router
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  mocks.list.mockReturnValue({
    knowledgeBases: page,
    total: 40,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  mocks.deleteKnowledge.mockResolvedValue(undefined)
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('counts the whole collection in the title and labels sums as this page', async () => {
  await render()
  const head = container.querySelector('[data-slot="page-title-bar"]')!
  expect(head.querySelector('h1')?.textContent).toBe('Knowledge bases')
  expect(head.textContent).toContain('40 knowledge bases')

  const stats = container.querySelector('[data-slot="knowledge-page-stats"]')!
  expect(stats.closest('[data-slot="collection-footer"]')).not.toBeNull()
  const figures = [...stats.querySelectorAll('dt')].map((term) => [
    term.textContent,
    term.nextElementSibling?.textContent,
  ])
  expect(figures).toEqual([
    ['Bases on this page', '3'],
    ['Documents on this page', '6'],
    ['Chunks on this page', '150'],
  ])
  // No stat-card row: the page-scoped InlineStats is the only figure strip.
  expect(container.querySelectorAll('dl')).toHaveLength(1)
})

it('groups the page by document status, empty bases first', async () => {
  await render()
  const groups = [
    ...container.querySelectorAll<HTMLElement>('[data-slot="knowledge-group"]'),
  ].map((heading) => heading.textContent)
  expect(groups).toEqual(['Empty1', 'Has documents2'])
  const lists = [...container.querySelectorAll('ul[aria-label]')].map(
    (list) => [
      list.getAttribute('aria-label'),
      [...list.querySelectorAll('[data-slot="resource-name"]')].map(
        (name) => name.textContent,
      ),
    ],
  )
  expect(lists).toEqual([
    ['Empty', ['Drafts']],
    ['Has documents', ['Manuals', 'Contracts']],
  ])
})

it('creates through the full create page, not a dialog', async () => {
  const router = await render()
  await click(buttonByText('Create knowledge base', container)!)
  expect(router.state.location.pathname).toBe('/knowledge/create')
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(container.querySelector('h1')?.textContent).toBe('Create page')
})

it('deletes the selected bases after a confirm dialog', async () => {
  await render()
  const select = container.querySelector<HTMLElement>(
    '[aria-label="Select Drafts"]',
  )!
  await click(select)
  const bar = container.querySelector('[data-slot="bulk-action-bar"]')!
  expect(bar.textContent).toContain('1 selected')
  await click(buttonByText('Delete', bar)!)
  const dialog = document.querySelector('[role="alertdialog"]')!
  expect(dialog.textContent).toContain('Delete the selected knowledge base?')
  expect(mocks.deleteKnowledge).not.toHaveBeenCalled()
  await click(buttonByText('Delete', dialog)!)
  expect(mocks.deleteKnowledge).toHaveBeenCalledExactlyOnceWith('Drafts')
  expect(container.querySelector('[data-slot="bulk-action-bar"]')).toBeNull()
})

it('opens small collections as cards with identity chips and a create card', async () => {
  mocks.list.mockReturnValue({
    knowledgeBases: page,
    total: 3,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  const router = await render()
  const cards = [
    ...container.querySelectorAll<HTMLElement>('[data-slot="resource-card"]'),
  ]
  expect(cards.map((card) => card.querySelector('h3')?.textContent)).toEqual([
    'Drafts',
    'Manuals',
    'Contracts',
  ])
  const manuals = cards[1]
  const chips = [
    ...manuals.querySelectorAll('[data-slot="resource-chip"]'),
  ].map((chip) => chip.textContent)
  expect(chips).toEqual(['bge-m3', '4 documents', '120 chunks'])
  // Quick actions fold into the card menu; selection still works.
  expect(
    manuals.querySelector('[aria-label="More actions for Manuals"]'),
  ).not.toBeNull()
  expect(manuals.querySelector('[aria-label="Select Manuals"]')).not.toBeNull()

  const create = container.querySelector<HTMLButtonElement>(
    '[data-slot="resource-create-card"] button',
  )!
  await click(create)
  expect(router.state.location.pathname).toBe('/knowledge/create')
})

it('keeps the view the user picked over the small-collection default', async () => {
  mocks.list.mockReturnValue({
    knowledgeBases: page,
    total: 3,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  await render()
  expect(container.querySelector('[data-slot="resource-card"]')).not.toBeNull()
  const list = container.querySelector<HTMLElement>(
    '[role="radio"][aria-label="List view"]',
  )!
  await click(list)
  expect(container.querySelector('[data-slot="resource-card"]')).toBeNull()
  expect(container.querySelectorAll('[data-slot="resource-row"]')).toHaveLength(
    3,
  )
})

it('starts an empty workspace with real start paths, not a bare message', async () => {
  mocks.list.mockReturnValue({
    knowledgeBases: [],
    total: 0,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  const router = await render()
  const start = container.querySelector('[data-slot="empty-start"]')!
  expect(start.querySelector('h2')?.textContent).toBe(
    'Build a knowledge base so every answer has a source',
  )
  // No filter bar or header create button over an empty workspace.
  expect(buttonByText('Create knowledge base', container)).toBeUndefined()
  const paths = [...start.querySelectorAll<HTMLButtonElement>('li button')]
  expect(
    paths.map((path) => path.querySelector('span span')?.textContent),
  ).toEqual(['Upload files', 'Connect a data source'])
  await click(paths[1])
  expect(router.state.location.pathname).toBe('/settings/datasource')
})

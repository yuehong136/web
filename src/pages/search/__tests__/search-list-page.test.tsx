import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { useCollectionViewStore } from '@/stores/collection-view'
import type { SearchAppListItem } from '@/types/search'
import { SearchListPage } from '../SearchListPage'

const mock = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }))
vi.mock('@/hooks/use-search-request', () => ({
  useFetchSearchAppList: (params: unknown) => mock.list(params),
  useDeleteSearch: () => ({ deleteSearch: mock.remove }),
}))
vi.mock('../components/CreateSearchDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <p>create-search</p> : null,
}))

const apps: SearchAppListItem[] = [
  {
    id: 'a',
    name: 'Handbook search',
    description: 'Policies',
    kb_ids: ['kb-1', 'kb-2'],
    summary: true,
    related_search: false,
    create_time: 1000,
    update_time: 2000,
  },
  {
    id: 'b',
    name: 'Unlinked search',
    kb_ids: [],
    summary: false,
    related_search: true,
    create_time: 1000,
    update_time: 1000,
  },
]
let root: Root
let container: HTMLDivElement
const list = (searchApps: SearchAppListItem[], total: number) =>
  mock.list.mockReturnValue({
    searchApps,
    total,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
const button = (text: string, scope: ParentNode = container) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent === text,
  )

async function render() {
  const router = createMemoryRouter(
    [
      { path: '/search', element: <SearchListPage /> },
      { path: '/search/:id', element: <h1>Search detail</h1> },
    ],
    { initialEntries: ['/search'] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  return router
}

beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  useCollectionViewStore.getState().reset()
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('lists search apps as rows with knowledge status, page-scoped feature counts and the shared pager', async () => {
  list(apps, 30)
  const router = await render()
  const rows = container.querySelectorAll('[data-slot="resource-row"]')
  expect(rows).toHaveLength(2)
  expect(rows[0].textContent).toContain('2 knowledge bases')
  expect(rows[1].textContent).toContain('No knowledge base')
  expect(
    container.querySelector('[data-slot="page-title-bar"]')?.textContent,
  ).toContain('Search apps: 30')
  expect(container.textContent).toContain(
    'This page: AI summary on 1 · related questions on 1',
  )
  expect(container.textContent).toContain('1–12 / 30')
  expect(container.querySelector('[data-slot="inline-stats"]')).toBeNull()
  expect(mock.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1, page_size: 12 }),
  )
  await act(async () => button('Handbook search')!.click())
  expect(router.state.location.pathname).toBe('/search/a')
})

it('opens a small collection as search-badged cards and remembers a switch to rows', async () => {
  list(apps, 2)
  await render()
  const cards = container.querySelectorAll('[data-slot="resource-card"]')
  expect(cards).toHaveLength(2)
  expect(cards[0].textContent).toContain('2 knowledge bases')
  expect(cards[1].textContent).toContain('No knowledge base')
  expect(
    cards[0].querySelector('[data-slot="entity-avatar-badge-anchor"]'),
  ).not.toBeNull()
  expect(
    container.querySelector('[data-slot="resource-create-card"]'),
  ).not.toBeNull()
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('button[aria-label="List view"]')!
      .click(),
  )
  expect(container.querySelectorAll('[data-slot="resource-row"]')).toHaveLength(
    2,
  )
  expect(useCollectionViewStore.getState().chosen.search).toBe('list')
})

it('keeps the create action in the empty state only', async () => {
  list([], 0)
  await render()
  const header = container.querySelector('[data-slot="page-title-bar"]')!
  expect(button('Create search app', header)).toBeUndefined()
  expect(container.textContent).toContain('Search your documents in one place')
  const create = [
    ...container.querySelectorAll<HTMLButtonElement>(
      '[data-slot="empty-start"] button',
    ),
  ].find((element) => element.textContent?.startsWith('Create search app'))!
  await act(async () => create.click())
  expect(document.body.textContent).toContain('create-search')
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { useMemoryStore } from '@/stores/memory'
import type { Memory } from '@/types/memory'
import { MemoryListPage } from '../MemoryListPage'

const mock = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/hooks/use-memory', () => ({
  useMemoryList: (params: unknown) => mock.list(params),
  useCreateMemory: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateMemory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteMemory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDebouncedSearch: (value: string) => value,
}))
vi.mock('@/components/memory', () => ({
  CreateMemoryDialog: ({ open }: { open: boolean }) =>
    open ? <p>create-memory</p> : null,
}))

const memories = [
  {
    id: 'm1',
    name: 'Support memory',
    description: 'Customer facts',
    memory_type: ['raw', 'semantic'],
    storage_type: 'table',
    permissions: 'team',
    create_time: 1_700_000_000_000,
  },
] as unknown as Memory[]
let root: Root
let container: HTMLDivElement
const list = (memoryList: Memory[], total: number) =>
  mock.list.mockReturnValue({
    data: { memory_list: memoryList, total_count: total },
    isPending: false,
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
      { path: '/memory', element: <MemoryListPage /> },
      { path: '/memory/:id', element: <h1>Memory detail</h1> },
    ],
    { initialEntries: ['/memory'] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  return router
}

beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  useMemoryStore.getState().resetFilter()
  useMemoryStore.setState({ viewMode: 'list', page: 1, pageSize: 12 })
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('lists memory banks as rows with the server total and opens a bank', async () => {
  list(memories, 25)
  const router = await render()
  const row = container.querySelector('[data-slot="resource-row"]')!
  expect(row.textContent).toContain('Support memory')
  expect(row.textContent).toContain('Team')
  expect(
    container.querySelector('[data-slot="page-title-bar"]')?.textContent,
  ).toContain('Memory banks: 25')
  expect(container.textContent).toContain('1–12 / 25')
  await act(async () => button('Support memory')!.click())
  expect(router.state.location.pathname).toBe('/memory/m1')
})

it('shows memory types as neutral badges on cards', async () => {
  list(memories, 1)
  useMemoryStore.setState({ viewMode: 'grid' })
  await render()
  const card = container.querySelector('[data-slot="resource-card"]')!
  const badges = card.querySelectorAll('[data-slot="badge"]')
  expect([...badges].map((badge) => badge.textContent)).toEqual([
    'Raw',
    'Semantic',
  ])
  expect(badges[0].className).toContain('bg-background-subtle')
})

it('moves the create action into the empty state', async () => {
  list([], 0)
  await render()
  const header = container.querySelector('[data-slot="page-title-bar"]')!
  expect(button('Create memory bank', header)).toBeUndefined()
  expect(container.textContent).toContain('No memory banks yet')
  await act(async () => button('Create memory bank')!.click())
  expect(document.body.textContent).toContain('create-memory')
})

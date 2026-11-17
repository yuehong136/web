import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import DataSourcePage from '..'
import { DataSourceKey, DataSourceStatus, type IDataSource } from '../types'

const showAddingModal = vi.fn()
const listState: { list: IDataSource[]; isFetching: boolean } = {
  list: [],
  isFetching: false,
}

vi.mock('@/hooks/use-datasource-request', () => ({
  useListDataSource: () => listState,
  useDeleteDataSource: () => ({
    handleDeleteAsync: vi.fn(),
    deleteLoading: false,
  }),
  useAddDataSource: () => ({
    addSource: undefined,
    addLoading: false,
    addingModalVisible: false,
    handleAddOk: vi.fn(),
    hideAddingModal: vi.fn(),
    showAddingModal,
  }),
}))

const source = (
  id: string,
  type: DataSourceKey,
  status: DataSourceStatus,
): IDataSource =>
  ({ id, name: `Source ${id}`, source: type, status }) as IDataSource

let root: Root
let container: HTMLDivElement
let pathname = ''

function Location() {
  const location = useLocation()
  useLayoutEffect(() => {
    pathname = location.pathname
  }, [location.pathname])
  return null
}

const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/settings/datasource']}>
        <Routes>
          <Route path="/settings/datasource" element={<DataSourcePage />} />
          <Route path="/settings/datasource-detail" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    ),
  )

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await changeLanguage('en-US')
  showAddingModal.mockReset()
  listState.list = []
  listState.isFetching = false
  pathname = ''
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('shows connected sources as cards with logo tiles and status dots', async () => {
  listState.list = [
    source('a', DataSourceKey.S3, DataSourceStatus.FAILED),
    source('b', DataSourceKey.GITHUB, DataSourceStatus.COMPLETED),
  ]
  await render()

  const grid = container.querySelector('[aria-label="Added Data Sources"]')!
  const cards = grid.querySelectorAll('[data-slot="resource-card"]')
  expect(cards).toHaveLength(2)
  expect(cards[0].querySelector('[data-slot="connector-logo"]')).not.toBeNull()
  expect(cards[0].textContent).toContain('Source a')
  expect(cards[0].textContent).toContain('S3')
  const failed = cards[0].querySelector('[data-slot="status-dot"]')!
  expect(failed.getAttribute('data-tone')).toBe('error')
  expect(failed.textContent).toBe('Failed')
  expect(
    cards[1]
      .querySelector('[data-slot="status-dot"]')
      ?.getAttribute('data-tone'),
  ).toBe('success')
  expect(
    cards[0]
      .querySelector('a[aria-label="Settings for Source a"]')
      ?.getAttribute('href'),
  ).toBe('/settings/datasource-detail?id=a')
  expect(
    cards[0].querySelector('button[aria-label="Delete Source a"]'),
  ).not.toBeNull()
  expect(container.querySelector('[data-slot="empty-start"]')).toBeNull()

  await act(async () =>
    cards[1]
      .querySelector<HTMLButtonElement>('[data-slot="resource-name"]')!
      .click(),
  )
  expect(pathname).toBe('/settings/datasource-detail')
})

it('offers start paths on first use and opens the add dialog for them', async () => {
  await render()

  const empty = container.querySelector('[data-slot="empty-start"]')!
  expect(empty.textContent).toContain('Connect your first data source')
  const paths = empty.querySelectorAll('ul button')
  expect(paths).toHaveLength(3)
  await act(async () => (paths[0] as HTMLButtonElement).click())
  expect(showAddingModal).toHaveBeenCalledWith(
    expect.objectContaining({ id: DataSourceKey.S3, name: 'S3' }),
  )
})

it('lists every connector type once, grouped, each opening its add dialog', async () => {
  await render()

  const groups = container.querySelectorAll('[data-connector-group]')
  expect(
    [...groups].map((group) => group.getAttribute('data-connector-group')),
  ).toEqual([
    'storage',
    'collaboration',
    'codeRepository',
    'database',
    'communication',
  ])
  const tiles = container.querySelectorAll<HTMLButtonElement>(
    '[data-connector-group] button',
  )
  expect(tiles).toHaveLength(Object.values(DataSourceKey).length)
  const notion = [...tiles].find(
    (tile) => tile.getAttribute('aria-label') === 'Add Notion',
  )!
  await act(async () => notion.click())
  expect(showAddingModal).toHaveBeenCalledWith(
    expect.objectContaining({ id: DataSourceKey.NOTION }),
  )
})

it('shows a loading state instead of the first-use page while listing', async () => {
  listState.isFetching = true
  await render()
  expect(container.querySelector('[data-slot="empty-start"]')).toBeNull()
  expect(container.querySelector('[data-connector-group]')).not.toBeNull()
})

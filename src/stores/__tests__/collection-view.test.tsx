import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import {
  GRID_DEFAULT_MAX_ITEMS,
  normalizeChosenViews,
  resolveCollectionView,
  useCollectionView,
  useCollectionViewStore,
} from '@/stores/collection-view'

let root: Root
let container: HTMLDivElement

function Probe({ size, filtered }: { size?: number; filtered?: boolean }) {
  const [view, setView] = useCollectionView('memory', size, filtered)
  return (
    <button type="button" data-view={view} onClick={() => setView('grid')}>
      {view}
    </button>
  )
}
const view = () => container.querySelector('button')!.dataset.view
const render = (size?: number, filtered?: boolean) =>
  act(async () => root.render(<Probe size={size} filtered={filtered} />))

beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.removeItem('collection-view')
  useCollectionViewStore.getState().reset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('opens small collections as cards and larger or unknown ones as rows', () => {
  expect(resolveCollectionView(undefined, 0)).toBe('grid')
  expect(resolveCollectionView(undefined, GRID_DEFAULT_MAX_ITEMS)).toBe('grid')
  expect(resolveCollectionView(undefined, GRID_DEFAULT_MAX_ITEMS + 1)).toBe(
    'list',
  )
  expect(resolveCollectionView(undefined, undefined)).toBe('list')
})

it('lets an explicit choice win over the size default', () => {
  expect(resolveCollectionView('list', 3)).toBe('list')
  expect(resolveCollectionView('grid', 300)).toBe('grid')
})

it('keeps only known collections and valid views from storage', () => {
  expect(
    normalizeChosenViews({
      studio: 'grid',
      memory: 'table',
      unknown: 'list',
      'team-joined': 'list',
    }),
  ).toEqual({ studio: 'grid', 'team-joined': 'list' })
  expect(normalizeChosenViews(null)).toEqual({})
  expect(normalizeChosenViews('grid')).toEqual({})
})

it('keeps the unfiltered size while a search narrows the collection', async () => {
  await render(30)
  expect(view()).toBe('list')
  await render(2, true)
  expect(view()).toBe('list')
  await render(8, false)
  expect(view()).toBe('grid')
})

it('persists the explicit choice per collection', async () => {
  await render(30)
  await act(async () => container.querySelector('button')!.click())
  expect(view()).toBe('grid')
  const stored = JSON.parse(localStorage.getItem('collection-view')!).state
  expect(stored).toEqual({ chosen: { memory: 'grid' } })
  expect(useCollectionViewStore.getState().chosen.studio).toBeUndefined()
})

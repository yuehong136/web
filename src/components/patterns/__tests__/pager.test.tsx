import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { getPagerRange, LoadMore, Pager } from '../pager'
import {
  byLabel,
  click,
  menuItem,
  mount,
  openMenu,
} from './collection-test-utils'

describe('getPagerRange', () => {
  it('reports an empty collection as 0–0 on one page', () => {
    expect(getPagerRange(1, 12, 0)).toEqual({ start: 0, end: 0, pages: 1 })
  })
  it('cuts the last page short and counts partial pages', () => {
    expect(getPagerRange(1, 12, 40)).toEqual({ start: 1, end: 12, pages: 4 })
    expect(getPagerRange(4, 12, 40)).toEqual({ start: 37, end: 40, pages: 4 })
  })
  it('clamps a stale page beyond the total and pages below one', () => {
    expect(getPagerRange(9, 12, 40)).toEqual({ start: 40, end: 40, pages: 4 })
    expect(getPagerRange(0, 12, 40)).toEqual({ start: 1, end: 12, pages: 4 })
  })
})

let view: ReturnType<typeof mount>
beforeEach(async () => {
  await changeLanguage('en-US')
  view = mount()
})
afterEach(() => view.unmount())

it('disables previous on the first page and next on the last page', async () => {
  const onPageChange = vi.fn()
  await view.render(
    <Pager page={1} pageSize={12} total={40} onPageChange={onPageChange} />,
  )
  const nav = view.container.querySelector('nav[aria-label="Pagination"]')!
  expect(nav.textContent).toContain('1–12 / 40')
  expect((byLabel(nav, 'Previous') as HTMLButtonElement).disabled).toBe(true)
  await click(byLabel(nav, 'Next')!)
  expect(onPageChange).toHaveBeenCalledWith(2)

  await view.render(
    <Pager page={4} pageSize={12} total={40} onPageChange={onPageChange} />,
  )
  expect(view.container.textContent).toContain('37–40 / 40')
  expect((byLabel(view.container, 'Next') as HTMLButtonElement).disabled).toBe(
    true,
  )
  await click(byLabel(view.container, 'Previous')!)
  expect(onPageChange).toHaveBeenLastCalledWith(3)
})

it('keeps both directions disabled for a single page and announces the range', async () => {
  await view.render(
    <Pager page={1} pageSize={12} total={5} onPageChange={vi.fn()} />,
  )
  const range = view.container.querySelector('[aria-live="polite"]')!
  expect(range.textContent).toBe('1–5 / 5')
  for (const label of ['Previous', 'Next'])
    expect((byLabel(view.container, label) as HTMLButtonElement).disabled).toBe(
      true,
    )
})

it('offers a page-size menu only when the caller can change it', async () => {
  const onPageSizeChange = vi.fn()
  await view.render(
    <Pager page={2} pageSize={12} total={40} onPageChange={vi.fn()} />,
  )
  expect(view.container.textContent).not.toContain('/ page')
  await view.render(
    <Pager
      page={2}
      pageSize={12}
      total={40}
      onPageChange={vi.fn()}
      pageSizeOptions={[12, 24]}
      onPageSizeChange={onPageSizeChange}
    />,
  )
  const trigger = [...view.container.querySelectorAll('button')].find(
    (button) => button.textContent === '12 / page',
  )!
  await openMenu(trigger)
  expect(menuItem('12 / page')?.getAttribute('aria-checked')).toBe('true')
  await click(menuItem('24 / page')!)
  expect(onPageSizeChange).toHaveBeenCalledWith(24)
})

it('loads more until everything is loaded', async () => {
  const onLoadMore = vi.fn()
  await view.render(<LoadMore loaded={24} total={60} onLoadMore={onLoadMore} />)
  expect(view.container.textContent).toContain('24 of 60 loaded')
  await click(
    [...view.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Load more',
    )!,
  )
  expect(onLoadMore).toHaveBeenCalledOnce()
  await view.render(<LoadMore loaded={60} total={60} onLoadMore={onLoadMore} />)
  expect(view.container.textContent).toContain('All 60 loaded')
  expect(view.container.querySelector('button')).toBeNull()
})

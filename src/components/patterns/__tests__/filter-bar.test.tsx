import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { FilterBar, type FilterBarProps } from '../filter-bar'
import {
  byLabel,
  click,
  menuItem,
  mount,
  openMenu,
} from './collection-test-utils'

let view: ReturnType<typeof mount>
beforeEach(async () => {
  await changeLanguage('en-US')
  view = mount()
})
afterEach(() => view.unmount())

const statusFilter = (value: string[] = []) => ({
  key: 'status',
  label: 'Status',
  value,
  options: [
    { value: 'ready', label: 'Ready' },
    { value: 'failed', label: 'Failed' },
  ],
})

async function setup(props: Partial<FilterBarProps> = {}) {
  const callbacks = {
    search: vi.fn(),
    filter: vi.fn(),
    clear: vi.fn(),
    sort: vi.fn(),
    display: vi.fn(),
    view: vi.fn(),
  }
  await view.render(
    <FilterBar
      search={{
        value: '',
        onChange: callbacks.search,
        placeholder: 'Search apps',
      }}
      filters={[statusFilter()]}
      onFilterChange={callbacks.filter}
      onClearFilters={callbacks.clear}
      sort={{
        value: 'new',
        onChange: callbacks.sort,
        options: [
          { value: 'new', label: 'Newest first' },
          { value: 'old', label: 'Oldest first' },
        ],
      }}
      display={[
        {
          key: 'time',
          label: 'Time display',
          value: 'exact',
          onChange: callbacks.display,
          options: [
            { value: 'exact', label: 'Exact time' },
            { value: 'relative', label: 'Relative time' },
          ],
        },
      ]}
      view={{ value: 'list', onChange: callbacks.view }}
      {...props}
    />,
  )
  return callbacks
}

it('reports search text and keeps a multi-select chip open while toggling', async () => {
  const callbacks = await setup()
  const input = view.container.querySelector<HTMLInputElement>(
    'input[aria-label="Search apps"]',
  )!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, 'alpha')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(callbacks.search).toHaveBeenCalledWith('alpha')

  const chip = view.container.querySelector<HTMLElement>(
    '[data-filter-key="status"]',
  )!
  expect(chip.textContent).toBe('Status')
  await openMenu(chip)
  expect(menuItem('Ready')?.getAttribute('aria-checked')).toBe('false')
  await click(menuItem('Ready')!)
  expect(callbacks.filter).toHaveBeenLastCalledWith('status', ['ready'])
  // Multi-select menus stay open for the next toggle.
  expect(menuItem('Failed')).toBeTruthy()
  // No "clear" entry or button until the filter is set.
  expect(menuItem('Clear')).toBeUndefined()
  expect(view.container.textContent).not.toContain('Clear filters')
})

it('summarises set chips, removes single values and clears every filter', async () => {
  const callbacks = await setup({
    filters: [statusFilter(['ready', 'failed'])],
  })
  const chip = view.container.querySelector<HTMLElement>(
    '[data-filter-key="status"]',
  )!
  expect(chip.textContent).toBe('StatusReady +1')
  expect(chip.hasAttribute('data-filter-set')).toBe(true)
  await openMenu(chip)
  await click(menuItem('Failed')!)
  expect(callbacks.filter).toHaveBeenLastCalledWith('status', ['ready'])
  await click(menuItem('Clear')!)
  expect(callbacks.filter).toHaveBeenLastCalledWith('status', [])
  await click(
    [...view.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Clear filters',
    )!,
  )
  expect(callbacks.clear).toHaveBeenCalledOnce()
})

it('replaces the value of a single-choice chip', async () => {
  const callbacks = await setup({
    filters: [{ ...statusFilter(['ready']), selection: 'single' }],
  })
  await openMenu(
    view.container.querySelector<HTMLElement>('[data-filter-key="status"]')!,
  )
  expect(menuItem('Ready')?.getAttribute('role')).toBe('menuitemradio')
  await click(menuItem('Failed')!)
  expect(callbacks.filter).toHaveBeenLastCalledWith('status', ['failed'])
})

it('groups sort and display choices in one menu named after the current sort', async () => {
  const callbacks = await setup()
  const trigger = view.container.querySelector<HTMLElement>(
    '[data-slot="filter-bar-sort"]',
  )!
  expect(trigger.getAttribute('aria-label')).toBe('Sort: Newest first')
  await openMenu(trigger)
  expect(menuItem('Newest first')?.getAttribute('aria-checked')).toBe('true')
  await click(menuItem('Oldest first')!)
  expect(callbacks.sort).toHaveBeenCalledWith('old')
  await openMenu(trigger)
  await click(menuItem('Relative time')!)
  expect(callbacks.display).toHaveBeenCalledWith('relative')
})

it('switches views with pressed-state buttons inside a labelled group', async () => {
  const callbacks = await setup()
  const group = view.container.querySelector('fieldset')!
  expect(group.getAttribute('aria-label')).toBe('View')
  expect(byLabel(group, 'List view')?.getAttribute('aria-pressed')).toBe('true')
  const grid = byLabel(group, 'Grid view')!
  expect(grid.getAttribute('aria-pressed')).toBe('false')
  expect(grid.tagName).toBe('BUTTON')
  await click(grid)
  expect(callbacks.view).toHaveBeenCalledWith('grid')
})

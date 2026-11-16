import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { BulkActionBar } from '../bulk-action-bar'
import { InlineStats } from '../inline-stats'
import { ResourceCard, ResourceGrid } from '../resource-card'
import { ResourceList, ResourceListHeader, ResourceRow } from '../resource-row'
import { byLabel, click, mount } from './collection-test-utils'

let view: ReturnType<typeof mount>
beforeEach(async () => {
  await changeLanguage('en-US')
  view = mount()
})
afterEach(() => view.unmount())

it('renders a row with avatar, name action, status, meta and actions', async () => {
  const onOpen = vi.fn()
  const onCheckedChange = vi.fn()
  await view.render(
    <ResourceList
      label="Apps"
      header={
        <ResourceListHeader
          name="Name"
          status="Status"
          meta="Updated"
          selection={{
            checked: false,
            indeterminate: true,
            onCheckedChange: vi.fn(),
            label: 'Select apps on this page',
          }}
        />
      }
    >
      <ResourceRow
        name="Alpha"
        description="First app"
        avatar={{ seed: 'one' }}
        status={<span>Published</span>}
        meta={<time>Today</time>}
        actions={<button type="button">More</button>}
        onOpen={onOpen}
        selection={{ checked: false, onCheckedChange }}
        current
      />
    </ResourceList>,
  )
  const list = view.container.querySelector('ul[aria-label="Apps"]')!
  const row = list.querySelector('li')!
  expect(row.getAttribute('aria-current')).toBe('true')
  expect(row.querySelector('[data-slot="entity-avatar"]')?.textContent).toBe(
    'A',
  )
  expect(row.textContent).toContain('First app')
  expect(row.textContent).toContain('Published')
  expect(
    byLabel(view.container, 'Select apps on this page')?.getAttribute(
      'aria-checked',
    ),
  ).toBe('mixed')

  await click(row.querySelector('button[data-slot="resource-name"]')!)
  expect(onOpen).toHaveBeenCalledOnce()
  await click(byLabel(row, 'Select Alpha')!)
  expect(onCheckedChange).toHaveBeenCalledWith(true)
})

it('keeps the name as text without a primary action and marks selection', async () => {
  await view.render(
    <ResourceList label="Apps">
      <ResourceRow
        name="Beta"
        selection={{
          checked: true,
          onCheckedChange: vi.fn(),
          label: 'Choose Beta',
        }}
      />
    </ResourceList>,
  )
  const row = view.container.querySelector('li')!
  expect(row.querySelector('button[data-slot="resource-name"]')).toBeNull()
  expect(row.querySelector('[data-slot="resource-name"]')?.textContent).toBe(
    'Beta',
  )
  expect(row.hasAttribute('data-selected')).toBe(true)
  expect(byLabel(row, 'Choose Beta')?.getAttribute('aria-checked')).toBe('true')
})

it('renders the same slots as a card in a labelled grid', async () => {
  const onOpen = vi.fn()
  await view.render(
    <ResourceGrid label="Apps">
      <ResourceCard
        name="Gamma"
        eyebrow="App"
        description="Third app"
        avatar={{ seed: 'three' }}
        meta={<span>2 knowledge bases</span>}
        actions={<button type="button">More</button>}
        onOpen={onOpen}
      />
    </ResourceGrid>,
  )
  const card = view.container.querySelector('ul[aria-label="Apps"] li article')!
  expect(card.querySelector('h3')?.textContent).toBe('Gamma')
  expect(card.textContent).toContain('App')
  expect(card.textContent).toContain('2 knowledge bases')
  await click(card.querySelector('h3 button')!)
  expect(onOpen).toHaveBeenCalledOnce()
})

it('shows the bulk toolbar only with a selection and clears it', async () => {
  const onClear = vi.fn()
  await view.render(
    <BulkActionBar count={0} onClear={onClear}>
      <button type="button">Delete</button>
    </BulkActionBar>,
  )
  expect(view.container.querySelector('[role="toolbar"]')).toBeNull()
  await view.render(
    <BulkActionBar count={2} onClear={onClear}>
      <button type="button">Delete</button>
    </BulkActionBar>,
  )
  const toolbar = view.container.querySelector(
    '[role="toolbar"][aria-label="Bulk actions"]',
  )!
  expect(toolbar.textContent).toContain('2 selected')
  await click(byLabel(toolbar, 'Clear selection')!)
  expect(onClear).toHaveBeenCalledOnce()
})

it('lists inline stats as terms and values, with tone dots kept decorative', async () => {
  await view.render(
    <InlineStats
      items={[
        { label: 'Published', value: 4, tone: 'success' },
        { label: 'Drafts', value: 2 },
      ]}
    />,
  )
  const terms = [...view.container.querySelectorAll('dt')].map(
    (term) => term.textContent,
  )
  expect(terms).toEqual(['Published', 'Drafts'])
  expect(
    [...view.container.querySelectorAll('dd')].map(
      (value) => value.textContent,
    ),
  ).toEqual(['4', '2'])
  expect(view.container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
    1,
  )
  await view.render(<InlineStats items={[]} />)
  expect(view.container.querySelector('dl')).toBeNull()
})

import { afterEach, beforeEach, expect, it } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { mount } from '@/components/patterns/__tests__/collection-test-utils'
import { RouteTabs } from '@/components/patterns/route-tabs'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { CollectionTemplate } from '../collection-template'
import { DetailTemplate } from '../detail-template'
import { ListPageTemplate } from '../list-page-template'
import { SettingsTemplate } from '../settings-template'

let view: ReturnType<typeof mount>
beforeEach(async () => {
  await changeLanguage('en-US')
  view = mount()
})
afterEach(() => view.unmount())

const rows = <ul aria-label="Apps">{<li>Alpha</li>}</ul>

it('renders the title bar, filter strip, rows and footer for content', async () => {
  await view.render(
    <CollectionTemplate
      title="Studio"
      count={20}
      countLabel="Apps: 20"
      actions={<button type="button">New project</button>}
      filterBar={<div>filters</div>}
      footerNote="Applies to this page."
      footer={<nav aria-label="Pagination">1–12 / 20</nav>}
      bulkActions={<div role="toolbar">1 selected</div>}
    >
      {rows}
    </CollectionTemplate>,
  )
  const header = view.container.querySelector('header')!
  expect(header.querySelector('h1')?.textContent).toBe('Studio')
  expect(header.querySelector('.sr-only')?.textContent).toBe('Apps: 20')
  expect(header.textContent).toContain('New project')
  expect(view.container.textContent).toContain('filters')
  const body = view.container.querySelector(
    '[data-scroll-root="collection-body"]',
  )!
  expect(body.textContent).toBe('Alpha')
  // The floating bulk bar reserves room under the last row.
  expect(body.className).toContain('pb-')
  const footer = view.container.querySelector(
    '[data-slot="collection-footer"]',
  )!
  expect(footer.textContent).toBe('Applies to this page.1–12 / 20')
})

it('swaps the body for page states and hides the footer outside content', async () => {
  const props = {
    title: 'Studio',
    footer: <nav aria-label="Pagination">pager</nav>,
    emptyState: <p>No apps yet</p>,
    errorState: <p>Could not load apps</p>,
  }
  await view.render(
    <CollectionTemplate {...props} state="loading">
      {rows}
    </CollectionTemplate>,
  )
  expect(view.container.textContent).toContain('Loading...')
  expect(view.container.textContent).not.toContain('Alpha')
  expect(view.container.textContent).not.toContain('pager')

  await view.render(
    <CollectionTemplate {...props} state="empty">
      {rows}
    </CollectionTemplate>,
  )
  expect(view.container.textContent).toContain('No apps yet')
  await view.render(
    <CollectionTemplate {...props} state="error">
      {rows}
    </CollectionTemplate>,
  )
  expect(view.container.textContent).toContain('Could not load apps')
  expect(view.container.querySelector('[data-scroll-root]')).toBeNull()
})

it('keeps ListPageTemplate consumers on the padded layout and legacy state rules', async () => {
  await view.render(
    <ListPageTemplate
      title="Knowledge"
      description="All knowledge bases"
      headerActions={<button type="button">Create</button>}
      stats={<p>stats</p>}
      toolbarLeft={<input aria-label="Search" />}
      toolbarRight={<button type="button">Grid</button>}
      pagination={<nav aria-label="Pagination">pager</nav>}
      className="custom"
    >
      {rows}
    </ListPageTemplate>,
  )
  const root = view.container.firstElementChild!
  expect(root.className).toContain('p-space-lg')
  expect(root.className).toContain('custom')
  expect(root.querySelector('h1')?.textContent).toBe('Knowledge')
  expect(root.textContent).toContain('All knowledge bases')
  expect(
    root.querySelector('[data-scroll-root="list-body"]')?.textContent,
  ).toBe('Alpha')
  expect(root.lastElementChild?.textContent).toBe('pager')
  expect(root.textContent).toContain('stats')

  // Without an empty node the legacy template still renders its children.
  await view.render(
    <ListPageTemplate title="Knowledge" state="empty">
      {rows}
    </ListPageTemplate>,
  )
  expect(view.container.textContent).toContain('Alpha')
})

it('builds a detail page from crumbs, route tabs and a scrolling body', async () => {
  await view.render(
    <DetailTemplate
      title="Documents"
      crumbs={[{ label: 'Knowledge', to: '/knowledge' }, { label: 'FAQ' }]}
      count={4}
      tabs={
        <RouteTabs
          label="Knowledge base sections"
          tabs={[
            { to: '/', label: 'Documents', count: 4, end: true },
            { to: '/settings', label: 'Settings' },
          ]}
        />
      }
    >
      <p>table</p>
    </DetailTemplate>,
  )
  const crumbs = view.container.querySelector('nav[aria-label="Breadcrumb"]')!
  expect(crumbs.querySelector('a')?.getAttribute('href')).toBe('/knowledge')
  expect(crumbs.textContent).toBe('Knowledge/FAQ/')
  expect(view.container.querySelector('h1')?.textContent).toBe('Documents')
  const tabs = view.container.querySelector(
    'nav[aria-label="Knowledge base sections"]',
  )!
  expect(tabs.querySelector('[aria-current="page"]')?.textContent).toBe(
    'Documents4',
  )
  expect(
    view.container.querySelector('[data-scroll-root="detail-body"]')
      ?.textContent,
  ).toBe('table')
})

it('lays settings out as a titled column of labelled rows', async () => {
  await view.render(
    <SettingsTemplate
      title="Default models"
      description="New chats use these models."
    >
      <SettingSection title="Providers">
        <SettingRow
          label="Chat"
          description="Not set"
          tone="warning"
          htmlFor="chat-model"
        >
          <button id="chat-model" type="button">
            gpt-6.1
          </button>
        </SettingRow>
      </SettingSection>
    </SettingsTemplate>,
  )
  expect(view.container.querySelector('h2')?.textContent).toBe('Default models')
  const section = view.container.querySelector('section')!
  expect(section.getAttribute('aria-labelledby')).toBe(
    section.querySelector('h3')?.id,
  )
  const label = view.container.querySelector('label[for="chat-model"]')!
  expect(label.textContent).toBe('Chat')
  expect(
    view.container.querySelector('p.text-status-warning')?.textContent,
  ).toBe('Not set')
})

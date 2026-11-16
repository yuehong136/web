import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppShell } from '../app-shell'
import { useRegisterSecondaryNavigation } from '../workbench-navigation'
import {
  CollectionTemplate,
  DetailTemplate,
  SettingsTemplate,
} from '@/components/page-templates'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useUIStore } from '@/stores'
import { changeLanguage } from '@/locales/i18n'

vi.mock('../sidebar-utilities', () => ({
  SidebarUtilities: () => <button>Account</button>,
}))
vi.mock('../SidebarConversations', () => ({ SidebarConversations: () => null }))

let width = 1280
let container: HTMLDivElement
let root: Root

const Knowledge = () => (
  <CollectionTemplate
    title="Knowledge bases"
    count={6}
    countLabel="Knowledge bases: 6"
    stats={<span>2 parsing</span>}
    actions={<button type="button">New knowledge base</button>}
    filterBar={<div>filters</div>}
  >
    <ul aria-label="Rows">
      <li>Alpha</li>
    </ul>
  </CollectionTemplate>
)

const Documents = () => (
  <DetailTemplate
    title="Documents"
    crumbs={[{ label: 'Handbook', to: '/knowledge' }]}
    actions={<button type="button">Add documents</button>}
  >
    <CollectionTemplate title="Chunks" actions={<button>Filter</button>}>
      <p>Chunk rows</p>
    </CollectionTemplate>
  </DetailTemplate>
)

const RouteHeader = () => {
  const definition = React.useMemo(
    () => ({
      section: 'settings' as const,
      title: 'Settings',
      groups: [],
      header: <h1>Models</h1>,
    }),
    [],
  )
  useRegisterSecondaryNavigation(definition)
  return (
    <SettingsTemplate
      title="Default models"
      description="Used by new chats."
      actions={<button type="button">Save</button>}
    >
      <p>Rows</p>
    </SettingsTemplate>
  )
}

const DialogTemplate = () => (
  <Dialog open onOpenChange={() => {}}>
    <DialogContent>
      <CollectionTemplate title="Picker">
        <p>Choices</p>
      </CollectionTemplate>
    </DialogContent>
  </Dialog>
)

async function render(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AppShell>
            <Outlet />
          </AppShell>
        ),
        children: [
          { path: 'knowledge', element: <Knowledge /> },
          { path: 'knowledge/docs', element: <Documents /> },
          { path: 'agents', element: <p>Agents page</p> },
          { path: 'settings/models', element: <RouteHeader /> },
          { path: 'tools', element: <DialogTemplate /> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  return router
}

const header = () =>
  container.querySelector<HTMLElement>('[data-main-task-area]')!
    .previousElementSibling as HTMLElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  width = 1280
  vi.stubGlobal('matchMedia', (query: string) =>
    Object.assign(new EventTarget(), {
      matches:
        query === '(min-width: 48rem)'
          ? width >= 768
          : query === '(min-width: 64rem)'
            ? width >= 1024
            : false,
    }),
  )
  useUIStore.setState({ sidebarCollapsed: false })
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('moves a collection title, count, stats and actions into the card header', async () => {
  await render('/knowledge')
  const bar = header()
  expect(bar.tagName).toBe('HEADER')
  expect(bar.querySelector('h1')?.textContent).toBe('Knowledge bases')
  expect(bar.querySelector('.sr-only')?.textContent).toBe('Knowledge bases: 6')
  expect(bar.textContent).toContain('2 parsing')
  expect(bar.textContent).toContain('New knowledge base')
  // The section label gives way, and the template keeps no second title row.
  expect(bar.querySelectorAll('p')).toHaveLength(0)
  const template = container.querySelector('[data-slot="collection-template"]')!
  expect(template.querySelector('header, h1')).toBeNull()
  expect(template.textContent).toContain('filters')
  expect(container.querySelectorAll('h1')).toHaveLength(1)
})

it('falls back to the section label when no template registers, and restores it on unmount', async () => {
  const router = await render('/agents')
  expect(header().querySelector('h1')).toBeNull()
  expect(header().querySelector('p')?.textContent).toBe('Agents')
  await act(async () => router.navigate('/knowledge'))
  expect(header().querySelector('p')).toBeNull()
  await act(async () => router.navigate('/agents'))
  expect(header().querySelector('p')?.textContent).toBe('Agents')
  expect(
    header().querySelector('[data-workbench-title]')?.childElementCount,
  ).toBe(0)
})

it('lets only the outermost template own the header; nested titles stay inline', async () => {
  await render('/knowledge/docs')
  const bar = header()
  expect(bar.querySelector('h1')?.textContent).toBe('Documents')
  expect(bar.querySelector('nav a[href="/knowledge"]')?.textContent).toBe(
    'Handbook',
  )
  expect(bar.textContent).toContain('Add documents')
  expect(bar.textContent).not.toContain('Chunks')
  const inner = container.querySelector('[data-slot="collection-template"]')!
  expect(inner.querySelector('header h1')?.textContent).toBe('Chunks')
})

it('keeps the route header for settings and moves only the template actions', async () => {
  await render('/settings/models')
  const bar = header()
  expect(bar.querySelector('h1')?.textContent).toBe('Models')
  expect(bar.querySelector('[data-workbench-actions]')?.textContent).toBe(
    'Save',
  )
  const column = container.querySelector('[data-slot="settings-template"]')!
  expect(column.querySelector('h2')?.textContent).toBe('Default models')
  expect(column.textContent).toContain('Used by new chats.')
  expect(column.textContent).not.toContain('Save')
})

it('renders a template inside a dialog with its own title row', async () => {
  await render('/tools')
  expect(header().querySelector('h1')).toBeNull()
  expect(
    document.querySelector('dialog [data-slot="page-title-bar"] h1')
      ?.textContent,
  ).toBe('Picker')
})

it('shows the menu button and the page title in the mobile header', async () => {
  width = 390
  await render('/knowledge')
  const bar = header()
  expect(
    bar.querySelector('button[aria-label="Open navigation"]'),
  ).not.toBeNull()
  expect(bar.querySelector('h1')?.textContent).toBe('Knowledge bases')
  expect(
    bar
      .querySelector('[data-slot="page-title-subline"]')
      ?.classList.contains('md:block'),
  ).toBe(true)
})

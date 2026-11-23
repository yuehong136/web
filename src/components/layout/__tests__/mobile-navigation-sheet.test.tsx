import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppShell } from '../app-shell'
import { ApplicationCommandProvider } from '@/lib/commands'
import {
  PlatformKind,
  PlatformProvider,
  type ApplicationComposition,
} from '@/platform'
import { useHomeStore } from '@/stores/home'
import { useUIStore } from '@/stores'
import { changeLanguage } from '@/locales/i18n'

vi.mock('../sidebar-utilities', () => ({
  SidebarUtilities: () => <button>Account</button>,
}))
vi.mock('../SidebarConversations', () => ({
  SidebarConversations: () => (
    <button type="button" data-nav-row>
      Thread
    </button>
  ),
}))

class TestResizeObserver implements ResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

const composition: ApplicationComposition = Object.freeze({
  platform: Object.freeze({
    kind: PlatformKind.WEB,
    capabilities: () =>
      Object.freeze({
        desktop: false,
        nativeMenu: false,
        updater: false,
        notifications: false,
        localAgent: false,
        pty: false,
        localMcp: false,
      }),
  }),
  commandSource: Object.freeze({ subscribe: () => () => {} }),
})

let container: HTMLDivElement
let root: Root

async function openSheet(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <ApplicationCommandProvider>
            <AppShell>
              <Outlet />
            </AppShell>
          </ApplicationCommandProvider>
        ),
        children: [
          { path: 'home', element: <p>Home task</p> },
          { path: 'memory', element: <p>Memory task</p> },
          { path: 'explore', element: <p>Explore task</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  await act(async () =>
    root.render(
      <PlatformProvider composition={composition}>
        <RouterProvider router={router} />
      </PlatformProvider>,
    ),
  )
  const trigger = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Open navigation"]',
  )!
  await act(async () => trigger.click())
  return {
    router,
    trigger,
    sheet: document.querySelector<HTMLElement>('[role="dialog"]')!,
  }
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  globalThis.ResizeObserver = TestResizeObserver
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: false }),
  )
  useHomeStore.getState().reset()
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

it('lays out brand, sections, actions, section content and account like the board', async () => {
  useHomeStore.setState({
    selectedApps: [{ id: 'app', name: 'Research' } as never],
  })
  const { sheet } = await openSheet('/home')
  expect(sheet.querySelector('[data-brand-mark]')?.textContent).toBe('Cairvo')
  const sections = Array.from(
    sheet.querySelectorAll<HTMLAnchorElement>(
      'nav[aria-label="Workspace navigation"] > ul a',
    ),
  )
  expect(sections.map((link) => link.textContent)).toEqual([
    'Home',
    'Explore',
    'Knowledge',
    'Agents',
  ])
  expect(sections[0].getAttribute('aria-current')).toBe('page')
  for (const link of sections) expect(link.className).toContain('min-h-11')
  const order = [
    sheet.querySelector('nav[aria-label="Workspace navigation"]'),
    sheet.querySelector('[data-workbench-quick-actions]'),
    sheet.querySelector('[data-nav-row]'),
    sheet.querySelector('footer'),
  ]
  for (let index = 1; index < order.length; index += 1)
    expect(
      order[index - 1]!.compareDocumentPosition(order[index]!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  // Rows from the section content are raised to touch size by the sheet.
  expect(sheet.querySelector('[data-navigation-scroll]')?.className).toContain(
    '[&_[data-nav-row]]:min-h-11',
  )
  const footer = sheet.querySelector('footer')!
  expect(footer.textContent).toContain('Account')
  expect(
    footer.querySelector('a[href="/settings"]')?.getAttribute('aria-label'),
  ).toBe('Settings')
})

it('opens More for a destination inside it and marks the current page', async () => {
  const { sheet } = await openSheet('/memory')
  const more = sheet.querySelector('details')!
  expect(more.open).toBe(true)
  expect(
    more.querySelector('a[aria-current="page"]')?.getAttribute('href'),
  ).toBe('/memory')
  expect(
    sheet.querySelectorAll(
      'nav[aria-label="Workspace navigation"] > ul a[aria-current]',
    ),
  ).toHaveLength(1)
})

it('closes after choosing a section and returns focus to the menu button', async () => {
  const { router, trigger, sheet } = await openSheet('/home')
  await act(async () =>
    sheet
      .querySelector<HTMLAnchorElement>(
        'nav[aria-label="Workspace navigation"] a[href="/explore"]',
      )!
      .click(),
  )
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  expect(router.state.location.pathname).toBe('/explore')
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})

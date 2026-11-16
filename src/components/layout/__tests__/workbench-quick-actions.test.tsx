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
vi.mock('../SidebarConversations', () => ({ SidebarConversations: () => null }))

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

let width = 1280
let container: HTMLDivElement
let root: Root

async function render(path: string) {
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
          { path: 'knowledge', element: <p>Knowledge task</p> },
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
  return router
}

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const palette = () => document.querySelector('[data-command-palette]')
const actions = (scope: ParentNode) =>
  scope.querySelector<HTMLElement>('[data-workbench-quick-actions]')
const button = (scope: ParentNode, text: string) =>
  Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find((item) =>
    item.textContent?.startsWith(text),
  )!

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  globalThis.ResizeObserver = TestResizeObserver
  HTMLElement.prototype.scrollIntoView = vi.fn()
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
  // The palette restores focus on the next frame.
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    window.setTimeout(() => callback(0), 0)
    return 1
  }
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

it('puts New chat and Search at the top of a chat panel; Search opens the palette and returns focus', async () => {
  const router = await render('/home')
  const panel = container.querySelector('[data-secondary-panel]')!
  const top = actions(panel)!
  expect(top).not.toBeNull()
  const search = button(top, 'Search')
  expect(search.getAttribute('aria-keyshortcuts')).toBe('Control+K')
  expect(search.textContent).toContain('Ctrl')
  expect(button(top, 'New chat').textContent).toContain('N')
  search.focus()
  await act(async () => search.click())
  expect(palette()).not.toBeNull()
  await act(async () =>
    document
      .querySelector('[cmdk-input]')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      ),
  )
  await settle()
  expect(palette()).toBeNull()
  expect(document.activeElement).toBe(search)
  useHomeStore.setState({ selectedConversationId: 'thread' })
  await act(async () => router.navigate('/knowledge'))
  await act(async () => router.navigate('/home'))
  await act(async () => button(actions(panel)!, 'New chat').click())
  expect(useHomeStore.getState().selectedConversationId).toBeNull()
  expect(router.state.location.pathname).toBe('/home')
})

it('offers only Search outside chat sections', async () => {
  await render('/knowledge')
  const top = actions(container.querySelector('[data-secondary-panel]')!)!
  expect(top.querySelectorAll('button')).toHaveLength(1)
  expect(top.textContent).toContain('Search')
})

it('closes the hover flyout before the palette takes focus', async () => {
  useUIStore.setState({ sidebarCollapsed: true })
  await render('/knowledge')
  const link = container.querySelector<HTMLAnchorElement>(
    '[data-primary-navigation] a[href="/knowledge"]',
  )!
  link.focus()
  await act(async () =>
    link.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    ),
  )
  const flyout = document.querySelector<HTMLElement>(
    '[data-radix-popper-content-wrapper]',
  )!
  await act(async () => button(actions(flyout)!, 'Search').click())
  await settle()
  expect(document.querySelector('[data-workbench-quick-actions]')).toBeNull()
  expect(palette()).not.toBeNull()
  expect(document.activeElement).toBe(document.querySelector('[cmdk-input]'))
})

it('stacks the palette over the mobile sheet with 44px entries', async () => {
  width = 390
  await render('/home')
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('button[aria-label="Open navigation"]')!
      .click(),
  )
  const sheet = document.querySelector<HTMLElement>('[role="dialog"]')!
  const top = actions(sheet)!
  const search = button(top, 'Search chats and knowledge')
  expect(search.className).toContain('min-h-11')
  expect(button(top, 'New chat').className).toContain('min-h-11')
  expect(top.querySelector('kbd')).toBeNull()
  await act(async () => search.click())
  expect(palette()).not.toBeNull()
  expect(sheet.isConnected).toBe(true)
})

import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  createMemoryRouter,
  RouterProvider,
  useNavigate,
} from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../app-shell'
import { useRegisterSecondaryNavigation } from '../workbench-navigation'
import { useUIStore } from '@/stores'
import { changeLanguage } from '@/locales/i18n'
import { DEFAULT_APPEARANCE, setAppearance } from '@/themes/appearance'

vi.mock('../sidebar-utilities', () => ({
  SidebarUtilities: () => <button>Account</button>,
}))
vi.mock('../SidebarConversations', () => ({ SidebarConversations: () => null }))
class ViewportMedia extends EventTarget {
  constructor(public matches: boolean) {
    super()
  }
}
class VisualViewportFixture extends EventTarget {
  height = 800
  scale = 1
}
let width = 1280
let media: Map<string, ViewportMedia>
let visual: VisualViewportFixture
let container: HTMLDivElement
let root: Root
let mounts: number
function readMatch(query: string) {
  return query === '(min-width: 48rem)'
    ? width >= 768
    : query === '(min-width: 64rem)'
      ? width >= 1024
      : false
}
function NavigationDraft() {
  const [draft, setDraft] = React.useState('Navigation draft')
  React.useEffect(() => {
    mounts += 1
  }, [])
  return (
    <input
      aria-label="Navigation draft"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  )
}
function Task() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [draft, setDraft] = React.useState('Task draft')
  const definition = React.useMemo(
    () => ({
      section: 'home' as const,
      title: t('layout.nav.home'),
      groups: [],
      content: <NavigationDraft />,
    }),
    [t],
  )
  useRegisterSecondaryNavigation(definition)
  return (
    <>
      <input
        aria-label="Task draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button onClick={() => navigate('/home?thread=two')}>Open thread</button>
    </>
  )
}
async function render() {
  const router = createMemoryRouter(
    [
      {
        path: '/home',
        element: (
          <AppShell>
            <Task />
          </AppShell>
        ),
      },
    ],
    { initialEntries: ['/home'] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  return router
}
async function resize(nextWidth: number) {
  await act(async () => {
    width = nextWidth
    for (const [query, entry] of media) {
      entry.matches = readMatch(query)
      entry.dispatchEvent(new Event('change'))
    }
    window.dispatchEvent(new Event('resize'))
  })
}
const click = (element: HTMLElement) => act(async () => element.click())
const button = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  width = 1280
  mounts = 0
  media = new Map()
  visual = new VisualViewportFixture()
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!media.has(query)) media.set(query, new ViewportMedia(readMatch(query)))
    return media.get(query)
  })
  vi.stubGlobal('innerHeight', 800)
  vi.stubGlobal('visualViewport', visual)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  setAppearance({ ...DEFAULT_APPEARANCE, mode: 'light' })
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

it('adapts the secondary navigation without rewriting its preference or remounting the main task', async () => {
  await render()
  const task = container.querySelector<HTMLInputElement>(
    'input[aria-label="Task draft"]',
  )!
  expect(
    container
      .querySelector('[data-workbench-shell]')
      ?.getAttribute('data-navigation-mode'),
  ).toBe('docked')
  await resize(900)
  expect(
    container
      .querySelector('[data-workbench-shell]')
      ?.getAttribute('data-navigation-mode'),
  ).toBe('overlay')
  expect(container.querySelector('[data-primary-navigation]')).not.toBeNull()
  expect(
    container
      .querySelector('[data-secondary-panel]')
      ?.getAttribute('data-collapsed'),
  ).toBe('true')
  expect(useUIStore.getState().sidebarCollapsed).toBe(false)
  await click(button('Expand secondary navigation'))
  expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  await resize(1280)
  await settle()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(container.querySelector('input[aria-label="Task draft"]')).toBe(task)
  expect(
    container
      .querySelector('[data-secondary-panel]')
      ?.getAttribute('data-collapsed'),
  ).toBe('false')
})

it('mounts mobile navigation once on demand and restores the actual opening control', async () => {
  await resize(390)
  await render()
  expect(container.querySelector('[data-primary-navigation]')).toBeNull()
  expect(mounts).toBe(0)
  const trigger = button('Open navigation')
  await click(trigger)
  expect(mounts).toBe(1)
  expect(
    document.querySelectorAll('input[aria-label="Navigation draft"]'),
  ).toHaveLength(1)
  await click(
    document.querySelector<HTMLElement>('[role="dialog"] a[href="/home"]')!,
  )
  await settle()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})

it('closes mobile navigation after same-path task navigation with a new location key', async () => {
  await resize(390)
  const router = await render()
  await click(button('Open navigation'))
  await act(async () => router.navigate('/home?thread=two'))
  await settle()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(router.state.location.search).toBe('?thread=two')
})

it('resizes the task surface and an open drawer to the keyboard visual viewport', async () => {
  await resize(390)
  await render()
  await click(button('Open navigation'))
  await act(async () => {
    visual.height = 420
    visual.dispatchEvent(new Event('resize'))
  })
  expect(
    container.querySelector<HTMLElement>('[data-workbench-shell]')?.style
      .height,
  ).toBe('420px')
  expect(
    document.querySelector<HTMLElement>('[role="dialog"]')?.style.height,
  ).toBe('420px')
  expect(document.querySelector('[data-navigation-scroll]')).not.toBeNull()
  await act(async () => {
    visual.scale = 2
    visual.dispatchEvent(new Event('resize'))
  })
  expect(
    container.querySelector<HTMLElement>('[data-workbench-shell]')?.style
      .height,
  ).toBe('800px')
})

it('keeps navigation and task drafts while preset and locale update in place', async () => {
  await render()
  const navigation = container.querySelector(
    'input[aria-label="Navigation draft"]',
  )
  const task = container.querySelector('input[aria-label="Task draft"]')
  await act(async () => setAppearance({ preset: 'ocean', textScale: 1.25 }))
  await act(async () => changeLanguage('zh-CN'))
  expect(container.querySelector('input[aria-label="Navigation draft"]')).toBe(
    navigation,
  )
  expect(container.querySelector('input[aria-label="Task draft"]')).toBe(task)
  expect(mounts).toBe(1)
  expect(
    container
      .querySelector('[data-main-task-area]')
      ?.getAttribute('aria-label'),
  ).toBe('主任务区')
})

it('supports directional primary navigation and a skip link to the existing task region', async () => {
  await render()
  const links = container.querySelectorAll<HTMLAnchorElement>(
    '[data-primary-navigation] nav a',
  )
  act(() => {
    links[0].focus()
    links[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    )
  })
  expect(document.activeElement).toBe(links[3])
  act(() =>
    links[3].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    ),
  )
  expect(document.activeElement).toBe(links[0])
  await click(container.querySelector<HTMLAnchorElement>('a[href^="#"]')!)
  expect(document.activeElement).toBe(
    container.querySelector('[data-main-task-area]'),
  )
})

it('returns focus to a visible navigation control when resizing hides the original mobile trigger', async () => {
  await resize(390)
  await render()
  const trigger = button('Open navigation')
  await click(trigger)
  // A hidden original trigger cannot receive focus after the breakpoint changes.
  trigger.disabled = true
  await resize(1280)
  await settle()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(document.activeElement).toBe(button('Collapse secondary navigation'))
})

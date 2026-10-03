// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { Database, User } from 'lucide-react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ContextRail } from '@/components/patterns/context-rail'

const groups = [
  {
    label: 'Workspace',
    items: [
      {
        title: 'Data sources',
        href: '/settings/data',
        icon: Database,
        matcher: (path: string) => path.startsWith('/settings/data'),
      },
      { title: 'Profile', href: '/settings/profile', icon: User },
    ],
  },
]
const labels = {
  expand: 'Expand page navigation',
  collapse: 'Collapse page navigation',
  open: 'Open page navigation',
  close: 'Close page navigation',
}
let container: HTMLDivElement
let root: Root
let desktopQuery: EventTarget & { matches: boolean }

const Harness = () => {
  const [collapsed, setCollapsed] = React.useState(false)
  const location = useLocation()
  return (
    <>
      <ContextRail
        title="Settings"
        navAriaLabel="Settings navigation"
        groups={groups}
        currentPath={location.pathname}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        labels={labels}
        footer={(compact) => (
          <button aria-label="Log out">{compact ? '↪' : 'Log out'}</button>
        )}
      />
      <output>{location.pathname}</output>
    </>
  )
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  desktopQuery = Object.assign(new EventTarget(), { matches: false })
  vi.stubGlobal('matchMedia', () => desktopQuery)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() =>
    root.render(
      <MemoryRouter initialEntries={['/settings/data/details']}>
        <Harness />
      </MemoryRouter>,
    ),
  )
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

const button = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const click = async (element: HTMLElement) => act(async () => element.click())

it('keeps active routes and accessible link names when collapsed, and can expand again', async () => {
  const aside = container.querySelector('aside')!
  const active = aside.querySelector('a[aria-current="page"]')!
  expect(active.getAttribute('href')).toBe('/settings/data')
  await click(button(labels.collapse))
  expect(aside.dataset.collapsed).toBe('true')
  expect(
    aside.querySelector('a[aria-current="page"]')?.getAttribute('aria-label'),
  ).toBe('Data sources')
  expect(button(labels.expand).getAttribute('aria-expanded')).toBe('false')
  expect(aside.querySelector('button[aria-label="Log out"]')?.textContent).toBe(
    '↪',
  )
  await click(button(labels.expand))
  expect(aside.dataset.collapsed).toBe('false')
  expect(button(labels.collapse).getAttribute('aria-expanded')).toBe('true')
  expect(aside.querySelector('button[aria-label="Log out"]')?.textContent).toBe(
    'Log out',
  )
})

it('closes the mobile drawer after navigation and highlights the destination', async () => {
  await click(button(labels.open))
  const dialog = document.querySelector('[role="dialog"]')!
  expect(dialog.textContent).toContain('Data sources')
  expect(
    dialog.querySelector('a[aria-current="page"]')?.getAttribute('href'),
  ).toBe('/settings/data')
  await click(
    dialog.querySelector<HTMLAnchorElement>('a[href="/settings/profile"]')!,
  )
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(container.querySelector('output')?.textContent).toBe(
    '/settings/profile',
  )
  expect(
    container
      .querySelector('aside a[aria-current="page"]')
      ?.getAttribute('href'),
  ).toBe('/settings/profile')
})

it('dismisses with Escape and returns focus, and closes when switching to desktop', async () => {
  const trigger = button(labels.open)
  trigger.focus()
  await click(trigger)
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
  await click(trigger)
  await act(async () => {
    desktopQuery.matches = true
    desktopQuery.dispatchEvent(new Event('change'))
  })
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(container.querySelector('aside')?.getAttribute('data-collapsed')).toBe(
    'false',
  )
})

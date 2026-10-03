// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BreadcrumbLink } from '@/components/ui/breadcrumb'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

it('makes callback navigation focusable and activates it with Enter', () => {
  const onClick = vi.fn()
  act(() =>
    root.render(<BreadcrumbLink onClick={onClick}>Settings</BreadcrumbLink>),
  )
  const link = container.querySelector('a')!
  expect(link.getAttribute('role')).toBe('link')
  expect(link.tabIndex).toBe(0)
  link.focus()
  expect(document.activeElement).toBe(link)
  act(() =>
    link.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    ),
  )
  expect(onClick).toHaveBeenCalledOnce()
})

it('preserves native links and lets callers prevent keyboard activation', () => {
  const onClick = vi.fn()
  act(() =>
    root.render(
      <BreadcrumbLink href="/settings" onClick={onClick}>
        Settings
      </BreadcrumbLink>,
    ),
  )
  const link = container.querySelector('a')!
  expect(link.getAttribute('href')).toBe('/settings')
  expect(link.hasAttribute('role')).toBe(false)
  const keydown = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  })
  act(() => link.dispatchEvent(keydown))
  expect(keydown.defaultPrevented).toBe(false)
  expect(onClick).not.toHaveBeenCalled()

  act(() =>
    root.render(
      <BreadcrumbLink
        onClick={onClick}
        onKeyDown={(event) => event.preventDefault()}
      >
        Settings
      </BreadcrumbLink>,
    ),
  )
  act(() =>
    link.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    ),
  )
  expect(onClick).not.toHaveBeenCalled()
})

it('composes a native child link without nesting anchors and retains the navigation styles', () => {
  act(() =>
    root.render(
      <BreadcrumbLink asChild>
        <a href="/settings/profile">Settings</a>
      </BreadcrumbLink>,
    ),
  )
  expect(container.querySelectorAll('a')).toHaveLength(1)
  const link = container.querySelector('a')!
  expect(link.getAttribute('href')).toBe('/settings/profile')
  expect(link.className).toContain('text-text-secondary')
  expect(link.hasAttribute('asChild')).toBe(false)
})

// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { NavigationFlyout } from '@/components/patterns/navigation-flyout'
import { SecondaryNavigationContent } from '@/components/patterns/secondary-navigation-content'

let root: Root
let container: HTMLDivElement
const Harness = () => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <input aria-label="Search resources" />
      <NavigationFlyout
        label="Knowledge"
        open={open}
        onOpenChange={setOpen}
        content={
          <SecondaryNavigationContent
            title="Knowledge"
            currentPath="/knowledge"
            onNavigate={() => setOpen(false)}
            groups={[
              {
                items: [
                  { title: 'Knowledge libraries', href: '/knowledge' },
                  { title: 'Memory', href: '/memory' },
                ],
              },
            ]}
          />
        }
      >
        <a href="/knowledge" aria-label="Knowledge">
          K
        </a>
      </NavigationFlyout>
    </>
  )
}
const settle = (ms = 0) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
const pointer = (
  element: Element,
  type: 'pointerover' | 'pointerout',
  pointerType = 'mouse',
  relatedTarget: Element | null = null,
) =>
  act(async () => {
    const event = new MouseEvent(type, { bubbles: true, relatedTarget })
    Object.defineProperty(event, 'pointerType', { value: pointerType })
    element.dispatchEvent(event)
  })
const trigger = () => container.querySelector<HTMLAnchorElement>('a')!
const panel = () => document.querySelector<HTMLElement>('[role="dialog"]')
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('previews secondary navigation on mouse hover without moving focus, and closes after leaving both surfaces', async () => {
  const search = container.querySelector<HTMLInputElement>('input')!
  search.focus()
  await pointer(trigger(), 'pointerover')
  await settle()
  expect(panel()?.textContent).toContain('Knowledge libraries')
  expect(document.activeElement).toBe(search)
  await pointer(trigger(), 'pointerout')
  await pointer(panel()!, 'pointerover')
  await settle(180)
  expect(panel()).toBeTruthy()
  await pointer(panel()!, 'pointerout')
  await settle(180)
  expect(panel()).toBeNull()
  expect(document.activeElement).toBe(search)
})

it('opens with ArrowRight, focuses its first destination, and restores the primary link with Escape', async () => {
  await act(async () => {
    trigger().focus()
    trigger().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
  })
  await settle()
  expect(document.activeElement?.textContent).toBe('Knowledge libraries')
  await act(async () =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  await settle()
  expect(panel()).toBeNull()
  expect(document.activeElement).toBe(trigger())
})

it('does not open on touch hover and closes when a secondary destination is chosen', async () => {
  await pointer(trigger(), 'pointerover', 'touch')
  expect(panel()).toBeNull()
  await pointer(trigger(), 'pointerover')
  await settle()
  await act(async () =>
    panel()?.querySelector<HTMLAnchorElement>('a[href="/memory"]')?.click(),
  )
  await settle()
  expect(panel()).toBeNull()
})

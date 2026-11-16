import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

/** Mounts into a fresh container; call `unmount` in afterEach. */
export function mount() {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const container = document.createElement('div')
  document.body.append(container)
  const root: Root = createRoot(container)
  return {
    container,
    render: (node: ReactNode) =>
      act(async () => root.render(<MemoryRouter>{node}</MemoryRouter>)),
    unmount: async () => {
      await act(async () => root.unmount())
      container.remove()
    },
  }
}

export const click = (element: Element) =>
  act(async () => (element as HTMLElement).click())

export const press = (element: Element, key: string) =>
  act(async () => {
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
  })

/** Radix menus open from the keyboard in jsdom, which has no pointer events. */
export const openMenu = (trigger: HTMLElement) =>
  act(async () => {
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })

export const menuItem = (text: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ].find((element) => element.textContent?.trim() === text)

export const byLabel = (scope: ParentNode, label: string) =>
  scope.querySelector<HTMLElement>(`[aria-label="${label}"]`)

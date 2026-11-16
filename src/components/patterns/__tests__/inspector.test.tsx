import { act, useState, type PropsWithChildren } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { Inspector } from '../inspector'
import { click, mount, press } from './collection-test-utils'

vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Panel: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Separator: ({ 'aria-label': label }: { 'aria-label': string }) => (
    <hr aria-label={label} />
  ),
}))

let width = 1400
let view: ReturnType<typeof mount>
beforeEach(async () => {
  await changeLanguage('en-US')
  width = 1400
  localStorage.removeItem('ai-workspace-panel-width')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({
      width,
      height: 900,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 900,
      toJSON() {},
    }),
  )
  view = mount()
})
afterEach(async () => {
  await view.unmount()
  vi.restoreAllMocks()
})

function Page({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const change = (next: boolean) => {
    onOpenChange?.(next)
    setOpen(next)
  }
  return (
    <Inspector
      open={open}
      onOpenChange={change}
      title="report.pdf"
      description="3 chunks"
      content={<button type="button">Re-parse</button>}
    >
      <input aria-label="Search documents" />
      <button type="button" onClick={() => change(true)}>
        Open report.pdf
      </button>
    </Inspector>
  )
}

const opener = () =>
  [...view.container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Open report.pdf',
  )!
const panel = () =>
  view.container.querySelector<HTMLElement>(
    '[data-workspace-detail] [data-context-panel]',
  )

it('docks on wide screens, takes focus and returns it to the opener on Esc', async () => {
  const onOpenChange = vi.fn()
  await view.render(<Page onOpenChange={onOpenChange} />)
  const button = opener()
  button.focus()
  await click(button)
  expect(
    view.container.querySelector('[data-workspace-mode="dock"]'),
  ).not.toBeNull()
  expect(panel()?.querySelector('h2')?.textContent).toBe('report.pdf')
  expect(document.activeElement).toBe(panel())
  expect(document.querySelector('[role="dialog"]')).toBeNull()

  const action = panel()!.querySelector('button:not([aria-label])')!
  ;(action as HTMLElement).focus()
  await press(action, 'Escape')
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
  expect(panel()).toBeNull()
  expect(document.activeElement).toBe(button)
})

it('closes from the close button and ignores Esc typed into a main-area field', async () => {
  await view.render(<Page />)
  const button = opener()
  button.focus()
  await click(button)
  const search = view.container.querySelector('input')!
  search.focus()
  await press(search, 'Escape')
  expect(panel()).not.toBeNull()

  await press(button, 'Escape')
  expect(panel()).toBeNull()

  button.focus()
  await click(button)
  await click(panel()!.querySelector('button[aria-label="Close details"]')!)
  expect(panel()).toBeNull()
  expect(document.activeElement).toBe(button)
})

it('uses a Sheet on narrow screens and keeps the main area mounted', async () => {
  width = 700
  await view.render(<Page />)
  const search = view.container.querySelector('input')!
  const button = opener()
  button.focus()
  await click(button)
  expect(
    view.container.querySelector('[data-workspace-mode="sheet"]'),
  ).not.toBeNull()
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
  expect(dialog.textContent).toContain('Re-parse')
  expect(view.container.querySelector('input')).toBe(search)

  await act(async () => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
  })
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(document.activeElement).toBe(button)
})

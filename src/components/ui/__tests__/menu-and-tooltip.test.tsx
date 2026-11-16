import { act } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { Tooltip } from '../tooltip'
import { installRadixSelectDom } from './helpers/radix-select'
import { byRole, createReactHarness, press } from './helpers/react-harness'

const { render, cleanup } = createReactHarness()
let restoreDom: (() => void) | undefined

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  // Radix menus call layout and pointer-capture APIs jsdom lacks.
  restoreDom = installRadixSelectDom()
})

afterEach(async () => {
  await cleanup()
  restoreDom?.()
})

test('DropdownMenu keeps its API on Radix: keyboard opening and item onClick', async () => {
  const onRowClick = vi.fn()
  const onEdit = vi.fn()
  await render(
    // A clickable list row, as in the tables that host these menus.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={onRowClick}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">Actions</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem disabled>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>,
  )
  const trigger = document.querySelector<HTMLButtonElement>('button')!
  // A pointerless click (assistive technology) opens the menu, and the click
  // must not activate the row the trigger sits in.
  await act(async () => trigger.click())
  expect(onRowClick).not.toHaveBeenCalled()
  await vi.waitFor(() => expect(byRole('menu')).toHaveLength(1))
  await press('Escape')
  await vi.waitFor(() => expect(byRole('menu')).toHaveLength(0))

  await act(async () => trigger.focus())
  await press('Enter', trigger)
  await vi.waitFor(() => expect(byRole('menu')).toHaveLength(1))
  const [edit, archive] = byRole('menuitem')
  expect(archive.getAttribute('aria-disabled')).toBe('true')
  await act(async () => edit.focus())
  await press('Enter', edit)
  expect(onEdit).toHaveBeenCalledTimes(1)
  await vi.waitFor(() => expect(byRole('menu')).toHaveLength(0))
})

test('Tooltip renders a shortcut and can stay out of the way', async () => {
  await render(
    <>
      <Tooltip content="Collapse" shortcut={['Ctrl', 'B']} asChild>
        <button type="button">Toggle</button>
      </Tooltip>
      <Tooltip content="Hidden" disabled>
        <span>Plain</span>
      </Tooltip>
    </>,
  )
  const button = document.querySelector('button')!
  // asChild: the button itself is the trigger, not a wrapping span.
  expect(button.parentElement?.tagName).toBe('DIV')
  expect(button.getAttribute('data-state')).toBe('closed')
  await act(async () => button.focus())
  // Radix repeats the label for assistive technology, so compare the set.
  await vi.waitFor(() =>
    expect(
      new Set(
        Array.from(document.querySelectorAll('kbd')).map(
          (key) => key.textContent,
        ),
      ),
    ).toEqual(new Set(['Ctrl', 'B'])),
  )
  // A disabled tooltip renders its child untouched.
  const plain = Array.from(document.querySelectorAll('span')).find(
    (node) => node.textContent === 'Plain',
  )
  expect(plain?.hasAttribute('data-state')).toBe(false)
})

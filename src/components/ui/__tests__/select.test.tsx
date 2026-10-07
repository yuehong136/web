import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Dialog, DialogContent } from '../dialog'
import { Modal } from '../modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../sheet'
import { findOption, installRadixSelectDom } from './helpers/radix-select'

let root: Root | undefined
let restoreDom: (() => void) | undefined

beforeEach(() => {
  restoreDom = installRadixSelectDom()
})

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  restoreDom?.()
  document.body.innerHTML = ''
})

async function render(ui: ReactNode) {
  if (!root) {
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  }
  await act(async () => root?.render(ui))
}

const fruitItems = [
  <SelectItem key="apple" value="apple">
    Apple
  </SelectItem>,
  <SelectItem key="banana" value="banana">
    Banana
  </SelectItem>,
  <SelectItem key="cherry" value="cherry">
    Cherry
  </SelectItem>,
]

function FruitSelect({
  onChange,
  disabled = false,
}: {
  onChange?: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('apple')
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        onChange?.(next)
        setValue(next)
      }}
    >
      <SelectTrigger aria-label="Fruit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{fruitItems}</SelectContent>
    </Select>
  )
}

function trigger() {
  return document.querySelector<HTMLButtonElement>('[role="combobox"]')
}

function listbox() {
  return document.querySelector<HTMLElement>('[role="listbox"]')
}

async function press(key: string, target = document.activeElement) {
  await act(async () => {
    target?.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
    // Radix moves focus between options on a timer.
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

async function pointer(type: string, target: Element) {
  await act(async () => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerType: 'mouse',
      }),
    )
  })
}

async function openWithKeyboard() {
  const combobox = trigger()
  if (!combobox) throw new Error('Missing select trigger')
  await act(async () => combobox.focus())
  await press('ArrowDown', combobox)
  // The selected option takes focus once the list has been positioned.
  await vi.waitFor(() =>
    expect(document.activeElement?.getAttribute('role')).toBe('option'),
  )
  return combobox
}

test('the trigger and its list expose combobox and listbox semantics', async () => {
  await render(<FruitSelect />)
  const combobox = trigger()

  expect(combobox?.getAttribute('aria-expanded')).toBe('false')
  await openWithKeyboard()

  const list = listbox()
  expect(combobox?.getAttribute('aria-expanded')).toBe('true')
  expect(combobox?.getAttribute('aria-controls')).toBe(list?.id)
  const options = Array.from(
    list?.querySelectorAll('[role="option"]') ?? [],
  ).map((option) => [option.textContent, option.getAttribute('data-state')])
  expect(options).toEqual([
    ['Apple', 'checked'],
    ['Banana', 'unchecked'],
    ['Cherry', 'unchecked'],
  ])
})

test('arrow keys move through the list and Enter picks an option', async () => {
  const onChange = vi.fn<(value: string) => void>()
  await render(<FruitSelect onChange={onChange} />)
  const combobox = await openWithKeyboard()

  expect(document.activeElement?.textContent).toBe('Apple')
  await press('ArrowDown')
  expect(document.activeElement?.textContent).toBe('Banana')
  await press('Enter')

  expect(onChange).toHaveBeenCalledExactlyOnceWith('banana')
  expect(listbox()).toBeNull()
  expect(document.activeElement).toBe(combobox)
  expect(combobox.textContent).toBe('Banana')
})

test('typing jumps to the first option starting with that letter', async () => {
  const onChange = vi.fn<(value: string) => void>()
  await render(<FruitSelect onChange={onChange} />)
  await openWithKeyboard()

  await press('c')
  expect(document.activeElement?.textContent).toBe('Cherry')
  await press('Enter')

  expect(onChange).toHaveBeenCalledExactlyOnceWith('cherry')
})

test('Escape closes the list without a pick and returns focus', async () => {
  const onChange = vi.fn<(value: string) => void>()
  await render(<FruitSelect onChange={onChange} />)
  const combobox = await openWithKeyboard()

  await press('Escape')

  expect(listbox()).toBeNull()
  expect(document.activeElement).toBe(combobox)
  expect(onChange).not.toHaveBeenCalled()
  expect(combobox.textContent).toBe('Apple')
})

test('a mouse press opens the list and a click on an option picks it', async () => {
  const onChange = vi.fn<(value: string) => void>()
  await render(<FruitSelect onChange={onChange} />)
  const combobox = trigger()
  if (!combobox) throw new Error('Missing select trigger')

  await pointer('pointerdown', combobox)
  await pointer('pointerup', combobox)
  const cherry = findOption('Cherry')
  expect(cherry).toBeDefined()
  if (!cherry) return
  await pointer('pointermove', cherry)
  await pointer('pointerdown', cherry)
  await pointer('pointerup', cherry)

  expect(onChange).toHaveBeenCalledExactlyOnceWith('cherry')
  expect(listbox()).toBeNull()
  expect(combobox.textContent).toBe('Cherry')
})

const outerLayers: Record<
  string,
  (props: {
    open: boolean
    setOpen: (open: boolean) => void
    children: ReactNode
  }) => ReactNode
> = {
  Sheet: ({ open, setOpen, children }) => (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetTitle>Outer sheet</SheetTitle>
        <SheetDescription>Holds a select</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  ),
  Dialog: ({ open, setOpen, children }) => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  ),
  Modal: ({ open, setOpen, children }) => (
    <Modal open={open} onClose={() => setOpen(false)} title="Outer modal">
      {children}
    </Modal>
  ),
}

test.each(Object.keys(outerLayers))(
  'Escape inside a %s closes the list first and the layer second',
  async (layer) => {
    const OuterLayer = outerLayers[layer]
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <OuterLayer open={open} setOpen={setOpen}>
          <FruitSelect />
        </OuterLayer>
      )
    }
    await render(<Harness />)
    const combobox = await openWithKeyboard()

    await press('Escape')
    expect(listbox()).toBeNull()
    expect(trigger()).toBe(combobox)
    expect(document.activeElement).toBe(combobox)

    await press('Escape')
    expect(trigger()).toBeNull()
  },
)

test('the open list carries the scoped theme of its subtree', async () => {
  await render(
    <div data-theme="dark">
      <FruitSelect />
    </div>,
  )
  await openWithKeyboard()

  expect(listbox()?.getAttribute('data-theme')).toBe('dark')
})

function ValueSelect({
  value,
  placeholder,
}: {
  value?: string
  placeholder?: string
}) {
  return (
    <Select value={value} placeholder={placeholder}>
      <SelectTrigger aria-label="Fruit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{fruitItems}</SelectContent>
    </Select>
  )
}

test('the closed trigger shows the placeholder, the label, or an unknown value', async () => {
  await render(<ValueSelect placeholder="Pick a fruit" />)
  expect(trigger()?.textContent).toBe('Pick a fruit')

  await render(<ValueSelect value="banana" placeholder="Pick a fruit" />)
  expect(trigger()?.textContent).toBe('Banana')

  await render(<ValueSelect value="" placeholder="Pick a fruit" />)
  expect(trigger()?.textContent).toBe('Pick a fruit')

  // A saved value whose item is not offered (yet) still reads as something.
  await render(<ValueSelect value="durian" placeholder="Pick a fruit" />)
  expect(trigger()?.textContent).toBe('durian')
})

test('a value whose item drops out of the list keeps its last label', async () => {
  function SearchedSelect({ offered }: { offered: string[] }) {
    return (
      <Select value="banana">
        <SelectTrigger aria-label="Fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fruitItems.filter((item) => offered.includes(String(item.key)))}
        </SelectContent>
      </Select>
    )
  }

  await render(<SearchedSelect offered={['apple', 'banana']} />)
  expect(trigger()?.textContent).toBe('Banana')

  // A search that no longer matches the selected item must not reveal its id.
  await render(<SearchedSelect offered={['apple']} />)
  expect(trigger()?.textContent).toBe('Banana')
})

test('a select inside a form never reports a value nobody picked', async () => {
  const onChange = vi.fn<(value: string) => void>()
  function FormSelect({ value }: { value: string }) {
    return (
      <form>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-label="Fruit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{fruitItems}</SelectContent>
        </Select>
      </form>
    )
  }

  await render(<FormSelect value="apple" />)
  // Options can arrive after the value, e.g. a saved model while models load.
  await render(<FormSelect value="durian" />)
  await render(<FormSelect value="banana" />)

  expect(onChange).not.toHaveBeenCalled()
  expect(trigger()?.textContent).toBe('Banana')
})

test('a disabled select can be neither opened nor changed', async () => {
  const onChange = vi.fn<(value: string) => void>()
  await render(<FruitSelect onChange={onChange} disabled />)
  const combobox = trigger()
  if (!combobox) throw new Error('Missing select trigger')

  expect(combobox.disabled).toBe(true)
  await act(async () => {
    combobox.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await pointer('pointerdown', combobox)
  // Typeahead (first, before a space joins its buffer) and opening keys must
  // not reach the value either.
  for (const key of ['b', 'ArrowDown', 'Enter', ' ']) {
    await press(key, combobox)
  }

  expect(listbox()).toBeNull()
  expect(onChange).not.toHaveBeenCalled()
  expect(combobox.textContent).toBe('Apple')
})

test('disabling an open select closes its list', async () => {
  const onChange = vi.fn<(value: string) => void>()
  await render(<FruitSelect onChange={onChange} />)
  await openWithKeyboard()

  await render(<FruitSelect onChange={onChange} disabled />)

  expect(listbox()).toBeNull()
  expect(trigger()?.disabled).toBe(true)
  expect(onChange).not.toHaveBeenCalled()
})

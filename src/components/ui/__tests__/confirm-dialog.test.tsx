import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ConfirmDialog, type ConfirmDialogProps } from '../confirm-dialog'

let root: Root | undefined

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
})

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
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

const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]')
const button = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (node) => node.textContent === text,
  )

function typeInto(input: HTMLInputElement, value: string) {
  // React tracks the value through the native setter.
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function Harness(
  props: Partial<ConfirmDialogProps> & { onConfirm: () => void },
) {
  const [open, setOpen] = useState(true)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete knowledge base"
      description="This cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="destructive"
      {...props}
    />
  )
}

test('a plain confirmation is an alert dialog that starts on Cancel', async () => {
  const onConfirm = vi.fn()
  await render(<Harness onConfirm={onConfirm} />)

  const node = dialog()
  expect(node).not.toBeNull()
  expect(
    document.getElementById(node!.getAttribute('aria-labelledby')!)
      ?.textContent,
  ).toBe('Delete knowledge base')
  expect(
    document.getElementById(node!.getAttribute('aria-describedby')!)
      ?.textContent,
  ).toBe('This cannot be undone.')
  await vi.waitFor(() => expect(document.activeElement).toBe(button('Cancel')))

  await act(async () => button('Delete')?.click())
  expect(onConfirm).toHaveBeenCalledTimes(1)
  // The owner closes it after the action succeeds.
  expect(dialog()).not.toBeNull()

  await act(async () => button('Cancel')?.click())
  expect(dialog()).toBeNull()
})

test('typed-name mode blocks confirming until the exact name is entered', async () => {
  const onConfirm = vi.fn()
  await render(
    <Harness onConfirm={onConfirm} confirmationText="Q3 contracts" />,
  )

  const input = dialog()?.querySelector('input') as HTMLInputElement
  // The gate takes initial focus and is labelled with the name to type.
  await vi.waitFor(() => expect(document.activeElement).toBe(input))
  expect(input.labels?.[0]?.textContent).toContain('Q3 contracts')
  const confirm = button('Delete')!
  expect(confirm.disabled).toBe(true)

  await act(async () => typeInto(input, 'q3 contracts'))
  expect(confirm.disabled).toBe(true)
  // Enter in the field does nothing while the text differs.
  await act(async () => input.form?.requestSubmit())
  expect(onConfirm).not.toHaveBeenCalled()

  await act(async () => typeInto(input, 'Q3 contracts'))
  expect(confirm.disabled).toBe(false)
  await act(async () => input.form?.requestSubmit())
  expect(onConfirm).toHaveBeenCalledTimes(1)
})

test('the typed text resets when the dialog opens again', async () => {
  function Reopen() {
    const [open, setOpen] = useState(true)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Reopen
        </button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmationText="abc"
          onConfirm={() => undefined}
        />
      </>
    )
  }
  await render(<Reopen />)
  const first = dialog()?.querySelector('input') as HTMLInputElement
  await act(async () => typeInto(first, 'abc'))
  await act(async () => button('Cancel')?.click())
  expect(dialog()).toBeNull()

  await act(async () => button('Reopen')?.click())
  const reopened = dialog()?.querySelector('input') as HTMLInputElement
  expect(reopened.value).toBe('')
  expect(button('Delete')?.disabled).toBe(true)
})

test('a pending action locks the buttons and Escape', async () => {
  const onOpenChange = vi.fn()
  await render(
    <ConfirmDialog
      open
      pending
      onOpenChange={onOpenChange}
      title="Delete"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={() => undefined}
    />,
  )
  expect(button('Cancel')?.disabled).toBe(true)
  expect(button('Delete')?.getAttribute('aria-busy')).toBe('true')
  await act(async () => {
    dialog()?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
  })
  expect(onOpenChange).not.toHaveBeenCalled()
})

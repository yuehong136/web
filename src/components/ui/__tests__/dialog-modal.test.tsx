import { act, createRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../dialog'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '../action-menu'
import { stubNativeDialog } from './native-dialog'

let root: Root
let container: HTMLDivElement
let native: ReturnType<typeof stubNativeDialog>
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 0
  })
  native = stubNativeDialog()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  native.restore()
})
describe('opt-in modal dialog focus', () => {
  it('restores a persistent caller without requiring an explicit ref', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const render = (open: boolean) =>
      act(async () =>
        root.render(
          <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent modal>
              <DialogTitle>Information</DialogTitle>
            </DialogContent>
          </Dialog>,
        ),
      )
    await render(true)
    await render(false)
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('preserves the existing non-modal rendering contract', async () => {
    await act(async () =>
      root.render(
        <Dialog open onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Legacy</DialogTitle>
          </DialogContent>
        </Dialog>,
      ),
    )
    expect(document.querySelector('dialog')?.open).toBe(true)
    expect(native.showModal).not.toHaveBeenCalled()
  })

  it('enters focus once, respects nested Escape, and restores the persistent trigger', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Persistent trigger'
    container.append(trigger)
    const returnFocusRef = createRef<HTMLButtonElement>()
    returnFocusRef.current = trigger
    const onOpenChange = vi.fn()
    const render = (open: boolean, title = 'Editor') =>
      act(async () =>
        root.render(
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent modal returnFocusRef={returnFocusRef}>
              <DialogTitle>{title}</DialogTitle>
              <input aria-label="Variable name" />
            </DialogContent>
          </Dialog>,
        ),
      )
    await render(true)
    expect(native.showModal).toHaveBeenCalledTimes(1)
    expect(document.activeElement?.closest('dialog')).not.toBeNull()
    await render(true, 'Updated editor')
    expect(native.showModal).toHaveBeenCalledTimes(1)
    const consumed = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
    })
    consumed.preventDefault()
    document.dispatchEvent(consumed)
    expect(onOpenChange).not.toHaveBeenCalled()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    // The persistent toolbar trigger is outside the temporary popover and portal.
    document.body.append(trigger)
    await render(false)
    expect(native.close).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('links actual custom title and description ids before entering native modal mode', async () => {
    let nameAtOpen: string | null = null
    let descriptionAtOpen: string | null = null
    native.showModal.mockImplementation(function (this: HTMLDialogElement) {
      nameAtOpen = this.getAttribute('aria-labelledby')
      descriptionAtOpen = this.getAttribute('aria-describedby')
      this.setAttribute('open', '')
    })
    await act(async () =>
      root.render(
        <Dialog open onOpenChange={() => {}}>
          <DialogContent modal>
            <DialogTitle id="project-kind-title">New project</DialogTitle>
            <DialogDescription id="project-kind-description">
              Choose a project type.
            </DialogDescription>
            <fieldset aria-labelledby="project-kind-title" />
          </DialogContent>
        </Dialog>,
      ),
    )
    expect(nameAtOpen).toBe('project-kind-title')
    expect(descriptionAtOpen).toBe('project-kind-description')
    const dialog = document.querySelector('dialog')!
    expect(
      document.getElementById(dialog.getAttribute('aria-labelledby')!)
        ?.textContent,
    ).toBe('New project')
    expect(
      document.getElementById(dialog.getAttribute('aria-describedby')!)
        ?.textContent,
    ).toBe('Choose a project type.')
    expect(
      dialog.querySelector('fieldset')?.getAttribute('aria-labelledby'),
    ).toBe(nameAtOpen)
  })

  it('creates distinct stable labels and removes a description reference when its content unmounts', async () => {
    const render = (description: boolean) =>
      act(async () =>
        root.render(
          <>
            <Dialog open onOpenChange={() => {}}>
              <DialogContent>
                <DialogTitle>First</DialogTitle>
                {description && (
                  <DialogDescription>First description</DialogDescription>
                )}
              </DialogContent>
            </Dialog>
            <Dialog open onOpenChange={() => {}}>
              <DialogContent>
                <DialogTitle>Second</DialogTitle>
              </DialogContent>
            </Dialog>
          </>,
        ),
      )
    await render(true)
    const [first, second] = [...document.querySelectorAll('dialog')]
    const firstId = first.getAttribute('aria-labelledby')!
    const secondId = second.getAttribute('aria-labelledby')!
    expect(firstId).not.toBe(secondId)
    expect(document.getElementById(firstId)?.textContent).toBe('First')
    expect(first.getAttribute('aria-describedby')).toBeTruthy()
    expect(second.hasAttribute('aria-describedby')).toBe(false)
    await render(false)
    expect(first.getAttribute('aria-labelledby')).toBe(firstId)
    expect(first.hasAttribute('aria-describedby')).toBe(false)
  })

  it('delegates Tab isolation to native modal mode and focuses an enabled content target', async () => {
    const origin = document.createElement('button')
    document.body.append(origin)
    origin.focus()
    await act(async () =>
      root.render(
        <Dialog open onOpenChange={() => {}}>
          <DialogContent modal showCloseButton={false}>
            <DialogTitle>Editor</DialogTitle>
            <input disabled aria-label="Disabled" />
            <input type="hidden" />
            <input tabIndex={-1} aria-label="Excluded" />
            <input aria-label="Editable" />
            <button type="button">Save</button>
          </DialogContent>
        </Dialog>,
      ),
    )
    const dialog = document.querySelector('dialog')!
    expect(native.showModal).toHaveBeenCalledTimes(1)
    expect(dialog.open).toBe(true)
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Editable')
    expect(
      dialog.querySelector('button[aria-label]')?.getAttribute('tabindex'),
    ).toBe('-1')
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    document.activeElement!.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
    origin.remove()
  })

  it.each(['Escape', 'cancel'] as const)(
    'closes a controlled modal and returns focus to its origin on %s',
    async (action) => {
      function Surface() {
        const [open, setOpen] = useState(false)
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Open editor
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent modal>
                <DialogTitle>Editor</DialogTitle>
                <input aria-label="Name" />
              </DialogContent>
            </Dialog>
          </>
        )
      }
      await act(async () => root.render(<Surface />))
      const origin = container.querySelector('button')!
      origin.focus()
      await act(async () => origin.click())
      expect(document.activeElement?.closest('dialog')).not.toBeNull()
      const event =
        action === 'Escape'
          ? new KeyboardEvent('keydown', {
              key: 'Escape',
              bubbles: true,
              cancelable: true,
            })
          : new Event('cancel', { cancelable: true })
      await act(async () => {
        if (action === 'Escape') document.activeElement!.dispatchEvent(event)
        else document.querySelector('dialog')!.dispatchEvent(event)
      })
      expect(event.defaultPrevented).toBe(true)
      expect(document.querySelector('dialog')).toBeNull()
      expect(document.activeElement).toBe(origin)
      expect(native.close).toHaveBeenCalledTimes(1)
    },
  )

  it('lets a real nested Radix menu consume Escape without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    const onMenuChange = vi.fn()
    await act(async () =>
      root.render(
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent modal>
            <DialogTitle>Editor</DialogTitle>
            <ActionMenu open onOpenChange={onMenuChange}>
              <ActionMenuTrigger>More</ActionMenuTrigger>
              <ActionMenuContent>
                <ActionMenuItem>Nested command</ActionMenuItem>
              </ActionMenuContent>
            </ActionMenu>
          </DialogContent>
        </Dialog>,
      ),
    )
    const menu = document.querySelector('[role="menu"]')!
    expect(menu).not.toBeNull()
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    await act(async () => menu.dispatchEvent(escape))
    expect(escape.defaultPrevented).toBe(true)
    expect(onMenuChange).toHaveBeenCalledWith(false)
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Dialog, DialogContent, DialogTitle } from '../dialog'

let root: Root
let container: HTMLDivElement
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
})
const close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute('open')
})
const nativeShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
)
const nativeClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
)
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 0
  })
  // jsdom lacks native modal APIs; real focus trapping is also checked in Chromium.
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: showModal },
    close: { configurable: true, value: close },
  })
  showModal.mockClear()
  close.mockClear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  for (const [key, descriptor] of [
    ['showModal', nativeShowModal],
    ['close', nativeClose],
  ] as const) {
    if (descriptor)
      Object.defineProperty(HTMLDialogElement.prototype, key, descriptor)
    else
      delete (
        HTMLDialogElement.prototype as unknown as Record<string, unknown>
      )[key]
  }
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
    expect(showModal).not.toHaveBeenCalled()
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
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(document.activeElement?.closest('dialog')).not.toBeNull()
    await render(true, 'Updated editor')
    expect(showModal).toHaveBeenCalledTimes(1)
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
    expect(close).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})

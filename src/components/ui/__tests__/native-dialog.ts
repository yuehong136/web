import { vi } from 'vitest'

/** JSDOM has no top layer: stub its API, while browser tests verify native Tab isolation. */
export function stubNativeDialog() {
  const prototype = HTMLDialogElement.prototype
  const originalShow = Object.getOwnPropertyDescriptor(prototype, 'showModal')
  const originalClose = Object.getOwnPropertyDescriptor(prototype, 'close')
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  const close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
  Object.defineProperties(prototype, {
    showModal: { configurable: true, value: showModal },
    close: { configurable: true, value: close },
  })
  return {
    showModal,
    close,
    restore: () => {
      for (const [name, descriptor] of [
        ['showModal', originalShow],
        ['close', originalClose],
      ] as const) {
        if (descriptor) Object.defineProperty(prototype, name, descriptor)
        else delete (prototype as unknown as Record<string, unknown>)[name]
      }
    },
  }
}

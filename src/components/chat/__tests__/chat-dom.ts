import { vi } from 'vitest'

/** Missing browser observers only; Sender/input events remain the real implementation. */
export const stubChatDOM = () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
}

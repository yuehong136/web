import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

/** One React root per test file; call `cleanup` in afterEach. */
export function createReactHarness() {
  let root: Root | undefined
  return {
    async render(ui: ReactNode) {
      if (!root) {
        const container = document.createElement('div')
        document.body.append(container)
        root = createRoot(container)
      }
      await act(async () => root?.render(ui))
    },
    async cleanup() {
      await act(async () => root?.unmount())
      root = undefined
      document.body.innerHTML = ''
    },
  }
}

/** Dispatch a keydown and let Radix's focus timers run. */
export async function press(key: string, target = document.activeElement) {
  await act(async () => {
    target?.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

export const byRole = (role: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[role="${role}"]`))

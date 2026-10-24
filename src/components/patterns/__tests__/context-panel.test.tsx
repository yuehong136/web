import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ContextPanel } from '../context-panel'
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
it('labels the panel from its heading and exposes an explicitly named close action', async () => {
  const close = vi.fn()
  await act(async () =>
    root.render(
      <ContextPanel
        title="Sources"
        description="3 references"
        onClose={close}
        closeLabel="Close sources"
        footer={<button>Open source</button>}
      >
        <p>Evidence</p>
      </ContextPanel>,
    ),
  )
  const panel = container.querySelector('aside')!
  expect(panel.getAttribute('aria-labelledby')).toBe(
    container.querySelector('h2')?.id,
  )
  expect(container.textContent).toContain('3 references')
  act(() =>
    container
      .querySelector<HTMLButtonElement>('button[aria-label="Close sources"]')!
      .click(),
  )
  expect(close).toHaveBeenCalledOnce()
  expect(container.querySelector('footer')?.textContent).toBe('Open source')
})
function StatefulContent() {
  const [count, setCount] = React.useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
it('preserves detail state while the panel title, width and actions change', async () => {
  await act(async () =>
    root.render(
      <ContextPanel title="Source" width="sm">
        <StatefulContent />
      </ContextPanel>,
    ),
  )
  act(() => container.querySelector('button')!.click())
  await act(async () =>
    root.render(
      <ContextPanel
        title="Source details"
        width="lg"
        actions={<span>Ready</span>}
      >
        <StatefulContent />
      </ContextPanel>,
    ),
  )
  expect(
    container.querySelector('[data-context-panel-body] button')?.textContent,
  ).toBe('1')
  expect(container.querySelector('h2')?.textContent).toBe('Source details')
})

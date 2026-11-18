import * as React from 'react'
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createPortal } from 'react-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ScopedTheme, useThemeScope } from '../scoped-theme'
import { DEFAULT_APPEARANCE, setAppearance } from '../appearance'
import { useIsDarkTheme } from '../use-appearance'
import { getTokenValue } from '@/lib/design-tokens'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: false }),
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  setAppearance({ ...DEFAULT_APPEARANCE, mode: 'light' })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  localStorage.clear()
  vi.unstubAllGlobals()
})
function ScopeProbe() {
  const scope = useThemeScope()
  return scope?.container
    ? createPortal(
        <output>
          {scope.appearance.preset}/{scope.appearance.resolvedMode}
        </output>,
        scope.container,
      )
    : null
}
it('provides a scoped portal container with all appearance dimensions', async () => {
  await act(async () =>
    root.render(
      <ScopedTheme
        theme="dark"
        preset="celadon"
        density="compact"
        textScale={1.25}
        motion="reduced"
      >
        <ScopeProbe />
      </ScopedTheme>,
    ),
  )
  const scope = container.querySelector(
    '[data-preset="celadon"]',
  ) as HTMLDivElement
  expect(scope.dataset).toMatchObject({
    theme: 'dark',
    density: 'compact',
    textScale: '1.25',
    motion: 'reduced',
  })
  expect(scope.querySelector('output')?.textContent).toBe('celadon/dark')
  expect(document.documentElement.dataset).toMatchObject({
    theme: 'light',
    preset: 'ink',
  })
})
function StatefulProbe() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
it('changes a local preview without resetting child state or global preferences', async () => {
  await act(async () =>
    root.render(
      <ScopedTheme preset="clay">
        <StatefulProbe />
      </ScopedTheme>,
    ),
  )
  act(() => container.querySelector('button')?.click())
  await act(async () =>
    root.render(
      <ScopedTheme preset="iris">
        <StatefulProbe />
      </ScopedTheme>,
    ),
  )
  expect(container.querySelector('button')?.textContent).toBe('1')
  expect(container.querySelector('[data-preset="iris"]')).not.toBeNull()
  expect(document.documentElement.dataset.preset).toBe('ink')
})
it('lets a scope follow system motion independently of the global reduced preference', async () => {
  setAppearance({ motion: 'reduced' })
  await act(async () =>
    root.render(
      <ScopedTheme motion="system">
        <ScopeProbe />
      </ScopedTheme>,
    ),
  )
  expect(container.querySelector('[data-motion="system"]')).not.toBeNull()
  expect(document.documentElement.dataset.motion).toBe('reduced')
})
function LegacyCanvasProbe() {
  const dark = useIsDarkTheme()
  return (
    <output>{getTokenValue('accent-solid', dark ? 'dark' : 'light')}</output>
  )
}
it('updates legacy static token readers when only the preset changes', async () => {
  await act(async () => root.render(<LegacyCanvasProbe />))
  const oldColor = container.textContent
  await act(async () => setAppearance({ preset: 'celadon' }))
  expect(container.textContent).not.toBe(oldColor)
  expect(container.textContent).toBe(
    getTokenValue('accent-solid', 'light', 'celadon'),
  )
})

it('resets inherited text colour to the scope, not the page theme', async () => {
  await act(async () =>
    root.render(
      <ScopedTheme theme="dark">
        <p>Plain text</p>
      </ScopedTheme>,
    ),
  )
  const scope = container.querySelector<HTMLElement>('[data-theme="dark"]')!
  // Plain text (e.g. an agent's opening line) inherits this, so it follows
  // the scope even when the page around it uses the other theme.
  expect(scope.style.color).toBe('var(--color-fg)')
})

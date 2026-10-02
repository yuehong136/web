// @vitest-environment jsdom
import React, { act, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useNearestPortalTheme, useActivePortalTheme } from '../portal-theme'
import { setTheme, Theme, useIsDarkTheme } from '@/themes'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), {
      matches: false,
      media: '(prefers-color-scheme: dark)',
    }),
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  localStorage.removeItem('theme')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  localStorage.removeItem('theme')
  document.documentElement.setAttribute('data-theme', 'light')
  vi.unstubAllGlobals()
})
function NearestProbe({ theme }: { theme: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const nearest = useNearestPortalTheme(ref, true)
  return (
    <>
      <div data-theme={theme}>
        <button ref={ref}>trigger</button>
      </div>
      <output>{nearest}</output>
    </>
  )
}
it('tracks the nearest scoped theme at mount and while an existing popup stays open', async () => {
  await act(async () => root.render(<NearestProbe theme="dark" />))
  expect(container.querySelector('output')?.textContent).toBe('dark')
  await act(async () => root.render(<NearestProbe theme="light" />))
  expect(container.querySelector('output')?.textContent).toBe('light')
})
function ActiveProbe() {
  const theme = useActivePortalTheme(true)
  return (
    <>
      <div data-theme="dark">
        <button>scoped target</button>
      </div>
      <output>{theme || 'global'}</output>
    </>
  )
}
it('updates the active portal theme from focused content without copying global html scope', async () => {
  await act(async () => root.render(<ActiveProbe />))
  act(() => container.querySelector('button')?.focus())
  expect(container.querySelector('output')?.textContent).toBe('dark')
  await act(async () =>
    container.querySelector('div')?.setAttribute('data-theme', 'light'),
  )
  expect(container.querySelector('output')?.textContent).toBe('light')
})
function ThemeProbe() {
  const dark = useIsDarkTheme()
  return <output>{String(dark)}</output>
}
it('subscribes to theme preference updates from another control', async () => {
  await act(async () => root.render(<ThemeProbe />))
  await act(async () => setTheme(Theme.DARK))
  expect(container.textContent).toBe('true')
  await act(async () => setTheme(Theme.LIGHT))
  expect(container.textContent).toBe('false')
})

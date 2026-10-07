// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { useShallow } from 'zustand/react/shallow'
import { DesktopActivity, useUIStore } from '@/stores/ui'

const initialState = useUIStore.getState()

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  useUIStore.setState(initialState, true)
  localStorage.clear()
})

afterEach(() => {
  useUIStore.setState(initialState, true)
  localStorage.clear()
})

const persistedKeys = [
  'contextSidebarCollapsed',
  'desktopActivity',
  'desktopSidebarCollapsed',
  'desktopSidebarWidth',
  'language',
  'sidebarCollapsed',
]

it('persists only the layout and language preferences', () => {
  const state = useUIStore.getState()
  state.setContextSidebarCollapsed(true)
  state.setDesktopSidebarWidth(25)

  const saved = JSON.parse(localStorage.getItem('ui-storage') ?? '{}')
  expect(saved.version).toBe(2)
  expect(saved.state.contextSidebarCollapsed).toBe(true)
  expect(saved.state.desktopSidebarWidth).toBe(25)
  expect(Object.keys(saved.state).sort()).toEqual(persistedKeys)
})

it('migrates version 1 storage and drops the retired fields', async () => {
  localStorage.setItem(
    'ui-storage',
    JSON.stringify({
      state: {
        theme: 'dark',
        sidebarWidth: 280,
        sidebarCollapsed: true,
        contextSidebarCollapsed: true,
        modals: { stale: true },
      },
      version: 1,
    }),
  )
  await useUIStore.persist.rehydrate()

  const state = useUIStore.getState() as unknown as Record<string, unknown>
  expect(state.sidebarCollapsed).toBe(true)
  expect(state.contextSidebarCollapsed).toBe(true)
  for (const retired of ['theme', 'sidebarWidth', 'modals', 'globalLoading'])
    expect(state).not.toHaveProperty(retired)

  useUIStore.getState().setDesktopActivity(DesktopActivity.TOOLS)
  const saved = JSON.parse(localStorage.getItem('ui-storage') ?? '{}')
  expect(saved.version).toBe(2)
  expect(Object.keys(saved.state).sort()).toEqual(persistedKeys)
})

it('rehydrates the page navigation preference and defaults legacy or invalid values', async () => {
  for (const preference of [true, undefined, 'true']) {
    localStorage.setItem(
      'ui-storage',
      JSON.stringify({
        state: { sidebarCollapsed: true, contextSidebarCollapsed: preference },
        version: 2,
      }),
    )
    await useUIStore.persist.rehydrate()
    expect(useUIStore.getState().contextSidebarCollapsed).toBe(
      preference === true,
    )
    expect(useUIStore.getState().sidebarCollapsed).toBe(true)
  }
})

it('keeps shallow selector snapshots stable across unrelated UI updates', async () => {
  let renders = 0
  const Probe = () => {
    const selected = useUIStore(
      useShallow((state) => ({ width: state.desktopSidebarWidth })),
    )
    renders += 1
    return <output>{selected.width}</output>
  }
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<Probe />))
    const initialRenders = renders
    await act(async () =>
      useUIStore.getState().setDesktopActivity(DesktopActivity.TOOLS),
    )
    expect(renders).toBe(initialRenders)
    await act(async () => useUIStore.getState().setDesktopSidebarWidth(25))
    expect(container.textContent).toBe('25')
    expect(renders).toBeGreaterThan(initialRenders)
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})

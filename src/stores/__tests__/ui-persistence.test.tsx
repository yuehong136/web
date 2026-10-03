// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/stores/ui'

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

it('persists layout preferences without transient dialogs, loading or notices', () => {
  const state = useUIStore.getState()
  state.setSidebarWidth(280)
  state.setContextSidebarCollapsed(true)
  state.openModal('transient-dialog')
  state.setGlobalLoading(true, 'transient-message')
  state.addNotification({ type: 'info', title: 'notice', message: 'transient' })

  const saved = JSON.parse(localStorage.getItem('ui-storage') ?? '{}')
  expect(saved.state.sidebarWidth).toBe(280)
  expect(saved.state.contextSidebarCollapsed).toBe(true)
  expect(Object.keys(saved.state).sort()).toEqual([
    'contextSidebarCollapsed',
    'desktopActivity',
    'desktopSidebarCollapsed',
    'desktopSidebarWidth',
    'language',
    'sidebarCollapsed',
    'sidebarWidth',
    'theme',
  ])
  expect(JSON.stringify(saved)).not.toContain('transient')
})

it('rehydrates the page navigation preference and defaults legacy or invalid values', async () => {
  for (const preference of [true, undefined, 'true']) {
    localStorage.setItem(
      'ui-storage',
      JSON.stringify({
        state: { sidebarCollapsed: true, contextSidebarCollapsed: preference },
        version: 1,
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
      useShallow((state) => ({ width: state.sidebarWidth })),
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
    await act(async () => useUIStore.getState().setGlobalLoading(true))
    expect(renders).toBe(initialRenders)
    await act(async () => useUIStore.getState().setSidebarWidth(280))
    expect(container.textContent).toBe('280')
    expect(renders).toBeGreaterThan(initialRenders)
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})

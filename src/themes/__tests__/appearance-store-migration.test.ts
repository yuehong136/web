import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

it('preserves a legacy UI-only mode when store hydration precedes application mount', async () => {
  vi.resetModules()
  localStorage.clear()
  localStorage.setItem(
    'ui-storage',
    JSON.stringify({
      version: 1,
      state: { theme: 'dark', language: 'zh-CN' },
    }),
  )
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: false }),
  )
  const { useUIStore } = await import('@/stores/ui')
  const appearance = await import('../appearance')
  const snapshot = appearance.getAppearance()
  expect(snapshot.mode).toBe('dark')
  expect(useUIStore.getState().theme).toBe('dark')
  expect(
    JSON.parse(localStorage.getItem('ui-storage')!).state,
  ).not.toHaveProperty('theme')
  const cleanup = appearance.initTheme()
  try {
    expect(appearance.getAppearance()).toBe(snapshot)
    expect(appearance.getResolvedAppearance().resolvedMode).toBe('dark')
    expect(useUIStore.getState().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('appearance')!).mode).toBe('dark')
  } finally {
    cleanup()
  }
})

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

type AppearanceModule = typeof import('../appearance')
let appearance: AppearanceModule
let cleanup: (() => void) | undefined
class PreferenceMedia extends EventTarget {
  matches = false
  override addEventListener = vi.fn(super.addEventListener.bind(this))
  override removeEventListener = vi.fn(super.removeEventListener.bind(this))
  change(matches: boolean) {
    this.matches = matches
    this.dispatchEvent(new Event('change'))
  }
}
let color: PreferenceMedia
let motion: PreferenceMedia
beforeEach(async () => {
  vi.resetModules()
  localStorage.clear()
  color = new PreferenceMedia()
  motion = new PreferenceMedia()
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('color-scheme') ? color : motion,
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  appearance = await import('../appearance')
})
afterEach(() => {
  cleanup?.()
  cleanup = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('keeps the preference and resolved snapshots stable until their values change', () => {
  const previous = appearance.getAppearance()
  const resolved = appearance.getResolvedAppearance()
  expect(appearance.getAppearance()).toBe(previous)
  expect(appearance.getResolvedAppearance()).toBe(resolved)
  const listener = vi.fn()
  cleanup = appearance.subscribeAppearance(listener)
  appearance.setAppearance({ preset: 'paper' })
  expect(listener).toHaveBeenCalledTimes(1)
  expect(appearance.getAppearance()).not.toBe(previous)
  expect(appearance.getResolvedAppearance().resolvedMode).toBe('light')
  expect(appearance.getResolvedAppearance().preset).toBe('paper')
  const next = appearance.getAppearance()
  appearance.setAppearance({ preset: 'paper' })
  expect(appearance.getAppearance()).toBe(next)
  expect(listener).toHaveBeenCalledTimes(1)
})

it('detaches system color changes in manual mode and reattaches when returning to system', () => {
  cleanup = appearance.initTheme()
  expect(color.addEventListener).toHaveBeenCalledTimes(1)
  appearance.setTheme(appearance.Theme.DARK)
  expect(color.removeEventListener).toHaveBeenCalledTimes(1)
  color.change(false)
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(appearance.getResolvedTheme()).toBe('dark')
  appearance.setTheme(appearance.Theme.SYSTEM)
  expect(color.addEventListener).toHaveBeenCalledTimes(2)
  expect(document.documentElement.dataset.theme).toBe('light')
  color.change(true)
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(appearance.getTheme()).toBe('system')
  expect(localStorage.getItem('theme')).toBeNull()
})

it('shares a single media subscription across repeated initialization and cleans up once', () => {
  const first = appearance.initTheme()
  const second = appearance.initTheme()
  expect(color.addEventListener).toHaveBeenCalledTimes(1)
  first()
  first()
  expect(color.removeEventListener).not.toHaveBeenCalled()
  second()
  expect(color.removeEventListener).toHaveBeenCalledTimes(1)
})

it('applies and persists independent dimensions without losing the chosen mode', () => {
  appearance.setAppearance({
    mode: 'dark',
    preset: 'ocean',
    density: 'compact',
    textScale: 1.25,
    motion: 'reduced',
  })
  expect(appearance.getAppearance()).toEqual({
    mode: 'dark',
    preset: 'ocean',
    density: 'compact',
    textScale: 1.25,
    motion: 'reduced',
  })
  expect(JSON.parse(localStorage.getItem('appearance')!)).toEqual(
    appearance.getAppearance(),
  )
  expect(document.documentElement.dataset).toMatchObject({
    theme: 'dark',
    preset: 'ocean',
    density: 'compact',
    textScale: '1.25',
    motion: 'reduced',
  })
  appearance.setTheme(appearance.Theme.LIGHT)
  expect(appearance.getAppearance().preset).toBe('ocean')
})

it('follows reduced motion and removes the media listener for an explicit reduced preference', () => {
  cleanup = appearance.initTheme()
  motion.change(true)
  expect(appearance.getResolvedAppearance().reducedMotion).toBe(true)
  expect(document.documentElement.dataset.motion).toBe('reduced')
  appearance.setAppearance({ motion: 'reduced' })
  expect(motion.removeEventListener).toHaveBeenCalledTimes(1)
  motion.change(false)
  expect(appearance.getResolvedAppearance().reducedMotion).toBe(true)
  appearance.setAppearance({ motion: 'system' })
  expect(document.documentElement.dataset.motion).toBe('system')
})

it('uses persisted appearance ahead of both legacy preferences', () => {
  localStorage.setItem(
    'appearance',
    JSON.stringify({ preset: 'ocean', mode: 'light' }),
  )
  localStorage.setItem('theme', 'dark')
  localStorage.setItem(
    'ui-storage',
    JSON.stringify({ state: { theme: 'dark' } }),
  )
  cleanup = appearance.initTheme()
  expect(appearance.getAppearance()).toEqual({
    ...appearance.DEFAULT_APPEARANCE,
    preset: 'ocean',
    mode: 'light',
  })
})

it('migrates the legacy theme key, then the old UI store, without retaining invalid values', () => {
  localStorage.setItem('appearance', '{broken')
  localStorage.setItem('theme', 'dark')
  cleanup = appearance.initTheme()
  expect(appearance.getTheme()).toBe('dark')
  expect(JSON.parse(localStorage.getItem('appearance')!).mode).toBe('dark')
  localStorage.removeItem('appearance')
  localStorage.removeItem('theme')
  localStorage.setItem(
    'ui-storage',
    JSON.stringify({ state: { theme: 'light' } }),
  )
  window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }))
  expect(appearance.getTheme()).toBe('light')
  expect(
    appearance.normalizeAppearance({
      preset: 'unknown',
      mode: 'bad',
      density: 'tiny',
      textScale: NaN,
      motion: 'off',
    }),
  ).toEqual(appearance.DEFAULT_APPEARANCE)
})

it('publishes preference changes from another tab and keeps the resolved mode coherent', () => {
  const listener = vi.fn()
  cleanup = appearance.subscribeAppearance(listener)
  localStorage.setItem(
    'appearance',
    JSON.stringify({ preset: 'graphite', mode: 'dark' }),
  )
  window.dispatchEvent(new StorageEvent('storage', { key: 'appearance' }))
  expect(listener).toHaveBeenCalledTimes(1)
  expect(appearance.getResolvedAppearance()).toMatchObject({
    preset: 'graphite',
    resolvedMode: 'dark',
  })
  expect(document.documentElement.dataset.preset).toBe('graphite')
})

it('can initialize and apply preferences when browser storage is denied', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Denied', 'SecurityError')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Denied', 'SecurityError')
  })
  cleanup = appearance.initTheme()
  expect(appearance.getAppearance()).toEqual(appearance.DEFAULT_APPEARANCE)
  expect(() =>
    appearance.setAppearance({ preset: 'paper', mode: 'dark' }),
  ).not.toThrow()
  expect(document.documentElement.dataset).toMatchObject({
    preset: 'paper',
    theme: 'dark',
  })
})

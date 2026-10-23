/** Persisted appearance preferences. Each dimension changes independently. */
export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const
export type Theme = (typeof Theme)[keyof typeof Theme]
export type ResolvedTheme = 'light' | 'dark'
export const APPEARANCE_PRESETS = [
  'studio',
  'paper',
  'graphite',
  'ocean',
] as const
export type AppearancePreset = (typeof APPEARANCE_PRESETS)[number]
export type AppearanceDensity = 'comfortable' | 'compact'
export type AppearanceTextScale = 1 | 1.125 | 1.25
export type AppearanceMotion = 'system' | 'reduced'
export interface Appearance {
  preset: AppearancePreset
  mode: Theme
  density: AppearanceDensity
  textScale: AppearanceTextScale
  motion: AppearanceMotion
}
export interface ResolvedAppearance extends Appearance {
  resolvedMode: ResolvedTheme
  reducedMotion: boolean
}
export const APPEARANCE_STORAGE_KEY = 'appearance'
export const DEFAULT_APPEARANCE: Readonly<Appearance> = Object.freeze({
  preset: 'studio',
  mode: 'system',
  density: 'comfortable',
  textScale: 1,
  motion: 'system',
})

export function normalizeAppearance(
  value: unknown,
  legacyTheme?: unknown,
): Appearance {
  const source =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const mode = source.mode ?? legacyTheme
  return {
    preset: APPEARANCE_PRESETS.includes(source.preset as AppearancePreset)
      ? (source.preset as AppearancePreset)
      : DEFAULT_APPEARANCE.preset,
    mode: mode === 'light' || mode === 'dark' ? mode : 'system',
    density: source.density === 'compact' ? 'compact' : 'comfortable',
    textScale:
      source.textScale === 1.125 || source.textScale === 1.25
        ? source.textScale
        : 1,
    motion: source.motion === 'reduced' ? 'reduced' : 'system',
  }
}

function readStoredAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY)
    if (stored) {
      try {
        return normalizeAppearance(JSON.parse(stored))
      } catch {
        /* Read legacy preferences below. */
      }
    }
    const theme = localStorage.getItem('theme')
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return normalizeAppearance(undefined, theme)
    }
    const legacy = localStorage.getItem('ui-storage')
    if (legacy) {
      return normalizeAppearance(undefined, JSON.parse(legacy)?.state?.theme)
    }
  } catch {
    /* Storage can be unavailable in embedded/private browsing contexts. */
  }
  return { ...DEFAULT_APPEARANCE }
}

const listeners = new Set<() => void>()
let appearance: Readonly<Appearance> | undefined
let resolved: Readonly<ResolvedAppearance> | undefined
let initializationCount = 0
let storageConnected = false
let colorMedia: MediaQueryList | undefined
let motionMedia: MediaQueryList | undefined
let removeColorListener: (() => void) | undefined
let removeMotionListener: (() => void) | undefined

function queryMedia(query: string): MediaQueryList | undefined {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : undefined
}

export function resolveAppearance(
  preferences: Readonly<Appearance>,
  systemDark = queryMedia('(prefers-color-scheme: dark)')?.matches ?? false,
  systemReducedMotion = queryMedia('(prefers-reduced-motion: reduce)')
    ?.matches ?? false,
): Readonly<ResolvedAppearance> {
  return Object.freeze({
    ...preferences,
    resolvedMode:
      preferences.mode === 'system'
        ? systemDark
          ? 'dark'
          : 'light'
        : preferences.mode,
    reducedMotion: preferences.motion === 'reduced' || systemReducedMotion,
  })
}

/** Stable references are required by useSyncExternalStore. */
export function getAppearance(): Readonly<Appearance> {
  appearance ??= Object.freeze(readStoredAppearance())
  return appearance
}
export function getResolvedAppearance(): Readonly<ResolvedAppearance> {
  resolved ??= resolveAppearance(getAppearance())
  return resolved
}

function applyToDocument() {
  if (typeof document === 'undefined') return
  const current = getResolvedAppearance()
  const root = document.documentElement
  root.setAttribute('data-theme', current.resolvedMode)
  root.setAttribute('data-preset', current.preset)
  root.setAttribute('data-density', current.density)
  root.setAttribute('data-text-scale', String(current.textScale))
  root.setAttribute('data-motion', current.reducedMotion ? 'reduced' : 'system')
}

function publish(next: Readonly<Appearance>, persist: boolean) {
  const previous = getResolvedAppearance()
  const preferencesChanged = Object.keys(DEFAULT_APPEARANCE).some(
    (key) =>
      next[key as keyof Appearance] !==
      getAppearance()[key as keyof Appearance],
  )
  if (preferencesChanged) appearance = Object.freeze({ ...next })
  const candidate = resolveAppearance(getAppearance())
  const changed =
    preferencesChanged ||
    previous.resolvedMode !== candidate.resolvedMode ||
    previous.reducedMotion !== candidate.reducedMotion
  if (changed) resolved = candidate
  if (persist) {
    try {
      localStorage.setItem(
        APPEARANCE_STORAGE_KEY,
        JSON.stringify(getAppearance()),
      )
      // Keep consumers of the historic key compatible until they migrate.
      if (next.mode === 'system') localStorage.removeItem('theme')
      else localStorage.setItem('theme', next.mode)
    } catch {
      /* Applying preferences must continue when storage is blocked. */
    }
  }
  syncSubscriptions()
  applyToDocument()
  if (changed) listeners.forEach((listener) => listener())
}

export function setAppearance(patch: Partial<Appearance>): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-changing-theme', '')
  }
  publish(normalizeAppearance({ ...getAppearance(), ...patch }), true)
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.documentElement.removeAttribute('data-changing-theme'),
      ),
    )
  } else if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-changing-theme')
  }
}

function onSystemChange() {
  publish(getAppearance(), false)
}
function onStorage(event: StorageEvent) {
  if (
    event.key === null ||
    ['appearance', 'theme', 'ui-storage'].includes(event.key)
  ) {
    publish(readStoredAppearance(), false)
  }
}
function addMediaListener(media: MediaQueryList): () => void {
  media.addEventListener('change', onSystemChange)
  return () => media.removeEventListener('change', onSystemChange)
}
function syncSubscriptions() {
  if (typeof window === 'undefined') return
  const active = initializationCount > 0 || listeners.size > 0
  const current = getAppearance()
  if (active && !storageConnected) {
    window.addEventListener('storage', onStorage)
    storageConnected = true
  } else if (!active && storageConnected) {
    window.removeEventListener('storage', onStorage)
    storageConnected = false
  }
  if (active && current.mode === 'system') {
    colorMedia ??= queryMedia('(prefers-color-scheme: dark)')
    if (colorMedia && !removeColorListener)
      removeColorListener = addMediaListener(colorMedia)
  } else {
    removeColorListener?.()
    removeColorListener = undefined
    colorMedia = undefined
  }
  if (active && current.motion === 'system') {
    motionMedia ??= queryMedia('(prefers-reduced-motion: reduce)')
    if (motionMedia && !removeMotionListener)
      removeMotionListener = addMediaListener(motionMedia)
  } else {
    removeMotionListener?.()
    removeMotionListener = undefined
    motionMedia = undefined
  }
}

export function subscribeAppearance(listener: () => void): () => void {
  listeners.add(listener)
  syncSubscriptions()
  // The system may have changed while no consumer was mounted.
  publish(getAppearance(), false)
  return () => {
    listeners.delete(listener)
    syncSubscriptions()
  }
}

export function initTheme(): () => void {
  initializationCount += 1
  // The UI store can read the legacy mode, then migrate away its theme field
  // before React mounts. Keep that first snapshot authoritative on every mount.
  publish(getAppearance(), true)
  let active = true
  return () => {
    if (!active) return
    active = false
    initializationCount -= 1
    syncSubscriptions()
  }
}
export const initAppearance = initTheme
export const setTheme = (mode: Theme) => setAppearance({ mode })
export const getTheme = (): Theme => getAppearance().mode
export const getResolvedTheme = (): ResolvedTheme =>
  getResolvedAppearance().resolvedMode
export const subscribeTheme = subscribeAppearance

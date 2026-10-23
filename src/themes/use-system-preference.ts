import { useCallback, useSyncExternalStore } from 'react'

/** Scoped preferences can follow the OS even when the application uses a manual override. */
export function useSystemPreference(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const media = window.matchMedia(query)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    },
    [query],
  )
  const read = useCallback(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
    [query],
  )
  return useSyncExternalStore(subscribe, read, () => false)
}

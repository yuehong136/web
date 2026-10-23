import { useCallback, useSyncExternalStore } from 'react'

function useMediaMatch(query: string) {
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
function subscribeHeight(listener: () => void) {
  window.addEventListener('resize', listener)
  window.visualViewport?.addEventListener('resize', listener)
  return () => {
    window.removeEventListener('resize', listener)
    window.visualViewport?.removeEventListener('resize', listener)
  }
}
function readHeight() {
  if (typeof window === 'undefined') return 0
  const visual = window.visualViewport
  // Pinch zoom must remain available; only use the keyboard-sized visual viewport at normal scale.
  return Math.round(
    visual && visual.scale === 1
      ? Math.min(window.innerHeight, visual.height)
      : window.innerHeight,
  )
}

/** Layout responds to available task space without rewriting persisted navigation preferences. */
export function useWorkbenchViewport() {
  const desktop = useMediaMatch('(min-width: 48rem)')
  const wide = useMediaMatch('(min-width: 64rem)')
  const height = useSyncExternalStore(subscribeHeight, readHeight, () => 0)
  return { desktop, wide, height }
}

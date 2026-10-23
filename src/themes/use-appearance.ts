import { useSyncExternalStore } from 'react'
import {
  DEFAULT_APPEARANCE,
  getAppearance,
  getResolvedAppearance,
  resolveAppearance,
  subscribeAppearance,
} from './appearance'

const SERVER_APPEARANCE = resolveAppearance(DEFAULT_APPEARANCE, false, false)
export const useAppearance = () =>
  useSyncExternalStore(
    subscribeAppearance,
    getAppearance,
    () => DEFAULT_APPEARANCE,
  )
export const useResolvedAppearance = () =>
  useSyncExternalStore(
    subscribeAppearance,
    getResolvedAppearance,
    () => SERVER_APPEARANCE,
  )

// Subscribe to the complete snapshot so legacy canvas consumers also redraw on a preset change.
export const useIsDarkTheme = (): boolean =>
  useResolvedAppearance().resolvedMode === 'dark'

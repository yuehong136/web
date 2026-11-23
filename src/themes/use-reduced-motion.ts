import { useResolvedAppearance } from './use-appearance'
import { useThemeScope } from './scoped-theme'

/**
 * The app's reduced-motion decision: the "Reduce motion" appearance setting
 * or the system preference, including a ScopedTheme override. JS-driven
 * motion (springs, typing, smooth scrolling) reads this instead of querying
 * `prefers-reduced-motion` itself, which would miss the in-app setting.
 */
export function useReducedMotionPreference(): boolean {
  const global = useResolvedAppearance()
  const scope = useThemeScope()
  return (scope?.appearance ?? global).reducedMotion
}

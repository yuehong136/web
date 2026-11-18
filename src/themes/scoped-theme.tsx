import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  normalizeAppearance,
  resolveAppearance,
  type Appearance,
  type ResolvedAppearance,
} from './appearance'
import { useResolvedAppearance } from './use-appearance'
import { useSystemPreference } from './use-system-preference'

export type ScopedThemeValue = 'light' | 'dark'
export function resolveScopedTheme(
  value?: string | null,
): ScopedThemeValue | undefined {
  return value === 'light' || value === 'dark' ? value : undefined
}
export interface ThemeScope {
  container: HTMLElement | null
  appearance: Readonly<ResolvedAppearance>
}
const ThemeScopeContext = createContext<ThemeScope | null>(null)
/** Portal wrappers use this container to retain all scoped CSS variables. */
export const useThemeScope = () => useContext(ThemeScopeContext)

interface ScopedThemeProps extends Partial<Omit<Appearance, 'mode'>> {
  theme?: string | null
  children: ReactNode
  className?: string
}
export function ScopedTheme({
  theme,
  preset,
  density,
  textScale,
  motion,
  contrast,
  action,
  children,
  className,
}: ScopedThemeProps) {
  const global = useResolvedAppearance()
  const systemDark = useSystemPreference('(prefers-color-scheme: dark)')
  const systemReducedMotion = useSystemPreference(
    '(prefers-reduced-motion: reduce)',
  )
  const parent = useThemeScope()
  const inherited = parent?.appearance ?? global
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const appearance = useMemo(
    () =>
      resolveAppearance(
        normalizeAppearance({
          ...inherited,
          mode: resolveScopedTheme(theme) ?? inherited.mode,
          preset: preset ?? inherited.preset,
          density: density ?? inherited.density,
          textScale: textScale ?? inherited.textScale,
          motion: motion ?? inherited.motion,
          contrast: contrast ?? inherited.contrast,
          action: action ?? inherited.action,
        }),
        systemDark,
        systemReducedMotion,
      ),
    [
      inherited,
      theme,
      preset,
      density,
      textScale,
      motion,
      contrast,
      action,
      systemDark,
      systemReducedMotion,
    ],
  )
  const scope = useMemo(
    () => ({ container, appearance }),
    [container, appearance],
  )
  return (
    <div
      ref={setContainer}
      data-theme={appearance.resolvedMode}
      data-preset={appearance.preset}
      data-density={appearance.density}
      data-text-scale={appearance.textScale}
      data-motion={appearance.reducedMotion ? 'reduced' : 'system'}
      data-contrast={appearance.contrast}
      data-action={appearance.action}
      className={className ?? 'contents'}
      // Inherited text takes this scope's colour, not the page theme's.
      style={{ color: 'var(--color-fg)' }}
    >
      <ThemeScopeContext.Provider value={scope}>
        {children}
      </ThemeScopeContext.Provider>
    </div>
  )
}

/** Public theme and appearance API. */
export { cssVariables, defaultTokens } from './tokens'
export { tailwindColors } from './tailwind-vars'
export type { DesignTokens } from './tokens'
export { ScopedTheme, resolveScopedTheme, useThemeScope } from './scoped-theme'
export type { ScopedThemeValue, ThemeScope } from './scoped-theme'
export * from './appearance'
export {
  useAppearance,
  useResolvedAppearance,
  useIsDarkTheme,
} from './use-appearance'

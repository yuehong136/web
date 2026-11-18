/**
 * Theme generation entry: CSS for both modes and the typed JavaScript values,
 * all from the scheme seeds. `build-themes.ts` writes the results.
 */
import { generateThemeCSS } from './theme-css-generator'
import { generatePresetValuesModule } from './theme-artifact-generator'
import {
  ACTION_STYLES,
  COLOR_SCHEMES,
  CONTRAST_LEVELS,
  MODES,
  resolveTokens,
  schemeTokens,
  schemeTokenSets,
} from './theme-sets'
import { TOKEN_NAMES, type DesignTokens } from './tokens'

export { generateThemeCSS }

/** The default scheme's resolved values. */
export const lightTokens: DesignTokens = resolveTokens(
  schemeTokens('ink', 'light'),
)
export const darkTokens: DesignTokens = resolveTokens(
  schemeTokens('ink', 'dark'),
)

const COLOR =
  /^(#[\da-f]{6}|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, [\d.]+\)|transparent)$/i

/** Every token of every variant resolves to a usable color. */
export function validateTokens(tokens: DesignTokens): string[] {
  return TOKEN_NAMES.flatMap((name) => {
    const value = tokens[name]
    if (!value) return [`设计令牌 "${name}" 值不能为空`]
    return COLOR.test(value)
      ? []
      : [`设计令牌 "${name}" 的值 "${value}" 不是有效的颜色格式`]
  })
}

export function generateTokenValuesModule(): string {
  return generatePresetValuesModule(schemeTokenSets())
}

export function generateThemeFiles(): {
  light: string
  dark: string
  tokenValues: string
  errors: string[]
} {
  const errors: string[] = []
  for (const scheme of COLOR_SCHEMES)
    for (const mode of MODES)
      for (const contrast of CONTRAST_LEVELS)
        for (const action of ACTION_STYLES)
          errors.push(
            ...validateTokens(
              resolveTokens(schemeTokens(scheme, mode, contrast, action)),
            ).map(
              (error) => `${scheme}/${mode}/${contrast}/${action}: ${error}`,
            ),
          )
  return {
    light: generateThemeCSS('light'),
    dark: generateThemeCSS('dark'),
    tokenValues: generateTokenValuesModule(),
    errors,
  }
}

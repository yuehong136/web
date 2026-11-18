/**
 * Generated token sets per scheme, mode and appearance variant, plus the
 * resolved values that JavaScript consumers (canvas, charts, Monaco, Mermaid)
 * read. Those renderers do not all parse OKLCH, so they get hex / rgba.
 */
import {
  ACTION_STYLES,
  COLOR_SCHEMES,
  CONTRAST_LEVELS,
  SCHEME_SEEDS,
  type ActionStyle,
  type ColorScheme,
  type ContrastLevel,
  type SchemeSeed,
} from './color-schemes'
import type { Mode } from './color-scales'
import { jsColor } from './oklch'
import {
  buildSchemeTokens,
  SEMANTIC_TOKENS,
  type RoleValue,
  type SchemeTokens,
} from './semantic-tokens'
import type { DesignTokens } from './tokens'

export const MODES = ['light', 'dark'] as const satisfies readonly Mode[]
export { ACTION_STYLES, COLOR_SCHEMES, CONTRAST_LEVELS }

const cache = new Map<string, SchemeTokens>()

export function seedTokens(
  seed: SchemeSeed,
  mode: Mode,
  contrast: ContrastLevel = 'standard',
  action: ActionStyle = 'scheme',
): SchemeTokens {
  const key = JSON.stringify([seed, mode, contrast, action])
  let tokens = cache.get(key)
  if (!tokens) {
    tokens = buildSchemeTokens(seed, mode, { contrast, action })
    cache.set(key, tokens)
  }
  return tokens
}

export const schemeTokens = (
  scheme: ColorScheme,
  mode: Mode,
  contrast: ContrastLevel = 'standard',
  action: ActionStyle = 'scheme',
) => seedTokens(SCHEME_SEEDS[scheme], mode, contrast, action)

export const jsValue = (value: RoleValue) =>
  value.color === 'transparent' ? 'transparent' : jsColor(value.color)

/** Every semantic token resolved to a JavaScript color string. */
export function resolveTokens(tokens: SchemeTokens): DesignTokens {
  const values = {} as Record<string, string>
  for (const name of SEMANTIC_TOKENS) values[name] = jsValue(tokens.roles[name])
  return values as DesignTokens
}

export function schemeTokenSets(): Record<
  ColorScheme,
  Record<Mode, DesignTokens>
> {
  return Object.fromEntries(
    COLOR_SCHEMES.map((scheme) => [
      scheme,
      Object.fromEntries(
        MODES.map((mode) => [mode, resolveTokens(schemeTokens(scheme, mode))]),
      ),
    ]),
  ) as Record<ColorScheme, Record<Mode, DesignTokens>>
}

/**
 * Color scheme seeds. A scheme is five inputs — neutral tint, accent, AI hues,
 * the primary-action style and the surface paper — from which
 * `semantic-tokens.ts` generates every scale and role. Contrast is a separate
 * appearance dimension, so each scheme also has a high-contrast variant.
 */

export const COLOR_SCHEMES = [
  'ink',
  'mist',
  'celadon',
  'clay',
  'iris',
  'amber',
] as const
export type ColorScheme = (typeof COLOR_SCHEMES)[number]

export const CONTRAST_LEVELS = ['standard', 'high'] as const
export type ContrastLevel = (typeof CONTRAST_LEVELS)[number]

/** `scheme` keeps the scheme's own choice; the others override it. */
export const ACTION_STYLES = ['scheme', 'ink', 'accent'] as const
export type ActionStyle = (typeof ACTION_STYLES)[number]

export interface HueSeed {
  /** OKLCH hue in degrees. */
  h: number
  /** Peak chroma, reached at the solid steps 9–10. */
  c: number
  /** Preferred lightness of the solid step; the solver may move it for AA. */
  solid?: { light: number; dark: number }
  /** Label color on the solid step; hues 55–125 default to dark labels. */
  on?: 'white' | 'dark'
}

export const STATUS_INTENTS = ['success', 'warning', 'danger', 'info'] as const
export type StatusIntent = (typeof STATUS_INTENTS)[number]

export interface SchemeSeed {
  neutral: { h: number; c: number }
  accent: HueSeed
  /** Three gradient stops for AI moments; the middle one also seeds the AI scale. */
  ai: { hues: readonly [number, number, number]; c: number }
  /** Primary buttons: the neutral ink (gray 12) or the accent solid. */
  action: 'ink' | 'accent'
  /** Light-mode work surface: pure white or the tinted gray step 1. */
  surface: 'white' | 'tint'
  /** Status hues that would collide with the accent move per scheme. */
  status?: Partial<Record<StatusIntent, HueSeed>>
}

export const STATUS_SEEDS: Record<StatusIntent, HueSeed> = {
  success: { h: 150, c: 0.15, solid: { light: 0.56, dark: 0.6 } },
  warning: { h: 78, c: 0.16, on: 'dark' },
  danger: { h: 25, c: 0.19, solid: { light: 0.57, dark: 0.6 } },
  info: { h: 245, c: 0.15, solid: { light: 0.56, dark: 0.6 } },
}

export const SCHEME_SEEDS: Record<ColorScheme, SchemeSeed> = {
  // Neutral grays and an ink primary; indigo only marks selection, focus,
  // links and citations.
  ink: {
    neutral: { h: 265, c: 0.004 },
    accent: { h: 264, c: 0.2, solid: { light: 0.54, dark: 0.6 } },
    ai: { hues: [255, 290, 330], c: 0.17 },
    action: 'ink',
    surface: 'white',
  },
  // The previous Mist default, with a blue-gray instead of navy dark mode.
  mist: {
    neutral: { h: 240, c: 0.011 },
    accent: { h: 245, c: 0.13, solid: { light: 0.5, dark: 0.56 } },
    ai: { hues: [205, 240, 275], c: 0.15 },
    action: 'accent',
    surface: 'white',
  },
  celadon: {
    neutral: { h: 185, c: 0.007 },
    accent: { h: 190, c: 0.1, solid: { light: 0.5, dark: 0.56 } },
    ai: { hues: [160, 195, 235], c: 0.13 },
    action: 'accent',
    surface: 'white',
  },
  // Warm paper with a clay accent; danger moves redder to stay apart from it.
  clay: {
    neutral: { h: 70, c: 0.01 },
    accent: { h: 48, c: 0.13, solid: { light: 0.56, dark: 0.6 } },
    ai: { hues: [28, 52, 80], c: 0.15 },
    action: 'ink',
    surface: 'tint',
    status: { danger: { h: 20, c: 0.2, solid: { light: 0.55, dark: 0.6 } } },
  },
  iris: {
    neutral: { h: 290, c: 0.008 },
    accent: { h: 290, c: 0.19, solid: { light: 0.52, dark: 0.58 } },
    ai: { hues: [275, 315, 355], c: 0.18 },
    action: 'accent',
    surface: 'white',
  },
  // Graphite with an amber accent that takes dark labels; warning turns orange.
  amber: {
    neutral: { h: 250, c: 0.006 },
    accent: { h: 72, c: 0.155, on: 'dark', solid: { light: 0.79, dark: 0.8 } },
    ai: { hues: [48, 75, 100], c: 0.15 },
    action: 'ink',
    surface: 'white',
    status: {
      warning: {
        h: 52,
        c: 0.16,
        on: 'dark',
        solid: { light: 0.72, dark: 0.74 },
      },
    },
  },
}

/**
 * A brand scheme from user input: accent hue and chroma plus how much of the
 * accent hue tints the neutrals. The rest is derived the same way the built-in
 * schemes are, and the generator runs in the browser.
 */
export interface CustomSchemeSeed {
  accentHue: number
  accentChroma: number
  neutralChroma: number
}

export const CUSTOM_SEED_LIMITS = {
  accentChroma: [0.04, 0.22],
  neutralChroma: [0, 0.03],
} as const

export const DEFAULT_CUSTOM_SEED: Readonly<CustomSchemeSeed> = Object.freeze({
  accentHue: 160,
  accentChroma: 0.12,
  neutralChroma: 0.006,
})

const clampNumber = (
  value: unknown,
  [min, max]: readonly [number, number],
  fallback: number,
) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback

export function normalizeCustomSeed(value: unknown): CustomSchemeSeed {
  const source =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const hue = clampNumber(
    source.accentHue,
    [0, 360],
    DEFAULT_CUSTOM_SEED.accentHue,
  )
  return {
    accentHue: Math.round(hue) % 360,
    accentChroma:
      Math.round(
        clampNumber(
          source.accentChroma,
          CUSTOM_SEED_LIMITS.accentChroma,
          DEFAULT_CUSTOM_SEED.accentChroma,
        ) * 1000,
      ) / 1000,
    neutralChroma:
      Math.round(
        clampNumber(
          source.neutralChroma,
          CUSTOM_SEED_LIMITS.neutralChroma,
          DEFAULT_CUSTOM_SEED.neutralChroma,
        ) * 1000,
      ) / 1000,
  }
}

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

export function customSchemeSeed(custom: CustomSchemeSeed): SchemeSeed {
  const h = custom.accentHue
  // Status hues the accent would be mistaken for step 30° away from it.
  const status: Partial<Record<StatusIntent, HueSeed>> = {}
  for (const intent of STATUS_INTENTS) {
    const base = STATUS_SEEDS[intent]
    if (intent === 'info' || hueGap(base.h, h) >= 25) continue
    const away =
      ((base.h - h + 540) % 360) - 180 || (intent === 'danger' ? -1 : 1)
    status[intent] = { ...base, h: (h + Math.sign(away) * 30 + 360) % 360 }
  }
  return {
    neutral: { h, c: custom.neutralChroma },
    accent: { h, c: custom.accentChroma },
    ai: {
      hues: [(h + 325) % 360, h, (h + 35) % 360],
      c: Math.min(0.18, custom.accentChroma + 0.03),
    },
    action: 'accent',
    surface: 'white',
    status,
  }
}

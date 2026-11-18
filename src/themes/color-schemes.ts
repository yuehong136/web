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

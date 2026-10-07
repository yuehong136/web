/**
 * Status color system: one 12-step OKLCH scale per intent and theme, and the
 * semantic roles derived from it. Step numbering follows the Radix Colors
 * convention (1–2 app backgrounds, 3–5 component backgrounds, 6–8 borders,
 * 9–10 solid fills, 11–12 text). Steps 9–11 are solved for WCAG AA against the
 * product surfaces instead of being picked by hand.
 */
import {
  alphaFor,
  contrast,
  hexToRgb,
  oklchToRgb,
  over,
  rgba,
  rgbToHex,
  type Rgb,
} from './oklch'
import { interactionPalette } from './interaction-palette'
import { surfacePalette } from './surface-palette'
import {
  statusIntents,
  type StatusIntent,
  type StatusPalette,
  type StatusRoles,
} from './status-tokens'

type Theme = 'light' | 'dark'

interface IntentSpec {
  /** Hue at step 1 and step 12; the shift eases in toward the text steps. */
  hue: [number, number]
  /** Easing exponent for the hue shift (higher keeps fills on the start hue). */
  ease?: number
  chroma: number
  /** Solid fills carry white text unless the hue is too light (amber). */
  onSolid: 'white' | 'dark'
}

const intents: Record<StatusIntent, IntentSpec> = {
  success: { hue: [156, 160], chroma: 0.16, onSolid: 'white' },
  warning: { hue: [86, 58], ease: 6, chroma: 0.17, onSolid: 'dark' },
  error: { hue: [24, 27], chroma: 0.21, onSolid: 'white' },
  info: { hue: [244, 252], chroma: 0.17, onSolid: 'white' },
}

// Lightness and chroma weight per step; steps 9–11 are replaced by the solver.
// Dark component steps sit above the dark surfaces so tints stay light-on-dark.
const curves: Record<Theme, { L: number[]; C: number[] }> = {
  light: {
    L: [0.993, 0.982, 0.962, 0.94, 0.913, 0.88, 0.83, 0.765, 0, 0, 0, 0.33],
    C: [0.05, 0.09, 0.17, 0.25, 0.33, 0.42, 0.52, 0.66, 1, 1, 0.92, 0.56],
  },
  dark: {
    L: [0.2, 0.225, 0.29, 0.325, 0.36, 0.4, 0.455, 0.53, 0, 0, 0, 0.93],
    C: [0.08, 0.12, 0.28, 0.36, 0.43, 0.5, 0.58, 0.7, 1, 1, 0.74, 0.3],
  },
}

const white: Rgb = [255, 255, 255]
const rgbOf = (color: string): Rgb => hexToRgb(color)
const layer = (color: string, base: Rgb): Rgb => {
  const match = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(color)
  if (!match) return rgbOf(color)
  const rgb: Rgb = [+match[1], +match[2], +match[3]]
  return over(rgb, +match[4], base)
}

// Fills that status text meets in product UI: surfaces, the subtle fill,
// outline buttons at rest and on hover, row hover and selected rows. Status
// tints themselves sit on surfaces, the subtle fill and selected rows.
function fills(theme: Theme) {
  const s = surfacePalette[theme]
  const base = rgbOf(s.surface)
  const selected = layer(interactionPalette[theme].selectionTint, base)
  const surfaces = [rgbOf(s.body), rgbOf(s.canvas), base, rgbOf(s.subtle)]
  const controls =
    theme === 'light'
      ? [rgbOf('#f3f3f5'), rgbOf('#e9ebef'), rgbOf('#f3f4f6')]
      : [0.06, 0.1, 0.07].map((alpha) => over(white, alpha, base))
  return {
    text: [...surfaces, ...controls, selected],
    tint: [...surfaces, selected],
  }
}

const stepColor = (spec: IntentSpec, theme: Theme, step: number, L: number) => {
  const t = ((step - 1) / 11) ** (spec.ease ?? 3)
  const hue = spec.hue[0] + (spec.hue[1] - spec.hue[0]) * t
  return oklchToRgb(L, spec.chroma * curves[theme].C[step - 1], hue)
}

/** Walks lightness from `from` toward `to` and returns the first passing L. */
function solve(from: number, to: number, pass: (L: number) => boolean) {
  const step = from < to ? 0.002 : -0.002
  for (let L = from; from < to ? L <= to : L >= to; L += step)
    if (pass(L)) return L
  throw new Error(`No lightness in [${from}, ${to}] satisfies the constraint`)
}

const MIN_TEXT = 4.6

function buildScale(
  intent: StatusIntent,
  theme: Theme,
): { steps: string[]; roles: StatusRoles } {
  const spec = intents[intent]
  const L = [...curves[theme].L]
  const color = (step: number, lightness = L[step - 1]) =>
    stepColor(spec, theme, step, lightness)
  const surface = rgbOf(surfacePalette[theme].surface)

  // Solids: the brightest fill whose label still reaches AA at rest and on
  // hover (hover is darker in light, lighter in dark). Amber keeps a light
  // fill with the darkest step of its own scale as the label.
  const hoverShift = theme === 'light' ? -0.04 : 0.035
  const label =
    spec.onSolid === 'white' ? white : color(theme === 'light' ? 12 : 1)
  const solidPasses = (l: number) =>
    contrast(label, color(9, l)) >= MIN_TEXT &&
    contrast(label, color(10, l + hoverShift)) >= MIN_TEXT
  L[8] =
    spec.onSolid === 'white'
      ? solve(0.75, 0.3, solidPasses)
      : solve(0.86, 0.6, solidPasses)
  L[9] = L[8] + hoverShift

  // Tints are translucent so they read the same on neighbouring surfaces.
  const tint = (step: number) => alphaFor(color(step), surface)
  const { text, tint: tinted } = fills(theme)
  const backgrounds = [
    ...text,
    ...tinted.map((fill) => over(tint(3).rgb, tint(3).alpha, fill)),
    ...tinted.slice(0, 3).map((fill) => over(tint(4).rgb, tint(4).alpha, fill)),
  ]
  const textPasses = (l: number) =>
    backgrounds.every((bg) => contrast(color(11, l), bg) >= MIN_TEXT)
  // Light text takes the most vivid passing value; dark text is never dimmer
  // than a comfortable reading lightness.
  L[10] =
    theme === 'light'
      ? solve(0.72, 0.3, textPasses)
      : Math.max(solve(0.6, 0.97, textPasses), 0.78)

  const steps = L.map((_, i) => rgbToHex(color(i + 1)))
  return {
    steps,
    roles: {
      fg: steps[10],
      solid: steps[8],
      solidHover: steps[9],
      onSolid: rgbToHex(label),
      subtle: rgba(tint(3)),
      subtleHover: rgba(tint(4)),
      border: rgba(tint(7)),
    },
  }
}

function buildTheme(theme: Theme) {
  return Object.fromEntries(
    statusIntents.map((intent) => [intent, buildScale(intent, theme)]),
  ) as Record<StatusIntent, ReturnType<typeof buildScale>>
}

export const statusScales = {
  light: buildTheme('light'),
  dark: buildTheme('dark'),
}

/** Semantic status colors per theme, e.g. `statusPalette.light.error.fg`. */
export const statusPalette: Record<Theme, StatusPalette> = {
  light: Object.fromEntries(
    statusIntents.map((i) => [i, statusScales.light[i].roles]),
  ) as StatusPalette,
  dark: Object.fromEntries(
    statusIntents.map((i) => [i, statusScales.dark[i].roles]),
  ) as StatusPalette,
}

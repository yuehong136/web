/**
 * The semantic layer: every role a component may use, generated from a scheme
 * seed. Roles that equal a scale step keep that reference (`--scale-gray-2`),
 * so the generated CSS stays traceable and the high-contrast variant only
 * restates the steps and literals that actually change.
 */
import { contrast, oklch, rgbOf, withAlpha, type Oklch } from './oklch'
import {
  hueScale,
  neutralScale,
  solveLightness,
  WHITE,
  type Mode,
  type Scale,
} from './color-scales'
import {
  STATUS_INTENTS,
  STATUS_SEEDS,
  type ActionStyle,
  type ContrastLevel,
  type SchemeSeed,
} from './color-schemes'

const INTENTS = ['accent', 'ai', 'neutral', ...STATUS_INTENTS] as const
export type Intent = (typeof INTENTS)[number]
export const INTENT_ROLES = [
  'solid',
  'solid-hover',
  'on-solid',
  'fg',
  'soft',
  'soft-hover',
  'line',
] as const
type IntentRole = (typeof INTENT_ROLES)[number]

export const VIZ_COUNT = 10
export const AVATAR_TONE_COUNT = 8
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

/** Every semantic token, in the order the CSS lists them. */
export const SEMANTIC_TOKENS = [
  // Surfaces, back to front
  'canvas',
  'surface',
  'raised',
  'raised-hover',
  'overlay',
  'sunken',
  'inverse',
  'scrim',
  // Translucent interaction fills that work on any surface
  'fill-hover',
  'fill-pressed',
  'fill-selected',
  'fill-muted',
  // Text and icons
  'fg',
  'fg-muted',
  'fg-subtle',
  'fg-disabled',
  'fg-inverse',
  // Lines
  'line-subtle',
  'line',
  'line-strong',
  'line-focus',
  // Switch and slider thumbs
  'knob',
  // Primary action (ink or accent)
  'action-bg',
  'action-bg-hover',
  'action-fg',
  // Intent × role matrix
  ...INTENTS.flatMap((intent) =>
    INTENT_ROLES.map((role) => `${intent}-${role}` as const),
  ),
  // AI moments and AI-native content
  'ai-from',
  'ai-via',
  'ai-to',
  'ai-glow',
  'reasoning-fg',
  'reasoning-line',
  'tool-bg',
  'tool-line',
  'citation-bg',
  'citation-fg',
  'citation-bg-hover',
  'highlight-bg',
  'highlight-fg',
  'caret',
  'run-queued',
  'run-running',
  'run-succeeded',
  'run-failed',
  'run-cancelled',
  // Code
  'code-bg',
  'code-fg',
  'syntax-keyword',
  'syntax-function',
  'syntax-type',
  'syntax-string',
  'syntax-number',
  'syntax-comment',
  // Data visualization: stable categorical identities and the axis line
  ...range(VIZ_COUNT).map((n) => `viz-${n}` as const),
  'viz-axis',
  // Identity tones for avatars, knowledge bases, file kinds and providers
  ...range(AVATAR_TONE_COUNT).flatMap((n) => [
    `avatar-${n}-bg` as const,
    `avatar-${n}-fg` as const,
  ]),
] as const
export type SemanticToken = (typeof SEMANTIC_TOKENS)[number]

export const SCALE_NAMES = [
  'gray',
  'accent',
  'ai',
  'success',
  'warning',
  'danger',
  'info',
] as const
export type ScaleName = (typeof SCALE_NAMES)[number]

export interface RoleValue {
  color: Oklch | 'transparent'
  /** `scale-<name>-<step>` or another semantic token this role equals. */
  ref?: string
}

export interface SchemeTokens {
  scales: Record<ScaleName, readonly Oklch[]>
  roles: Record<SemanticToken, RoleValue>
  elevation: Record<'low' | 'medium' | 'high', string>
}

// Stable identities: the categorical ring and avatar hues do not follow the
// scheme, so a knowledge-graph entity or a teammate keeps its color.
const VIZ_HUES = [20, 200, 92, 272, 164, 344, 56, 236, 128, 308] as const
const VIZ_CURVE: Record<Mode, [number, number]> = {
  light: [0.6, 0.142],
  dark: [0.74, 0.123],
}
const AVATAR_HUES = [25, 70, 105, 150, 195, 245, 290, 335] as const
const AVATAR_CURVE = {
  light: { tint: [0.935, 0.05], from: 0.58, to: 0.2, chroma: 0.15 },
  dark: { tint: [0.33, 0.065], from: 0.7, to: 0.98, chroma: 0.12 },
} as const

function avatarTone(mode: Mode, hue: number) {
  const curve = AVATAR_CURVE[mode]
  const bg = oklch(curve.tint[0], curve.tint[1], hue)
  const step = curve.from < curve.to ? 0.005 : -0.005
  for (
    let L = curve.from;
    step > 0 ? L <= curve.to : L >= curve.to;
    L += step
  ) {
    const fg = oklch(L, curve.chroma, hue)
    if (contrast(rgbOf(fg), rgbOf(bg)) >= 4.6) return { bg, fg }
  }
  throw new Error(`No ${mode} identity foreground reaches AA for hue ${hue}`)
}

const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

export interface BuildOptions {
  contrast: ContrastLevel
  action: ActionStyle
}

export function buildSchemeTokens(
  seed: SchemeSeed,
  mode: Mode,
  { contrast: level, action }: BuildOptions,
): SchemeTokens {
  const light = mode === 'light'
  const high = level === 'high'
  const gray = neutralScale(seed.neutral, mode, high)
  const status = { ...STATUS_SEEDS, ...seed.status }
  const hues: Record<Exclude<ScaleName, 'gray'>, Scale> = {
    accent: hueScale(seed.accent, mode, high),
    ai: hueScale(
      { h: seed.ai.hues[1], c: seed.ai.c, solid: { light: 0.55, dark: 0.6 } },
      mode,
      high,
    ),
    success: hueScale(status.success, mode, high),
    warning: hueScale(status.warning, mode, high),
    danger: hueScale(status.danger, mode, high),
    info: hueScale(status.info, mode, high),
  }
  const scales = {
    gray,
    ...Object.fromEntries(
      Object.entries(hues).map(([name, scale]) => [name, scale.steps]),
    ),
  } as unknown as Record<ScaleName, readonly Oklch[]>

  const roles = {} as Record<SemanticToken, RoleValue>
  const step = (scale: ScaleName, n: number): RoleValue => ({
    color: scales[scale][n - 1],
    ref: `scale-${scale}-${n}`,
  })
  const same = (token: SemanticToken): RoleValue => ({
    color: roles[token].color,
    ref: token,
  })
  const literal = (color: Oklch): RoleValue => ({ color })
  const set = (token: SemanticToken, value: RoleValue) => {
    roles[token] = value
  }
  const colorOf = (token: SemanticToken) => roles[token].color as Oklch

  // Surfaces
  if (light) {
    set('canvas', step('gray', 2))
    set('surface', seed.surface === 'tint' ? step('gray', 1) : literal(WHITE))
    set('raised', same('surface'))
    set('raised-hover', step('gray', 2))
    set('overlay', same('surface'))
    set('sunken', step('gray', 2))
    set('scrim', literal(withAlpha(gray[11], 0.4)))
  } else {
    set('canvas', step('gray', 1))
    set('surface', step('gray', 2))
    set('raised', step('gray', 3))
    set('raised-hover', step('gray', 4))
    set('overlay', step('gray', 3))
    set('sunken', step('gray', 1))
    set('scrim', literal(oklch(0, 0, 0, 0.6)))
  }
  set('inverse', step('gray', 12))
  const surfaceRgb = rgbOf(colorOf('surface'))

  // Fills
  const fills = light ? [0.045, 0.08, 0.065, 0.055] : [0.06, 0.1, 0.085, 0.07]
  ;(
    ['fill-hover', 'fill-pressed', 'fill-selected', 'fill-muted'] as const
  ).forEach((token, i) => set(token, literal(withAlpha(gray[11], fills[i]))))

  // Text
  set('fg', step('gray', 12))
  set('fg-muted', step('gray', 11))
  set(
    'fg-subtle',
    literal(
      solveLightness(
        seed.neutral.h,
        seed.neutral.c * 1.4,
        rgbOf(gray[2]),
        high ? 6.5 : 4.6,
        mode,
      ),
    ),
  )
  set('fg-disabled', step('gray', 8))
  set('fg-inverse', step('gray', 1))

  // Lines: translucent ink, so they read the same on every surface.
  const lines = high ? [0.14, 0.24, 0.42] : [0.075, 0.12, 0.22]
  set('line-subtle', literal(withAlpha(gray[11], lines[0])))
  set('line', literal(withAlpha(gray[11], lines[1])))
  set('line-strong', literal(withAlpha(gray[11], lines[2])))
  // Non-text graphics need 3:1 on the surface; light accents fall back to text.
  const graphic = (scale: Exclude<ScaleName, 'gray'>) =>
    contrast(rgbOf(scales[scale][8]), surfaceRgb) >= 3
      ? step(scale, 9)
      : step(scale, 11)
  set('line-focus', graphic('accent'))
  set('knob', light ? literal(WHITE) : step('gray', 12))

  // Primary action
  const style = action === 'scheme' ? seed.action : action
  if (style === 'ink') {
    const ink = gray[11]
    set('action-bg', step('gray', 12))
    set(
      'action-bg-hover',
      literal(oklch(ink.l + (light ? 0.09 : -0.07), ink.c, ink.h)),
    )
    set('action-fg', light ? literal(WHITE) : step('gray', 1))
  } else {
    set('action-bg', step('accent', 9))
    set('action-bg-hover', step('accent', 10))
    set('action-fg', literal(hues.accent.on))
  }

  // Intent × role
  for (const intent of INTENTS) {
    if (intent === 'neutral') {
      const solid = oklch(
        light ? 0.46 : 0.82,
        seed.neutral.c * 1.4,
        seed.neutral.h,
      )
      const on =
        contrast(rgbOf(WHITE), rgbOf(solid)) >=
        contrast(rgbOf(gray[0]), rgbOf(solid))
          ? literal(WHITE)
          : step('gray', 1)
      set('neutral-solid', literal(solid))
      set(
        'neutral-solid-hover',
        literal(oklch(solid.l + (light ? -0.06 : 0.06), solid.c, solid.h)),
      )
      set('neutral-on-solid', on)
      set('neutral-fg', step('gray', 11))
      set('neutral-soft', step('gray', 3))
      set('neutral-soft-hover', step('gray', 4))
      set('neutral-line', step('gray', 6))
      continue
    }
    const scale = hues[intent]
    const values: Record<IntentRole, RoleValue> = {
      solid: step(intent, 9),
      'solid-hover': step(intent, 10),
      'on-solid': literal(scale.on),
      fg: step(intent, 11),
      soft: step(intent, 3),
      'soft-hover': step(intent, 4),
      line: step(intent, light ? 6 : 7),
    }
    for (const role of INTENT_ROLES) set(`${intent}-${role}`, values[role])
  }

  // AI moments
  const stopL = light ? 0.64 : 0.72
  set('ai-from', literal(oklch(stopL, seed.ai.c, seed.ai.hues[0])))
  set('ai-via', literal(oklch(stopL - 0.03, seed.ai.c, seed.ai.hues[1])))
  set('ai-to', literal(oklch(stopL, seed.ai.c, seed.ai.hues[2])))
  set('ai-glow', literal(withAlpha(scales.ai[8], light ? 0.14 : 0.22)))
  set('reasoning-fg', same('fg-muted'))
  set('reasoning-line', same('line'))
  set('tool-bg', same('sunken'))
  set('tool-line', same('line-subtle'))
  set('citation-bg', step('accent', 3))
  set('citation-fg', step('accent', 11))
  set('citation-bg-hover', step('accent', 4))
  set(
    'highlight-bg',
    literal(
      light
        ? oklch(high ? 0.9 : 0.93, high ? 0.15 : 0.12, 98)
        : oklch(0.43, 0.085, 95),
    ),
  )
  set('highlight-fg', same('fg'))
  set('caret', step('ai', 9))
  set(
    'run-queued',
    contrast(rgbOf(gray[9]), surfaceRgb) >= 3
      ? step('gray', 10)
      : step('gray', 11),
  )
  set('run-running', graphic('ai'))
  set('run-succeeded', graphic('success'))
  set('run-failed', graphic('danger'))
  set('run-cancelled', step('gray', 8))

  // Code: the keyword follows the accent, the rest keep apart from it.
  set('code-bg', same('sunken'))
  set('code-fg', step('gray', 12))
  const codeBg = rgbOf(colorOf('code-bg'))
  const syntaxTarget = high ? 7 : 4.6
  const keyword = seed.accent.h
  const used = [keyword]
  const pickHue = (base: number) => {
    for (const shift of [0, 35, -35, 70, -70, 105, -105, 140]) {
      const hue = (base + shift + 360) % 360
      if (used.every((other) => hueDistance(other, hue) >= 32)) {
        used.push(hue)
        return hue
      }
    }
    return base
  }
  set(
    'syntax-keyword',
    literal(
      solveLightness(
        keyword,
        Math.min(seed.accent.c, 0.17),
        codeBg,
        syntaxTarget,
        mode,
      ),
    ),
  )
  for (const [token, base] of [
    ['syntax-function', 230],
    ['syntax-type', 195],
    ['syntax-string', 145],
    ['syntax-number', 55],
  ] as const) {
    set(
      token,
      literal(solveLightness(pickHue(base), 0.14, codeBg, syntaxTarget, mode)),
    )
  }
  set('syntax-comment', same('fg-subtle'))

  // Data visualization
  const [vizL, vizC] = VIZ_CURVE[mode]
  VIZ_HUES.forEach((hue, i) =>
    set(`viz-${i + 1}` as SemanticToken, literal(oklch(vizL, vizC, hue))),
  )
  set('viz-axis', same('line'))

  // Identity
  AVATAR_HUES.forEach((hue, i) => {
    const tone = avatarTone(mode, hue)
    set(`avatar-${i + 1}-bg` as SemanticToken, literal(tone.bg))
    set(`avatar-${i + 1}-fg` as SemanticToken, literal(tone.fg))
  })

  // Elevation, tinted with the neutral hue
  const nh = Math.round(seed.neutral.h)
  const elevation = light
    ? {
        low: `0 1px 3px oklch(0.2 0.02 ${nh} / 0.05)`,
        medium: `0 12px 40px oklch(0.2 0.02 ${nh} / 0.12), 0 0 0 1px oklch(0.2 0.02 ${nh} / 0.05)`,
        high: `0 24px 80px oklch(0.2 0.02 ${nh} / 0.18)`,
      }
    : {
        low: 'inset 0 1px 0 oklch(1 0 0 / 0.04), 0 1px 3px oklch(0 0 0 / 0.24)',
        medium:
          '0 12px 40px oklch(0 0 0 / 0.36), 0 0 0 1px oklch(1 0 0 / 0.08)',
        high: 'inset 0 1px 0 oklch(1 0 0 / 0.06), 0 24px 80px oklch(0 0 0 / 0.45)',
      }

  const missing = SEMANTIC_TOKENS.filter((token) => !roles[token])
  if (missing.length) throw new Error(`Unassigned roles: ${missing.join(', ')}`)
  return { scales, roles, elevation }
}

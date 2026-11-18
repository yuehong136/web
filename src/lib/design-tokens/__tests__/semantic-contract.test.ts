import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACTION_STYLES,
  COLOR_SCHEMES,
  CONTRAST_LEVELS,
  customSchemeSeed,
} from '@/themes/color-schemes'
import { contrast, hexToRgb, over, type Rgb } from '@/themes/oklch'
import { VIZ_COUNT, AVATAR_TONE_COUNT } from '@/themes/semantic-tokens'
import { resolveTokens, schemeTokens, seedTokens } from '@/themes/theme-sets'
import type { DesignTokens, TokenName } from '@/themes/tokens'

// WCAG 2.2 AA: 4.5:1 for text, 3:1 for graphics and control boundaries.
// Every scheme × mode × contrast level × primary-action style must pass.

const INTENTS = [
  'accent',
  'ai',
  'neutral',
  'success',
  'warning',
  'danger',
  'info',
] as const

type Pair = readonly [fg: TokenName, bg: TokenName, min: number]

const TEXT_GROUNDS = [
  'surface',
  'canvas',
  'raised',
  'overlay',
  'sunken',
] as const

const PAIRS: Pair[] = [
  ...(['fg', 'fg-muted', 'fg-subtle'] as const).flatMap((fg) =>
    TEXT_GROUNDS.map((bg) => [fg, bg, 4.5] as const),
  ),
  ['fg', 'raised-hover', 4.5],
  ['fg-muted', 'raised-hover', 4.5],
  ['fg-inverse', 'inverse', 4.5],
  ['action-fg', 'action-bg', 4.5],
  ['action-fg', 'action-bg-hover', 4.5],
  ['citation-fg', 'citation-bg', 4.5],
  ['citation-fg', 'citation-bg-hover', 4.5],
  ['highlight-fg', 'highlight-bg', 4.5],
  ['diff-add-fg', 'diff-add-bg', 4.5],
  ['diff-del-fg', 'diff-del-bg', 4.5],
  ['reasoning-fg', 'surface', 4.5],
  ['code-fg', 'code-bg', 4.5],
  ['line-focus', 'surface', 3],
  ['line-focus', 'canvas', 3],
  ...INTENTS.flatMap((intent) => [
    [`${intent}-fg`, `${intent}-soft`, 4.5] as const,
    [`${intent}-fg`, `${intent}-soft-hover`, 4.5] as const,
    [`${intent}-fg`, 'surface', 4.5] as const,
    [`${intent}-on-solid`, `${intent}-solid`, 4.5] as const,
    [`${intent}-on-solid`, `${intent}-solid-hover`, 4.5] as const,
  ]),
  ...(
    ['keyword', 'function', 'type', 'string', 'number', 'comment'] as const
  ).map((kind) => [`syntax-${kind}`, 'code-bg', 4.5] as const),
  ...Array.from(
    { length: AVATAR_TONE_COUNT },
    (_, i) => [`avatar-${i + 1}-fg`, `avatar-${i + 1}-bg`, 4.5] as const,
  ),
  ...Array.from(
    { length: VIZ_COUNT },
    (_, i) => [`viz-${i + 1}`, 'surface', 3] as const,
  ),
  ...(['queued', 'running', 'waiting', 'succeeded', 'failed'] as const).map(
    (state) => [`run-${state}`, 'surface', 3] as const,
  ),
] as Pair[]

function parse(value: string): { rgb: Rgb; alpha: number } {
  if (value.startsWith('#')) return { rgb: hexToRgb(value), alpha: 1 }
  const match = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(value)
  if (!match) throw new Error(`Unexpected color ${value}`)
  return {
    rgb: [Number(match[1]), Number(match[2]), Number(match[3])],
    alpha: Number(match[4]),
  }
}

/** Translucent grounds sit on the work surface, as they do in the product. */
function ratio(values: DesignTokens, fg: TokenName, bg: TokenName) {
  const surface = parse(values.surface).rgb
  const ground = parse(values[bg])
  const groundRgb =
    ground.alpha < 1 ? over(ground.rgb, ground.alpha, surface) : ground.rgb
  const text = parse(values[fg])
  return contrast(
    text.alpha < 1 ? over(text.rgb, text.alpha, groundRgb) : text.rgb,
    groundRgb,
  )
}

for (const scheme of COLOR_SCHEMES)
  for (const mode of ['light', 'dark'] as const)
    test(`${scheme}/${mode}: every role pair meets WCAG 2.2 AA in all variants`, () => {
      const failures: string[] = []
      for (const level of CONTRAST_LEVELS)
        for (const action of ACTION_STYLES) {
          const values = resolveTokens(
            schemeTokens(scheme, mode, level, action),
          )
          for (const [fg, bg, min] of PAIRS) {
            const value = ratio(values, fg, bg)
            if (value < min)
              failures.push(
                `${level}/${action} ${fg} on ${bg}: ${value.toFixed(2)} < ${min}`,
              )
          }
        }
      assert.deepEqual(failures, [])
    })

test('high contrast raises text contrast over the standard level', () => {
  for (const scheme of COLOR_SCHEMES)
    for (const mode of ['light', 'dark'] as const) {
      const standard = resolveTokens(schemeTokens(scheme, mode))
      const high = resolveTokens(schemeTokens(scheme, mode, 'high'))
      for (const fg of ['fg-muted', 'fg-subtle', 'accent-fg'] as const)
        assert.ok(
          ratio(high, fg, 'surface') > ratio(standard, fg, 'surface'),
          `${scheme}/${mode} ${fg}`,
        )
    }
})

// The brand scheme takes any hue the user picks, so the generator must hold
// the same contract across the whole input range, not just the six presets.
test('brand schemes meet WCAG 2.2 AA across hues, chroma and neutral tints', () => {
  const failures: string[] = []
  for (let accentHue = 0; accentHue < 360; accentHue += 15)
    for (const accentChroma of [0.04, 0.12, 0.22])
      for (const neutralChroma of [0, 0.03]) {
        const seed = customSchemeSeed({
          accentHue,
          accentChroma,
          neutralChroma,
        })
        for (const mode of ['light', 'dark'] as const)
          for (const level of CONTRAST_LEVELS)
            for (const action of ACTION_STYLES) {
              const values = resolveTokens(
                seedTokens(seed, mode, level, action),
              )
              for (const [fg, bg, min] of PAIRS) {
                const value = ratio(values, fg, bg)
                if (value < min)
                  failures.push(
                    `h${accentHue} c${accentChroma} n${neutralChroma} ${mode}/${level}/${action} ${fg} on ${bg}: ${value.toFixed(2)}`,
                  )
              }
            }
      }
  assert.deepEqual(failures.slice(0, 20), [], `${failures.length} failures`)
})

/**
 * 12-step OKLCH scales. Step numbering follows Radix Colors: 1–2 app
 * backgrounds, 3–5 component backgrounds (rest / hover / pressed), 6–8
 * borders, 9–10 solid fills, 11–12 text. Text steps and solid labels are
 * solved for WCAG 2.2 contrast instead of being picked by hand.
 */
import { contrast, oklch, rgbOf, type Oklch, type Rgb } from './oklch'
import type { HueSeed } from './color-schemes'

export type Mode = 'light' | 'dark'

export interface Scale {
  /** Steps 1–12 at indices 0–11. */
  readonly steps: readonly Oklch[]
  /** Label color on step 9 (and step 10). */
  readonly on: Oklch
  readonly onName: 'white' | 'dark'
}

const STEP_L: Record<Mode, readonly number[]> = {
  light: [0.993, 0.981, 0.958, 0.935, 0.912, 0.884, 0.846, 0.784],
  dark: [0.18, 0.21, 0.248, 0.278, 0.307, 0.342, 0.396, 0.48],
}

// Chroma weight per step; neutrals keep their tint, hues peak at step 9.
const NEUTRAL_C: Record<Mode, readonly number[]> = {
  light: [0.3, 0.5, 0.8, 0.9, 1, 1.05, 1.1, 1.2, 1.5, 1.5, 1.4, 1.2],
  dark: [0.9, 1, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.3, 1.3, 1, 0.5],
}
const HUE_C: Record<Mode, readonly number[]> = {
  light: [0.09, 0.18, 0.34, 0.48, 0.6, 0.68, 0.77, 0.88, 1, 1, 0.88, 0.5],
  dark: [0.2, 0.26, 0.4, 0.5, 0.58, 0.64, 0.72, 0.82, 1, 1, 0.78, 0.35],
}

export const WHITE = oklch(1, 0, 0)
/** Labels on solid fills must clear this, at rest and on hover. */
export const ON_SOLID_MIN = 4.5

/**
 * The lightness at `hue`/`chroma` that reaches `target` against `bg`, as close
 * to the background as allowed: darkest-allowed text is not wanted, the most
 * vivid readable one is.
 */
export function solveLightness(
  hue: number,
  chroma: number,
  bg: Rgb,
  target: number,
  mode: Mode,
): Oklch {
  const ok = (L: number) => contrast(rgbOf(oklch(L, chroma, hue)), bg) >= target
  let lo = 0
  let hi = 1
  if (mode === 'light') {
    if (!ok(0)) return oklch(0, 0, hue)
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2
      if (ok(mid)) lo = mid
      else hi = mid
    }
    return oklch(lo, chroma, hue)
  }
  if (!ok(1)) return oklch(1, 0, hue)
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (ok(mid)) hi = mid
    else lo = mid
  }
  return oklch(hi, chroma, hue)
}

export function neutralScale(
  seed: { h: number; c: number },
  mode: Mode,
  high: boolean,
): Oklch[] {
  const weight = NEUTRAL_C[mode]
  const steps = STEP_L[mode].map((L, i) => oklch(L, seed.c * weight[i], seed.h))
  steps.push(
    oklch(mode === 'light' ? 0.64 : 0.54, seed.c * weight[8], seed.h),
    oklch(mode === 'light' ? 0.6 : 0.59, seed.c * weight[9], seed.h),
  )
  // Muted text reads on every surface step up to 3 (raised in dark mode).
  steps.push(
    solveLightness(
      seed.h,
      seed.c * weight[10],
      rgbOf(steps[2]),
      high ? 8.5 : 6.2,
      mode,
    ),
  )
  steps.push(
    oklch(
      mode === 'light' ? (high ? 0.17 : 0.245) : high ? 0.985 : 0.945,
      seed.c * weight[11],
      seed.h,
    ),
  )
  return steps
}

export function hueScale(seed: HueSeed, mode: Mode, high: boolean): Scale {
  const weight = HUE_C[mode]
  const steps = STEP_L[mode].map((L, i) => oklch(L, seed.c * weight[i], seed.h))
  const onName = seed.on ?? (seed.h >= 55 && seed.h <= 125 ? 'dark' : 'white')
  const on =
    onName === 'white'
      ? WHITE
      : oklch(
          mode === 'light' ? 0.24 : 0.2,
          Math.min(seed.c * 0.4, 0.06),
          seed.h,
        )
  const solid = (L: number) => oklch(L, seed.c, seed.h)
  const pass = (L: number) =>
    contrast(rgbOf(on), rgbOf(solid(L))) >= ON_SOLID_MIN
  let L9 =
    seed.solid?.[mode] ??
    (onName === 'dark' ? 0.8 : mode === 'light' ? 0.56 : 0.6)
  if (onName === 'white') while (!pass(L9) && L9 > 0.2) L9 -= 0.005
  else while (!pass(L9) && L9 < 0.97) L9 += 0.005
  let L10 = L9 + (mode === 'light' ? -0.04 : 0.035)
  if (!pass(L10)) L10 = L9 + (mode === 'light' ? 0.035 : -0.04)
  steps.push(solid(L9), solid(L10))
  // Text on the tinted steps must read at rest (3) and on hover (4).
  steps.push(
    solveLightness(
      seed.h,
      seed.c * weight[10],
      rgbOf(steps[3]),
      high ? 7 : 4.6,
      mode,
    ),
  )
  steps.push(
    oklch(
      mode === 'light' ? (high ? 0.24 : 0.3) : high ? 0.97 : 0.93,
      seed.c * weight[11],
      seed.h,
    ),
  )
  return { steps, on, onName }
}

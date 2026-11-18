/**
 * Build-time color math for generated palettes: OKLCH ↔ sRGB (Björn Ottosson),
 * WCAG 2.x contrast and sRGB alpha compositing. Theme generation imports it;
 * the app bundle does not.
 */

export type Rgb = readonly [number, number, number]

function oklchToLinear(L: number, C: number, hue: number): number[] {
  const h = (hue * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const encode = (v: number) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055

/** OKLCH to 8-bit sRGB, lowering chroma until the color fits the gamut. */
export function oklchToRgb(L: number, C: number, hue: number): Rgb {
  let chroma = C
  let linear = oklchToLinear(L, chroma, hue)
  while (linear.some((v) => v < -1e-4 || v > 1 + 1e-4) && chroma > 0) {
    chroma = Math.max(0, chroma - 0.001)
    linear = oklchToLinear(L, chroma, hue)
  }
  const [r, g, b] = linear.map((v) =>
    Math.round(encode(Math.min(1, Math.max(0, v))) * 255),
  )
  return [r, g, b]
}

export function hexToRgb(hex: string): Rgb {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error(`Expected #rrggbb: ${hex}`)
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ]
}

export const rgbToHex = (rgb: Rgb) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

export function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: Rgb, b: Rgb): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** Composites `top` at `alpha` over an opaque `base`, as browsers do in sRGB. */
export const over = (top: Rgb, alpha: number, base: Rgb): Rgb =>
  top.map((v, i) => Math.round(v * alpha + base[i] * (1 - alpha))) as [
    number,
    number,
    number,
  ]

/**
 * The most saturated translucent color that renders `target` over `base`
 * (the minimum alpha keeps every channel inside 0–255), so tints keep their
 * look on neighbouring surfaces of the same theme.
 */
export function alphaFor(target: Rgb, base: Rgb): { rgb: Rgb; alpha: number } {
  const alpha = Math.max(
    ...target.map((t, i) => {
      const b = base[i]
      if (t === b) return 0
      return t < b ? (b - t) / b : (t - b) / (255 - b)
    }),
  )
  const a = Math.min(1, Math.max(0.01, Math.ceil(alpha * 1000) / 1000))
  const rgb = target.map((t, i) =>
    Math.min(255, Math.max(0, Math.round((t - (1 - a) * base[i]) / a))),
  ) as [number, number, number]
  return { rgb, alpha: a }
}

export const rgba = ({ rgb, alpha }: { rgb: Rgb; alpha: number }) =>
  `rgba(${rgb.join(', ')}, ${alpha})`

/** 8-bit sRGB to OKLCH (inverse of `oklchToRgb`), for brand colors given as hex. */
export function rgbToOklch(rgb: Rgb): { l: number; c: number; h: number } {
  const linear = rgb.map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const l = Math.cbrt(
    0.4122214708 * linear[0] +
      0.5363325363 * linear[1] +
      0.0514459929 * linear[2],
  )
  const m = Math.cbrt(
    0.2119034982 * linear[0] +
      0.6806995451 * linear[1] +
      0.1073969566 * linear[2],
  )
  const s = Math.cbrt(
    0.0883024619 * linear[0] +
      0.2817188376 * linear[1] +
      0.6299787005 * linear[2],
  )
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const hue = (Math.atan2(b, a) * 180) / Math.PI
  return { l: L, c: Math.hypot(a, b), h: (hue + 360) % 360 }
}

/** An OKLCH color whose chroma already fits sRGB, so CSS and hex agree. */
export interface Oklch {
  readonly l: number
  readonly c: number
  readonly h: number
  readonly alpha: number
}

const inGamut = (L: number, C: number, hue: number) =>
  oklchToLinear(L, C, hue).every((v) => v >= -1e-4 && v <= 1 + 1e-4)

/** Lowers chroma with the same rule as `oklchToRgb`, then keeps the result. */
export function oklch(L: number, C: number, hue: number, alpha = 1): Oklch {
  const l = Math.min(1, Math.max(0, L))
  let c = Math.max(0, C)
  while (!inGamut(l, c, hue) && c > 0) c = Math.max(0, c - 0.001)
  return { l, c, h: ((hue % 360) + 360) % 360, alpha }
}

export const withAlpha = (color: Oklch, alpha: number): Oklch => ({
  ...color,
  alpha,
})

export const rgbOf = (color: Oklch): Rgb =>
  oklchToRgb(color.l, color.c, color.h)

const round = (value: number, digits: number) =>
  String(Number(value.toFixed(digits)))

/** CSS value: `oklch(L C H)` or `oklch(L C H / A)`. */
export function cssOklch(color: Oklch): string {
  const body = `${round(color.l, 4)} ${round(color.c, 4)} ${round(color.h, 2)}`
  return color.alpha < 1
    ? `oklch(${body} / ${round(color.alpha, 3)})`
    : `oklch(${body})`
}

/** JavaScript value for canvas renderers that do not parse OKLCH. */
export function jsColor(color: Oklch): string {
  const rgb = rgbOf(color)
  return color.alpha < 1
    ? `rgba(${rgb.join(', ')}, ${round(color.alpha, 3)})`
    : rgbToHex(rgb)
}

/** Contrast of `fg` over `bg`, compositing translucent colors over `base`. */
export function contrastOver(fg: Oklch, bg: Oklch, base: Oklch): number {
  const ground =
    bg.alpha < 1 ? over(rgbOf(bg), bg.alpha, rgbOf(base)) : rgbOf(bg)
  const text = fg.alpha < 1 ? over(rgbOf(fg), fg.alpha, ground) : rgbOf(fg)
  return contrast(text, ground)
}

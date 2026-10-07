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

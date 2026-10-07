/**
 * Monogram avatar colors: an opaque tint and a foreground per categorical hue
 * and theme. Tints stay opaque so an avatar looks the same on every surface;
 * the foreground is solved for WCAG AA on its own tint instead of being picked
 * by hand, so initials and fallback icons read in both themes.
 */
import { contrast, oklchToRgb, rgbToHex } from './oklch'
import { AVATAR_TONE_COUNT, type AvatarTone } from './avatar-tokens'

// Evenly spread hues (tomato, amber, olive, green, teal, blue, violet, pink).
const hues = [25, 70, 105, 150, 195, 245, 290, 335] as const

const curves = {
  light: { tint: [0.935, 0.05], fg: { from: 0.58, to: 0.2, chroma: 0.15 } },
  dark: { tint: [0.33, 0.065], fg: { from: 0.7, to: 0.98, chroma: 0.12 } },
} as const

const MIN_CONTRAST = 4.6

function tone(theme: keyof typeof curves, hue: number): AvatarTone {
  const { tint, fg } = curves[theme]
  const bg = oklchToRgb(tint[0], tint[1], hue)
  const step = fg.from < fg.to ? 0.005 : -0.005
  for (let L = fg.from; fg.from < fg.to ? L <= fg.to : L >= fg.to; L += step) {
    const text = oklchToRgb(L, fg.chroma, hue)
    if (contrast(text, bg) >= MIN_CONTRAST)
      return { bg: rgbToHex(bg), fg: rgbToHex(text) }
  }
  throw new Error(`No ${theme} avatar foreground reaches AA for hue ${hue}`)
}

if (hues.length !== AVATAR_TONE_COUNT)
  throw new Error('Avatar hues must match AVATAR_TONE_COUNT')

export const avatarPalette = {
  light: hues.map((hue) => tone('light', hue)),
  dark: hues.map((hue) => tone('dark', hue)),
}

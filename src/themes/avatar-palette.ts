/**
 * Identity colors: an opaque tint and a foreground per categorical hue and
 * theme. Tints stay opaque so an avatar or file tile looks the same on every
 * surface; the foreground is solved for WCAG AA on its own tint instead of
 * being picked by hand, so initials, glyphs and file labels read in both themes.
 */
import { contrast, oklchToRgb, rgbToHex } from './oklch'
import {
  AVATAR_TONE_COUNT,
  type AvatarTone,
  type FileKind,
  type IdentityPalette,
} from './avatar-tokens'

// Evenly spread hues (tomato, amber, olive, green, teal, blue, violet, pink).
const hues = [25, 70, 105, 150, 195, 245, 290, 335] as const

// File tiles reuse the same curves; `text` (Markdown, TXT) stays neutral.
const fileHues: Record<FileKind, number | null> = {
  pdf: 25,
  doc: 245,
  sheet: 150,
  slide: 55,
  text: null,
  web: 335,
  image: 290,
  media: 195,
}

const curves = {
  light: { tint: [0.935, 0.05], fg: { from: 0.58, to: 0.2, chroma: 0.15 } },
  dark: { tint: [0.33, 0.065], fg: { from: 0.7, to: 0.98, chroma: 0.12 } },
} as const

const MIN_CONTRAST = 4.6

function tone(theme: keyof typeof curves, hue: number | null): AvatarTone {
  const { tint, fg } = curves[theme]
  const neutral = hue === null
  const bg = oklchToRgb(tint[0], neutral ? 0 : tint[1], hue ?? 0)
  const step = fg.from < fg.to ? 0.005 : -0.005
  for (let L = fg.from; fg.from < fg.to ? L <= fg.to : L >= fg.to; L += step) {
    const text = oklchToRgb(L, neutral ? 0 : fg.chroma, hue ?? 0)
    if (contrast(text, bg) >= MIN_CONTRAST)
      return { bg: rgbToHex(bg), fg: rgbToHex(text) }
  }
  throw new Error(`No ${theme} identity foreground reaches AA for hue ${hue}`)
}

if (hues.length !== AVATAR_TONE_COUNT)
  throw new Error('Avatar hues must match AVATAR_TONE_COUNT')

// The tide gradient keeps its stops in both themes; only the halo changes.
const tide = { from: '#22d3ee', via: '#3b82f6', to: '#8b5cf6' } as const

function palette(theme: keyof typeof curves): IdentityPalette {
  return {
    tones: hues.map((hue) => tone(theme, hue)),
    files: Object.fromEntries(
      Object.entries(fileHues).map(([kind, hue]) => [kind, tone(theme, hue)]),
    ) as Record<FileKind, AvatarTone>,
    ai: {
      ...tide,
      glow:
        theme === 'light'
          ? 'rgba(59, 130, 246, 0.14)'
          : 'rgba(59, 130, 246, 0.18)',
      ring:
        theme === 'light'
          ? 'rgba(59, 130, 246, 0.45)'
          : 'rgba(96, 165, 250, 0.45)',
    },
  }
}

export const avatarPalette = {
  light: palette('light'),
  dark: palette('dark'),
}

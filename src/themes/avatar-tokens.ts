/** Monogram avatar tones; each has an opaque tint and a foreground per theme. */
export const AVATAR_TONE_COUNT = 8

type Slot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface AvatarTone {
  bg: string
  fg: string
}

export type AvatarTokens = {
  [K in `components-avatar-${Slot}-${'bg' | 'text'}`]: string
}

function avatarTokenEntries(tone: (index: number) => AvatarTone) {
  return Object.fromEntries(
    Array.from({ length: AVATAR_TONE_COUNT }, (_, i) => [
      [`components-avatar-${i + 1}-bg`, tone(i).bg],
      [`components-avatar-${i + 1}-text`, tone(i).fg],
    ]).flat(),
  ) as AvatarTokens
}

export const emptyAvatarTokens: AvatarTokens = avatarTokenEntries(() => ({
  bg: '',
  fg: '',
}))

export const buildAvatarTokens = (tones: readonly AvatarTone[]): AvatarTokens =>
  avatarTokenEntries((i) => tones[i])

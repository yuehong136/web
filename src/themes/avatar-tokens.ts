/**
 * Identity colors: monogram avatar tones, file-kind tiles and the AI "tide"
 * accent. Each tone has an opaque tint and a foreground per theme.
 */
export const AVATAR_TONE_COUNT = 8

type Slot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** File kinds that get their own tile color in lists, citations and sources. */
export const FILE_KINDS = [
  'pdf',
  'doc',
  'sheet',
  'slide',
  'text',
  'web',
  'image',
  'media',
] as const
export type FileKind = (typeof FILE_KINDS)[number]

/** The AI accent: a three-stop gradient plus the glow and ring around it. */
export const AI_ROLES = ['from', 'via', 'to', 'glow', 'ring'] as const
type AiRole = (typeof AI_ROLES)[number]

export interface AvatarTone {
  bg: string
  fg: string
}

export interface IdentityPalette {
  tones: readonly AvatarTone[]
  files: Readonly<Record<FileKind, AvatarTone>>
  ai: Readonly<Record<AiRole, string>>
}

export type AvatarTokens = {
  [K in `components-avatar-${Slot}-${'bg' | 'text'}`]: string
} & {
  [K in `components-file-${FileKind}-${'bg' | 'text'}`]: string
} & {
  [K in `components-ai-${AiRole}`]: string
}

function identityTokenEntries(palette: IdentityPalette) {
  return Object.fromEntries([
    ...Array.from({ length: AVATAR_TONE_COUNT }, (_, i) => [
      [`components-avatar-${i + 1}-bg`, palette.tones[i].bg],
      [`components-avatar-${i + 1}-text`, palette.tones[i].fg],
    ]).flat(),
    ...FILE_KINDS.flatMap((kind) => [
      [`components-file-${kind}-bg`, palette.files[kind].bg],
      [`components-file-${kind}-text`, palette.files[kind].fg],
    ]),
    ...AI_ROLES.map((role) => [`components-ai-${role}`, palette.ai[role]]),
  ]) as AvatarTokens
}

const blank: AvatarTone = { bg: '', fg: '' }

export const emptyAvatarTokens: AvatarTokens = identityTokenEntries({
  tones: Array.from({ length: AVATAR_TONE_COUNT }, () => blank),
  files: Object.fromEntries(FILE_KINDS.map((kind) => [kind, blank])) as Record<
    FileKind,
    AvatarTone
  >,
  ai: Object.fromEntries(AI_ROLES.map((role) => [role, ''])) as Record<
    AiRole,
    string
  >,
})

export const buildAvatarTokens = (palette: IdentityPalette): AvatarTokens =>
  identityTokenEntries(palette)

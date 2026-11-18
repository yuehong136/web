/**
 * File-type colors come from the identity tones (`avatar-1..8`): an opaque
 * tint and a foreground solved for WCAG AA on it in every scheme and mode.
 * `accent` is the foreground; an extension label puts the tint on top of it,
 * which keeps the same tested pair.
 */
export interface FileTone {
  bg: string
  text: string
  accent: string
}

const tone = (bg: string, text: string): FileTone => ({
  bg,
  text,
  accent: text,
})

// Static strings so the token-closure test can check every reference.
export const FILE_TONES = {
  red: tone('var(--color-avatar-1-bg)', 'var(--color-avatar-1-fg)'),
  orange: tone('var(--color-avatar-2-bg)', 'var(--color-avatar-2-fg)'),
  yellow: tone('var(--color-avatar-3-bg)', 'var(--color-avatar-3-fg)'),
  green: tone('var(--color-avatar-4-bg)', 'var(--color-avatar-4-fg)'),
  teal: tone('var(--color-avatar-5-bg)', 'var(--color-avatar-5-fg)'),
  blue: tone('var(--color-avatar-6-bg)', 'var(--color-avatar-6-fg)'),
  purple: tone('var(--color-avatar-7-bg)', 'var(--color-avatar-7-fg)'),
  pink: tone('var(--color-avatar-8-bg)', 'var(--color-avatar-8-fg)'),
  gray: tone('var(--color-neutral-soft)', 'var(--color-neutral-fg)'),
} as const satisfies Record<string, FileTone>
export type FileToneName = keyof typeof FILE_TONES

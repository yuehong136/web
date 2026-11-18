/**
 * File kinds reuse the identity tones (`avatar-{1..8}-*`), so a PDF tile and a
 * teammate with the same tone share one tested color pair. Plain text and
 * Markdown stay neutral.
 */
export const FILE_KIND_TONES = {
  pdf: 1,
  doc: 6,
  sheet: 4,
  slide: 2,
  text: null,
  web: 8,
  image: 7,
  media: 5,
} as const
export type FileKind = keyof typeof FILE_KIND_TONES
export const FILE_KINDS = Object.keys(FILE_KIND_TONES) as FileKind[]

/**
 * File kinds shown by `patterns/file-kind-tile.tsx`. Each kind takes one of the
 * identity tones (`avatar-{1..8}-*`), so a PDF tile and a teammate with the same
 * tone share one tested color pair; plain text and Markdown stay neutral.
 */
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

import type { FileKind } from '@/themes/identity'
import { cn } from '@/lib/utils'

const EXTENSIONS: Record<Exclude<FileKind, 'text'>, readonly string[]> = {
  pdf: ['pdf'],
  doc: ['doc', 'docx', 'odt', 'rtf', 'wps', 'pages'],
  sheet: ['xls', 'xlsx', 'xlsm', 'csv', 'tsv', 'ods', 'numbers'],
  slide: ['ppt', 'pptx', 'pps', 'ppsx', 'odp', 'key'],
  web: ['html', 'htm', 'xhtml', 'mhtml', 'url'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'],
  media: [
    'mp3',
    'wav',
    'm4a',
    'flac',
    'ogg',
    'mp4',
    'mov',
    'avi',
    'mkv',
    'webm',
  ],
}

const KIND_BY_EXTENSION = new Map<string, FileKind>([
  ...Object.entries(EXTENSIONS).flatMap(([kind, list]) =>
    list.map((ext) => [ext, kind as FileKind] as const),
  ),
  // Sources without a file name (web pages, images) can pass their kind.
  ['web', 'web'],
  ['img', 'image'],
  ['image', 'image'],
])

/** Lower-case extension of a file name, or the value itself when it is one. */
export function fileExtension(nameOrExt: string): string {
  const value = nameOrExt.trim().toLowerCase()
  const dot = value.lastIndexOf('.')
  return dot >= 0 ? value.slice(dot + 1) : value
}

/** Color family for a file; Markdown, plain text and unknown types are `text`. */
export function fileKindOf(nameOrExt: string): FileKind {
  return KIND_BY_EXTENSION.get(fileExtension(nameOrExt)) ?? 'text'
}

// Static class strings so Tailwind can see every tone.
const TONES: Record<FileKind, string> = {
  pdf: 'bg-components-file-pdf-bg text-components-file-pdf-text',
  doc: 'bg-components-file-doc-bg text-components-file-doc-text',
  sheet: 'bg-components-file-sheet-bg text-components-file-sheet-text',
  slide: 'bg-components-file-slide-bg text-components-file-slide-text',
  text: 'bg-components-file-text-bg text-components-file-text-text',
  web: 'bg-components-file-web-bg text-components-file-web-text',
  image: 'bg-components-file-image-bg text-components-file-image-text',
  media: 'bg-components-file-media-bg text-components-file-media-text',
}

const SIZES = {
  xs: 'size-4 rounded-[0.25rem] text-[0.4375rem]',
  sm: 'size-5.5 rounded-radius-sm text-[0.5rem]',
  md: 'size-7 rounded-radius-md text-[0.5625rem]',
  lg: 'size-9 rounded-radius-md text-[0.625rem]',
} as const

export interface FileKindTileProps {
  /** File name or bare extension, e.g. "report.pdf" or "pdf". */
  name: string
  size?: keyof typeof SIZES
  className?: string
}

/**
 * A colored tile with the file's extension, shared by document lists,
 * citation chips and source strips. Decorative: the file name sits next to it.
 */
export function FileKindTile({
  name,
  size = 'md',
  className,
}: FileKindTileProps) {
  const ext = fileExtension(name)
  const full = (ext && ext.length <= 4 ? ext : fileKindOf(name)).toUpperCase()
  // The 16px tile only fits three letters (DOCX → DOC, XLSX → XLS).
  const label = size === 'xs' ? full.slice(0, 3) : full
  return (
    <span
      aria-hidden
      data-slot="file-kind-tile"
      data-kind={fileKindOf(name)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-mono leading-none font-bold tracking-tight',
        TONES[fileKindOf(name)],
        SIZES[size],
        className,
      )}
    >
      {label}
    </span>
  )
}

import {
  FileKindTile,
  fileExtension,
  fileKindOf,
  type FileKindTileProps,
} from '@/components/patterns/file-kind-tile'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { getSourceBadge } from './citation-utils'

// FileKindTile reads the kind from an extension; web pages and image chunks
// without one keep their own tone and a short label.
const TONES: Record<string, string> = {
  WEB: 'bg-components-file-web-bg text-components-file-web-text',
  IMG: 'bg-components-file-image-bg text-components-file-image-text',
}

/**
 * The name FileKindTile labels. The smallest tile only fits three letters, so
 * “docx” reads “DOC” there when the shorter extension names the same kind.
 */
function tileName(chunk: ReferenceChunk, size: FileKindTileProps['size']) {
  const badge = getSourceBadge(chunk)
  const name = chunk.document_name?.toUpperCase().endsWith(`.${badge}`)
    ? chunk.document_name!
    : badge.toLowerCase()
  const ext = fileExtension(name)
  return size === 'xs' &&
    ext.length > 3 &&
    fileKindOf(ext.slice(0, 3)) === fileKindOf(ext)
    ? ext.slice(0, 3)
    : name
}

/** The file-type tile of a retrieved chunk: its document, a web page or an image. */
export function SourceTile({
  chunk,
  size,
  className,
}: {
  chunk: ReferenceChunk
  size?: FileKindTileProps['size']
  className?: string
}) {
  return (
    <FileKindTile
      name={tileName(chunk, size)}
      size={size}
      className={cn(
        TONES[getSourceBadge(chunk)],
        'overflow-hidden whitespace-nowrap',
        className,
      )}
    />
  )
}

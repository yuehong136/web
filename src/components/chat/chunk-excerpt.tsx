import { HighlightText } from '@/components/knowledge/HighlightText'
import { toPlainText, truncateText } from '@/components/chat/reference-meta'
import {
  excerptAround,
  highlightTerms,
  markTerms,
} from '@/components/chat/reference-highlight'
import type { ReferenceChunk } from '@/utils/reference-replacer'

/**
 * A short preview of a cited chunk. When the search engine reported which
 * words matched, the preview starts near the first one and marks them.
 */
export function ChunkExcerpt({
  chunk,
  max,
  className,
  empty,
}: {
  chunk: ReferenceChunk
  max: number
  className?: string
  /** Shown when the chunk has no text. */
  empty?: string
}) {
  const text = toPlainText(chunk.content)
  const terms = highlightTerms(chunk)
  if (!text) return <p className={className}>{empty}</p>
  if (!terms.length)
    return <p className={className}>{truncateText(text, max)}</p>
  return (
    <HighlightText
      html={markTerms(excerptAround(text, terms, max), terms)}
      className={className}
    />
  )
}

import type { Config } from 'dompurify'
import { SafeHtml } from '@/components/ui/safe-html'
import { cn } from '@/lib/utils'
import './chunk-content.css'

/**
 * The one sanitising policy for chunk text: parsed documents and retrieval
 * highlights are untrusted. Table structure (parsers write table chunks as
 * HTML), paragraphs and lists, emphasis, retrieval hits (<em>, <mark>) and
 * code survive; scripts, handlers, links, images, inline styles and classes
 * do not (a class could borrow the app's own layout utilities).
 */
export const CHUNK_CONTENT_PURIFY: Config = {
  ALLOWED_TAGS: [
    'table',
    'caption',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'p',
    'div',
    'span',
    'br',
    'ul',
    'ol',
    'li',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'mark',
    'code',
    'pre',
    'sub',
    'sup',
  ],
  ALLOWED_ATTR: ['rowspan', 'colspan'],
}

export interface ChunkContentProps {
  html: string
  /** Lines to show before "show more"; tables get a taller default. */
  clamp?: 3 | 5 | 8
  /** Retrieval hits (<em>, <mark>) drawn as highlighter marks. */
  highlightHits?: boolean
  className?: string
}

const CLAMP = { 3: 'line-clamp-3', 5: 'line-clamp-5', 8: 'line-clamp-8' }

/**
 * Chunk text as the reader should see it everywhere it appears (chunk list,
 * document preview, retrieval test, search results, citations): tables as
 * tables that scroll sideways inside the text, hits as marks, line breaks
 * kept. Rendered through SafeHtml with CHUNK_CONTENT_PURIFY.
 */
export function ChunkContent({
  html,
  clamp,
  highlightHits = true,
  className,
}: ChunkContentProps) {
  return (
    <SafeHtml
      data-slot="chunk-content"
      className={cn(
        'chunk-content',
        highlightHits && 'chunk-content-hits',
        clamp && CLAMP[clamp],
        className,
      )}
      html={html}
      options={CHUNK_CONTENT_PURIFY}
    />
  )
}

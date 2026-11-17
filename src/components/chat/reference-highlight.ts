import type { ReferenceChunk } from '@/utils/reference-replacer'

const MARKED = /<em>([^<]+)<\/em>/g

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  )

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The words the search engine matched in this chunk. The backend marks them
 * with `<em>` in `highlight`, which holds matched fragments rather than the
 * whole text, so the words are reapplied to the full content. Single
 * characters are left out: on their own they mark noise.
 */
export function highlightTerms(chunk?: ReferenceChunk | null): string[] {
  const html = chunk?.highlight
  if (!html) return []
  const terms = new Set<string>()
  for (const [, term] of html.matchAll(MARKED)) {
    const word = term.trim()
    if (word.length > 1) terms.add(word)
  }
  // Longest first, so a longer match wins over a word inside it.
  return [...terms].sort((a, b) => b.length - a.length)
}

const termPattern = (terms: string[], flags: string) =>
  new RegExp(terms.map(escapeRegExp).join('|'), flags)

/** Plain text as HTML with every matched word wrapped in `<em>`. */
export function markTerms(text: string, terms: string[]): string {
  if (!terms.length) return escapeHtml(text)
  let html = ''
  let last = 0
  for (const match of text.matchAll(termPattern(terms, 'gi'))) {
    html += `${escapeHtml(text.slice(last, match.index))}<em>${escapeHtml(match[0])}</em>`
    last = match.index + match[0].length
  }
  return html + escapeHtml(text.slice(last))
}

/**
 * At most `max` characters of `text`, starting a little before the first
 * matched word so a short preview still shows why the chunk was cited.
 */
export function excerptAround(
  text: string,
  terms: string[],
  max: number,
): string {
  if (text.length <= max) return text
  let start = 0
  if (terms.length) {
    const index = text.search(termPattern(terms, 'i'))
    if (index > 0) {
      start = Math.max(
        0,
        Math.min(index - Math.floor(max / 4), text.length - max),
      )
      // Begin at a whole word and drop the space before it, never past the
      // match itself.
      while (start < index && insideWord(text, start)) start++
      while (start < index && /\s/.test(text[start])) start++
    }
  }
  let end = Math.min(text.length, start + max)
  // End at a whole word too, giving back at most a short word's length.
  for (let room = WORD_ROOM; room > 0 && insideWord(text, end); room--) end--
  if (insideWord(text, end)) end = Math.min(text.length, start + max)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trimEnd()}${end < text.length ? '…' : ''}`
}

const WORD_ROOM = 16
const LATIN_WORD = /[A-Za-z0-9]/

/** Whether `index` falls between two letters of a Latin word. */
const insideWord = (text: string, index: number) =>
  index > 0 &&
  index < text.length &&
  LATIN_WORD.test(text[index - 1]) &&
  LATIN_WORD.test(text[index])

/**
 * A cited chunk's full plain text as HTML with the matched words marked;
 * null when there is nothing to mark or the chunk is HTML (a table keeps
 * its own markup), so callers keep their usual rendering.
 */
export function markedChunkHtml(chunk?: ReferenceChunk | null): string | null {
  const content = chunk?.content ?? ''
  const terms = highlightTerms(chunk)
  if (!terms.length || !content || content.includes('<')) return null
  return markTerms(content, terms)
}

import type { ReferenceChunk } from '@/utils/reference-replacer'
import {
  findAllReferenceMatches,
  getChunkByRefId,
} from '@/utils/reference-utils'

/**
 * Chunks the answer cites with `[ID:n]`, in order of first citation. Uses the
 * same lookup as the inline markers, so a keyed citation never falls back to
 * another chunk by position.
 */
export function getCitedChunks(
  content: string,
  references: ReferenceChunk[],
): ReferenceChunk[] {
  const cited: ReferenceChunk[] = []
  for (const match of findAllReferenceMatches(content)) {
    const chunk = getChunkByRefId(match.id, references)
    if (chunk && !cited.includes(chunk)) cited.push(chunk)
  }
  return cited
}

/** The number a citation pill shows for this chunk (1-based). */
export function getCitationNumber(
  chunk: ReferenceChunk,
  references: ReferenceChunk[],
): number {
  return chunk.reference_index ?? references.indexOf(chunk) + 1
}

/** Short file-type badge: the document extension, or WEB for web results. */
export function getSourceBadge(chunk: ReferenceChunk): string {
  const extension = chunk.document_name?.match(/\.([a-z0-9]{1,5})$/i)?.[1]
  if (extension) return extension.toUpperCase()
  if (isWebSource(chunk)) return 'WEB'
  return chunk.doc_type === 'image' ? 'IMG' : 'DOC'
}

/** A web search result: no knowledge base, only a page URL. */
export function isWebSource(chunk: ReferenceChunk): boolean {
  return !chunk.dataset_id && Boolean(chunk.url)
}

/** The document name without its file extension, for compact chips. */
export function getSourceTitle(name: string): string {
  return name.replace(/\.[a-z0-9]{1,5}$/i, '') || name
}

const ADJACENT_CITATIONS = /(?:<sup>\d+<\/sup>){2,}/g
// Sentence punctuation right after a chip, e.g. `遗忘<sup>0</sup>。`.
const CHIP_THEN_PUNCTUATION =
  /(<sup>\d+(?:,\d+)*<\/sup>)([。．，、；：！？.,;:!?]+)/g

/**
 * Citations written back to back (`[ID:1][ID:2]`) become one chip: their ids
 * are joined into a single `<sup>1,2</sup>`. Sentence punctuation that follows
 * a chip moves in front of it (`遗忘。[chip]`), so the chip ends the sentence
 * and a lone `。` never wraps onto the next line. Runs after
 * `[ID:n]` → `<sup>n</sup>` so citations inside code stay untouched.
 */
export function groupAdjacentCitations(markdown: string): string {
  return markdown
    .replace(
      ADJACENT_CITATIONS,
      (run) => `<sup>${[...run.matchAll(/\d+/g)].join(',')}</sup>`,
    )
    .replace(CHIP_THEN_PUNCTUATION, '$2$1')
}

/** The citation ids a marker carries: `"3"` or a grouped `"1,2,5"`. */
export function parseCitationIds(text: string): string[] | null {
  const trimmed = text.trim()
  return /^\d+(?:,\d+)*$/.test(trimmed) ? trimmed.split(',') : null
}

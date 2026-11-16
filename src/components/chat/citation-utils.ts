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
  if (!chunk.dataset_id && chunk.url) return 'WEB'
  return chunk.doc_type === 'image' ? 'IMG' : 'DOC'
}

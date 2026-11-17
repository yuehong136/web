import type { ChunkResult } from '@/types/search'
import type { ReferenceChunk } from '@/utils/reference-replacer'

/**
 * A search result as a cited chunk for the summary's citation cards and the
 * evidence panel. The search asks for highlights, so the matched words come
 * along and are marked there.
 */
export const toReferenceChunk = (chunk: ChunkResult): ReferenceChunk => ({
  id: chunk.chunk_id,
  content: chunk.content_with_weight || chunk.highlight || chunk.text,
  ...(chunk.highlight?.includes('<em>') ? { highlight: chunk.highlight } : {}),
  document_id: chunk.doc_id,
  document_name: chunk.docnm_kwd,
  document_metadata: chunk.document_metadata,
  dataset_id: chunk.kb_id,
  image_id: chunk.img_id,
  doc_type: chunk.doc_type_kwd,
  positions: chunk.positions,
  similarity: chunk.similarity,
  vector_similarity: chunk.vector_similarity,
  term_similarity: chunk.term_similarity,
})

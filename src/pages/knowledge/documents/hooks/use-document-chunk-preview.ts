import { useQuery } from '@tanstack/react-query'
import { knowledgeAPI } from '@/api/knowledge'
import { documentKeys } from '@/hooks/use-document-request'
import type { Document } from '@/types/api'
import { TaskStatus } from '../constants'

const PREVIEW_SIZE = 2

/**
 * The first chunks of a parsed document for the Inspector, read through the
 * same chunk list API (and cache family) as the chunk page.
 */
export function useDocumentChunkPreview(
  kbId: string | undefined,
  document: Pick<Document, 'id' | 'run' | 'chunk_num'> | null,
) {
  const docId = document?.id
  const enabled = Boolean(
    kbId &&
    docId &&
    (document?.chunk_num ?? 0) > 0 &&
    document?.run !== TaskStatus.RUNNING,
  )
  return useQuery({
    queryKey: documentKeys.chunkList(
      docId,
      1,
      PREVIEW_SIZE,
      '',
      undefined,
      kbId,
    ),
    enabled,
    meta: { kbId, docId },
    queryFn: () =>
      knowledgeAPI.document.listChunks({
        kb_id: kbId!,
        doc_id: docId!,
        page: 1,
        size: PREVIEW_SIZE,
      }),
    select: (data) => data.chunks,
  })
}

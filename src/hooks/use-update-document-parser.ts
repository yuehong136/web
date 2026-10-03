import { useMutation, useQueryClient } from '@tanstack/react-query'
import { APIError } from '@/api/client'
import {
  readDocumentParser,
  updateDocumentParser,
  type DocumentParserRequest,
} from '@/api/knowledge-document-parser'
import { sameParserValue } from '@/components/knowledge/document-parser/draft'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { documentKeys } from './use-document-request'
import { knowledgeKeys } from './use-knowledge-request'

export function useUpdateDocumentParser() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    retry: false,
    mutationFn: async (
      request: DocumentParserRequest & { isCurrentActor: () => boolean },
    ) => {
      let saved
      let failure: unknown
      try {
        saved = await updateDocumentParser(request)
      } catch (error) {
        failure = error
      }
      // Reconciliation is independent of PATCH acknowledgment and never replays it.
      let readback
      if (request.isCurrentActor()) {
        try {
          readback = await readDocumentParser(request.datasetId, request.docId)
        } catch (error) {
          if (!failure) failure = error
        }
      }
      if (failure) throw failure
      if (!saved || !readback)
        throw new APIError(
          502,
          'DOCUMENT_READBACK_UNCONFIRMED',
          'Document save could not be confirmed',
        )
      for (const key of [
        'parser_id',
        'pipeline_id',
        'parser_config',
        'run',
        'status',
        'chunk_num',
        'token_num',
      ] as const)
        if (!sameParserValue(saved[key], readback[key]))
          throw new APIError(
            409,
            'DOCUMENT_READBACK_CONFLICT',
            'Document changed during readback',
          )
      return readback
    },
    onSettled: async (_data, _error, request) => {
      const { datasetId, docId } = request
      await Promise.all(
        [
          documentKeys.datasetLists(datasetId),
          documentKeys.filter(datasetId),
          documentKeys.detail(docId),
          documentKeys.standaloneDetail(docId),
          documentKeys.documentChunks(docId),
          documentKeys.documentChunkList(docId),
          knowledgeKeys.detail(datasetId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
    },
  })
  return {
    updateDocumentParser: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

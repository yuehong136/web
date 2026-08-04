import { useMutation } from '@tanstack/react-query'
import { knowledgeAPI } from '@/api/knowledge'

interface UseChunkActionsOptions {
  kbId: string | undefined
  docId: string | undefined
  onMutationSuccess: () => void
  onBulkMutationSuccess?: () => void
}

export const useChunkActions = ({
  kbId,
  docId,
  onMutationSuccess,
  onBulkMutationSuccess,
}: UseChunkActionsOptions) => {
  const switchChunkMutation = useMutation({
    mutationFn: async (params: { chunkId: string; availableInt: number }) => {
      if (!kbId || !docId) return false
      return knowledgeAPI.document.switchChunks({
        kb_id: kbId,
        doc_id: docId,
        chunk_ids: [params.chunkId],
        available_int: params.availableInt,
      })
    },
    onSuccess: onMutationSuccess,
  })

  const bulkSwitchChunksMutation = useMutation({
    mutationFn: async (params: {
      chunkIds: string[]
      availableInt: number
    }) => {
      if (!kbId || !docId) return false
      return knowledgeAPI.document.switchChunks({
        kb_id: kbId,
        doc_id: docId,
        chunk_ids: params.chunkIds,
        available_int: params.availableInt,
      })
    },
    onSuccess: () => {
      onBulkMutationSuccess?.()
      onMutationSuccess()
    },
  })

  const setChunkMutation = useMutation({
    mutationFn: async (params: {
      chunkId: string
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
      image_base64?: string
    }) => {
      if (!kbId || !docId) return false
      return knowledgeAPI.document.setChunk({
        kb_id: kbId,
        doc_id: docId,
        chunk_id: params.chunkId,
        content_with_weight: params.content,
        important_kwd: params.important_kwd,
        question_kwd: params.question_kwd,
        image_base64: params.image_base64,
      })
    },
  })

  const deleteChunksMutation = useMutation({
    mutationFn: async (chunkIds: string[]) => {
      if (!kbId || !docId) return false
      return knowledgeAPI.document.deleteChunks({
        kb_id: kbId,
        doc_id: docId,
        chunk_ids: chunkIds,
      })
    },
    onSuccess: onMutationSuccess,
  })

  const createChunkMutation = useMutation({
    mutationFn: async (params: {
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
      image_base64?: string
    }) => {
      if (!kbId || !docId) return false
      return knowledgeAPI.document.createChunk({
        kb_id: kbId,
        doc_id: docId,
        content_with_weight: params.content,
        important_kwd: params.important_kwd,
        question_kwd: params.question_kwd,
        image_base64: params.image_base64,
        available_int: 1,
      })
    },
    onSuccess: onMutationSuccess,
  })

  const setMetaMutation = useMutation({
    mutationFn: async (meta: Record<string, unknown>) => {
      if (!docId || !kbId) return false
      await knowledgeAPI.metadata.updateDocumentMeta(kbId, docId, meta)
      return true
    },
    onSuccess: onMutationSuccess,
  })

  return {
    toggleChunkStatus: switchChunkMutation.mutateAsync,
    bulkSwitchChunks: bulkSwitchChunksMutation.mutateAsync,
    setChunk: setChunkMutation.mutateAsync,
    deleteChunks: deleteChunksMutation.mutateAsync,
    createChunk: createChunkMutation.mutateAsync,
    setMeta: setMetaMutation.mutateAsync,
    isToggleChunkPending: switchChunkMutation.isPending,
    isBulkSwitchPending: bulkSwitchChunksMutation.isPending,
    isSetChunkPending: setChunkMutation.isPending,
    isDeletePending: deleteChunksMutation.isPending,
    isCreatePending: createChunkMutation.isPending,
    isSetMetaPending: setMetaMutation.isPending,
  }
}

export type ChunkActions = ReturnType<typeof useChunkActions>

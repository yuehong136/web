import { useLayoutEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { knowledgeAPI } from '@/api/knowledge'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

interface UseChunkActionsOptions {
  kbId: string | undefined
  docId: string | undefined
  onMutationSuccess: () => void
  onBulkMutationSuccess?: () => void
}

interface ChunkOwner {
  kb_id: string
  doc_id: string
}

interface OwnedRequest<T> {
  request: T & ChunkOwner
  onSuccess: () => void
}

interface ChunkContent {
  content_with_weight: string
  important_kwd?: string[]
  question_kwd?: string[]
  image_base64?: string
}

const mutationMeta = { errorFeedback: MutationErrorFeedback.Local }
const complete = (_data: unknown, variables: { onSuccess: () => void }) =>
  variables.onSuccess()

export const useChunkActions = ({
  kbId,
  docId,
  onMutationSuccess,
  onBulkMutationSuccess,
}: UseChunkActionsOptions) => {
  const ownerKey = `${kbId}:${docId}`
  const [scope, setScope] = useState({ key: ownerKey, generation: 0 })
  if (scope.key !== ownerKey) {
    setScope({ key: ownerKey, generation: scope.generation + 1 })
  }
  const owner = useRef<typeof scope | null>(scope)
  useLayoutEffect(() => {
    owner.current = scope
    return () => {
      owner.current = null
    }
  }, [scope])
  const ownerGeneration = scope.generation

  // The request carries its owner, even if a later render updates mutation options.
  const capture = <T>(params: T, bulk = false): OwnedRequest<T> => {
    if (!kbId || !docId) throw new Error('Document owner is required')
    return {
      request: { ...params, kb_id: kbId, doc_id: docId },
      onSuccess: () => {
        if (owner.current?.generation !== ownerGeneration) return
        onMutationSuccess()
        if (bulk) {
          onBulkMutationSuccess?.()
        }
      },
    }
  }

  const switchChunkMutation = useMutation({
    meta: mutationMeta,
    mutationFn: ({
      request,
    }: OwnedRequest<{
      chunk_ids: string[]
      available_int: number
    }>) => knowledgeAPI.document.switchChunks(request),
    onSuccess: complete,
  })
  const bulkSwitchChunksMutation = useMutation({
    meta: mutationMeta,
    mutationFn: ({
      request,
    }: OwnedRequest<{
      chunk_ids: string[]
      available_int: number
    }>) => knowledgeAPI.document.switchChunks(request),
    onSuccess: complete,
  })
  const setChunkMutation = useMutation({
    meta: mutationMeta,
    mutationFn: ({
      request,
    }: OwnedRequest<ChunkContent & { chunk_id: string }>) =>
      knowledgeAPI.document.setChunk(request),
    onSuccess: complete,
  })
  const deleteChunksMutation = useMutation({
    meta: mutationMeta,
    mutationFn: ({ request }: OwnedRequest<{ chunk_ids: string[] }>) =>
      knowledgeAPI.document.deleteChunks(request),
    onSuccess: complete,
  })
  const createChunkMutation = useMutation({
    meta: mutationMeta,
    mutationFn: ({ request }: OwnedRequest<ChunkContent>) =>
      knowledgeAPI.document.createChunk({ ...request, available_int: 1 }),
    onSuccess: complete,
  })
  const setMetaMutation = useMutation({
    meta: mutationMeta,
    mutationFn: async ({
      request,
    }: OwnedRequest<{ meta: Record<string, unknown> }>) => {
      await knowledgeAPI.metadata.updateDocumentMeta(
        request.kb_id,
        request.doc_id,
        request.meta,
      )
      return true
    },
    onSuccess: complete,
  })

  return {
    toggleChunkStatus: (params: { chunkId: string; availableInt: number }) =>
      switchChunkMutation.mutateAsync(
        capture({
          chunk_ids: [params.chunkId],
          available_int: params.availableInt,
        }),
      ),
    bulkSwitchChunks: (params: { chunkIds: string[]; availableInt: number }) =>
      bulkSwitchChunksMutation.mutateAsync(
        capture(
          {
            chunk_ids: [...params.chunkIds],
            available_int: params.availableInt,
          },
          true,
        ),
      ),
    setChunk: (params: {
      chunkId: string
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
      image_base64?: string
    }) => {
      const { chunkId, content, ...fields } = params
      return setChunkMutation.mutateAsync(
        capture({
          ...fields,
          chunk_id: chunkId,
          content_with_weight: content,
        }),
      )
    },
    deleteChunks: (chunkIds: string[]) =>
      deleteChunksMutation.mutateAsync(capture({ chunk_ids: [...chunkIds] })),
    createChunk: (params: {
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
      image_base64?: string
    }) => {
      const { content, ...fields } = params
      return createChunkMutation.mutateAsync(
        capture({
          ...fields,
          content_with_weight: content,
        }),
      )
    },
    setMeta: (meta: Record<string, unknown>) =>
      setMetaMutation.mutateAsync(capture({ meta })),
    isToggleChunkPending: switchChunkMutation.isPending,
    isBulkSwitchPending: bulkSwitchChunksMutation.isPending,
    isSetChunkPending: setChunkMutation.isPending,
    isDeletePending: deleteChunksMutation.isPending,
    isCreatePending: createChunkMutation.isPending,
    isSetMetaPending: setMetaMutation.isPending,
  }
}

export type ChunkActions = ReturnType<typeof useChunkActions>

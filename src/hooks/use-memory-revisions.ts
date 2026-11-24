import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import {
  confirmedWithdrawnSource,
  operationWithdrawnSource,
  redactWithdrawnSource,
} from '@/hooks/memory-withdrawal-cache'
import { memoryKeys } from '@/hooks/use-memory'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import {
  memoryOperationNeedsPolling,
  MEMORY_OPERATION_POLL_MS,
} from '@/lib/memory-operation'
import type { MemoryOperation } from '@/types/memory-revisions'

export { memoryRevisionKeys }

export function useMemoryCapabilities(memoryId: string, enabled = true) {
  return useQuery({
    queryKey: memoryRevisionKeys.capabilities(memoryId),
    enabled: enabled && !!memoryId,
    queryFn: ({ signal }) => memoryAPI.revision.capabilities(memoryId, signal),
    retry: false,
  })
}

export function useManagedEntry(
  memoryId: string,
  messageId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: memoryRevisionKeys.entry(memoryId, messageId),
    queryFn: ({ signal }) =>
      memoryAPI.revision.findEntry(memoryId, messageId, signal),
    enabled,
    retry: false,
  })
}

export function useMemoryRevisionHistory(
  memoryId: string,
  entryId: string,
  cursor?: string,
) {
  return useQuery({
    queryKey: memoryRevisionKeys.history(memoryId, entryId, cursor),
    queryFn: ({ signal }) =>
      memoryAPI.revision.history(memoryId, entryId, cursor, signal),
    enabled: !!entryId,
    retry: false,
  })
}

export function useMemorySourceState(
  memoryId: string,
  sourceId: string,
  enabled: boolean,
) {
  const cache = useQueryClient()
  return useQuery({
    queryKey: memoryRevisionKeys.source(memoryId, sourceId),
    queryFn: async ({ signal }) => {
      const result = await memoryAPI.revision.source(memoryId, sourceId, signal)
      const source = confirmedWithdrawnSource(memoryId, result)
      if (source)
        await redactWithdrawnSource(cache, memoryId, source, 'source-read')
      return result
    },
    enabled,
    retry: false,
  })
}

export function useMemoryOperation(
  memoryId: string,
  operationId: string,
  poll = false,
) {
  const cache = useQueryClient()
  return useQuery<MemoryOperation>({
    queryKey: memoryRevisionKeys.operation(memoryId, operationId),
    queryFn: async ({ signal }) => {
      const result = await memoryAPI.revision.operation(
        memoryId,
        operationId,
        signal,
      )
      const source = operationWithdrawnSource(memoryId, result)
      if (source) await redactWithdrawnSource(cache, memoryId, source)
      return result
    },
    enabled: !!operationId,
    retry: false,
    staleTime: poll ? 0 : undefined,
    refetchInterval: (query) =>
      poll &&
      !query.state.error &&
      memoryOperationNeedsPolling(query.state.data)
        ? MEMORY_OPERATION_POLL_MS
        : false,
  })
}

/** No command retries: a timeout may have committed. Read the original operation. */
export function useMemoryCommand<T, R>(
  memoryId: string,
  command: (input: T) => Promise<R>,
) {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: command,
    retry: false,
    onSuccess: async (result) => {
      const source = operationWithdrawnSource(memoryId, result)
      if (source) await redactWithdrawnSource(cache, memoryId, source)
    },
    meta: { errorFeedback: MutationErrorFeedback.Local },
    onSettled: () => {
      void cache.invalidateQueries({
        queryKey: memoryRevisionKeys.bank(memoryId),
      })
      void cache.invalidateQueries({ queryKey: memoryKeys.messages(memoryId) })
      void cache.invalidateQueries({
        queryKey: memoryKeys.messageContents(memoryId),
      })
    },
  })
}

export function memoryCommandErrorKey(error: unknown): string {
  if (error instanceof APIError && error.status === 409)
    return isKnownMemoryRejection(error)
      ? 'memory.revisions.conflict'
      : 'memory.revisions.inflight'
  if (
    error instanceof APIError &&
    (error.status === 503 || error.status === 408 || error.status === 0)
  )
    return 'memory.revisions.unknown'
  return 'memory.revisions.failed'
}

export function editableMemoryId(
  id: number | string | undefined,
): string | null {
  if (typeof id === 'number')
    return Number.isSafeInteger(id) && id > 0 ? String(id) : null
  return typeof id === 'string' &&
    /^[1-9][0-9]*$/.test(id) &&
    BigInt(id) <= 9223372036854775807n
    ? id
    : null
}

/** Only known precondition rejections release the current command identity. */
export function isKnownMemoryRejection(error: unknown): boolean {
  if (!(error instanceof APIError)) return false
  if (error.status === 422) return true
  if (error.status !== 409) return false
  const details: unknown = error.details
  const code =
    typeof details === 'object' && details !== null && 'error_code' in details
      ? details.error_code
      : error.code
  return (
    typeof code === 'string' &&
    [
      'expected_revision_mismatch',
      'expected_source_revision_mismatch',
      'source_content_changed',
      'source_state_changed',
    ].includes(code)
  )
}

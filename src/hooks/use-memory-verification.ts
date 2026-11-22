import { useLayoutEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { memoryVerificationKeys } from './memory-verification-keys'
import {
  protectMemoryVerification,
  watchMemoryVerificationFences,
} from './memory-verification-cache'
export function useMemoryVerificationReads(
  id: string,
  eid: string,
  op: string,
  cursor?: string,
  enabled = true,
) {
  const cache = useQueryClient()
  useLayoutEffect(() => watchMemoryVerificationFences(cache, id), [cache, id])
  const history = useQuery({
    queryKey: memoryVerificationKeys.history(id, eid, cursor),
    enabled: enabled && !!eid,
    retry: false,
    queryFn: async ({ signal }) =>
      protectMemoryVerification(
        cache,
        id,
        await memoryAPI.verification.history(id, eid, cursor, signal),
      ),
  })
  const snapshot = useQuery({
    queryKey: memoryVerificationKeys.snapshot(id, eid),
    enabled: false,
    retry: false,
    queryFn: async ({ signal }) =>
      protectMemoryVerification(
        cache,
        id,
        await memoryAPI.verification.snapshot(id, eid, signal),
      ),
  })
  const operation = useQuery({
    queryKey: memoryVerificationKeys.operation(id, op),
    enabled: enabled && !!op,
    retry: false,
    queryFn: async ({ signal }) =>
      protectMemoryVerification(
        cache,
        id,
        await memoryAPI.verification.operation(id, op, signal),
      ),
  })
  return { history, snapshot, operation }
}
export function useMemoryVerificationTodos(
  id: string,
  cursor?: string,
  enabled = true,
) {
  const cache = useQueryClient()
  useLayoutEffect(() => watchMemoryVerificationFences(cache, id), [cache, id])
  return useQuery({
    queryKey: memoryVerificationKeys.todos(id, cursor),
    enabled,
    retry: false,
    queryFn: async ({ signal }) =>
      protectMemoryVerification(
        cache,
        id,
        await memoryAPI.verification.todos(id, cursor, signal),
      ),
  })
}
export function useMemoryVerificationCommand<T>(
  id: string,
  command: (
    body: T,
  ) => Promise<
    import('@/types/memory-verification').MemoryVerificationOperation
  >,
) {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: command,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    onSuccess: (result) => {
      cache.setQueryData(
        memoryVerificationKeys.operation(id, result.operation_id),
        protectMemoryVerification(cache, id, result),
      )
      void cache.invalidateQueries({
        queryKey: memoryVerificationKeys.bank(id),
      })
    },
  })
}

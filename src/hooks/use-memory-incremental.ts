import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { memoryMaintenanceKeys } from './memory-maintenance-keys'
import { memoryRevisionKeys } from './memory-revision-keys'
import { MEMORY_OPERATION_POLL_MS } from '@/lib/memory-operation'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import type {
  MemoryDiscovery,
  MemoryDiscoveryPage,
} from '@/types/memory-incremental'

export const memoryDiscoveryKeys = {
  bank: (memoryId: string) =>
    [...memoryMaintenanceKeys.bank(memoryId), 'discoveries'] as const,
  list: (memoryId: string, operationId?: string) =>
    [
      ...memoryDiscoveryKeys.bank(memoryId),
      'list',
      operationId ?? null,
    ] as const,
  detail: (memoryId: string, discoveryId: string) =>
    [...memoryDiscoveryKeys.bank(memoryId), 'detail', discoveryId] as const,
}

export function memoryDiscoveryNeedsPolling(value?: MemoryDiscovery): boolean {
  return (
    !value ||
    value.batches.some(
      (batch) =>
        ['submitted', 'running'].includes(batch.state) ||
        ['queued', 'claimed', 'running', 'needs_reconciliation'].includes(
          batch.execution?.state ?? '',
        ),
    )
  )
}

export function useMemoryDiscoveries(
  memoryId: string,
  operationId?: string,
  enabled = true,
) {
  return useQuery<MemoryDiscoveryPage>({
    queryKey: memoryDiscoveryKeys.list(memoryId, operationId),
    queryFn: ({ signal }) =>
      memoryAPI.incremental.list(memoryId, operationId, signal),
    enabled: enabled && !!memoryId,
    retry: false,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.error
        ? false
        : (operationId && !query.state.data?.discoveries.length) ||
            query.state.data?.discoveries.some(memoryDiscoveryNeedsPolling)
          ? MEMORY_OPERATION_POLL_MS
          : false,
  })
}

export function useMemoryDiscovery(memoryId: string, discoveryId: string) {
  return useQuery<MemoryDiscovery>({
    queryKey: memoryDiscoveryKeys.detail(memoryId, discoveryId),
    queryFn: ({ signal }) =>
      memoryAPI.incremental.discovery(memoryId, discoveryId, signal),
    enabled: !!memoryId && !!discoveryId,
    retry: false,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.error || !memoryDiscoveryNeedsPolling(query.state.data)
        ? false
        : MEMORY_OPERATION_POLL_MS,
  })
}

/** The preview endpoint is read-only, but is invoked only by an explicit form action. */
export function useMemoryDiscoveryPreview(memoryId: string) {
  return useMutation({
    mutationFn: (
      selection: Parameters<typeof memoryAPI.incremental.preview>[1],
    ) => memoryAPI.incremental.preview(memoryId, selection),
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
  })
}

export function useMemoryDiscoveryCommand<T>(
  memoryId: string,
  command: (input: T) => Promise<MemoryDiscovery>,
) {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: command,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    onSuccess: (result) => {
      cache.setQueryData(
        memoryDiscoveryKeys.detail(memoryId, result.discovery_id),
        result,
      )
      cache.setQueryData(
        memoryDiscoveryKeys.list(memoryId, result.operation_id),
        { discoveries: [result] },
      )
    },
    onSettled: () => {
      void cache.invalidateQueries({
        queryKey: memoryDiscoveryKeys.bank(memoryId),
      })
      void cache.invalidateQueries({
        queryKey: memoryMaintenanceKeys.jobs(memoryId),
      })
      void cache.invalidateQueries({
        queryKey: memoryRevisionKeys.operations(memoryId),
      })
    },
  })
}

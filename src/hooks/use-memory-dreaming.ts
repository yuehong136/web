import { useQuery, useQueryClient } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { memoryMaintenanceKeys } from './memory-maintenance-keys'
import { filterMaintenanceWithdrawals } from './memory-maintenance-cache'
import { MEMORY_OPERATION_POLL_MS } from '@/lib/memory-operation'
import type {
  MemoryMaintenanceJob,
  MemoryMaintenanceCandidate,
} from '@/types/memory-dreaming'
export { memoryMaintenanceKeys } from './memory-maintenance-keys'

export function useMemoryMaintenanceJobs(
  memoryId: string,
  enabled = true,
  poll = false,
) {
  const cache = useQueryClient()
  return useQuery<{ jobs: MemoryMaintenanceJob[] }>({
    queryKey: memoryMaintenanceKeys.jobs(memoryId),
    enabled,
    retry: false,
    staleTime: poll ? 0 : undefined,
    refetchInterval: (query) =>
      poll && !query.state.error ? MEMORY_OPERATION_POLL_MS : false,
    queryFn: async ({ signal }) =>
      filterMaintenanceWithdrawals(
        cache,
        memoryId,
        await memoryAPI.dreaming.list(memoryId, signal),
      ),
  })
}
export function useMemoryMaintenanceJob(
  memoryId: string,
  jobId: string,
  poll = false,
) {
  const cache = useQueryClient()
  return useQuery<MemoryMaintenanceJob>({
    queryKey: memoryMaintenanceKeys.job(memoryId, jobId),
    enabled: !!jobId,
    retry: false,
    staleTime: poll ? 0 : undefined,
    refetchInterval: (query) =>
      poll &&
      !query.state.error &&
      (['queued', 'claimed', 'running', 'needs_reconciliation'].includes(
        query.state.data?.execution?.state ?? '',
      ) ||
        !['ready', 'canceled', 'redacted', 'stale'].includes(
          query.state.data?.state ?? '',
        ))
        ? MEMORY_OPERATION_POLL_MS
        : false,
    queryFn: async ({ signal }) =>
      filterMaintenanceWithdrawals(
        cache,
        memoryId,
        await memoryAPI.dreaming.job(memoryId, jobId, signal),
      ),
  })
}
export function useMemoryMaintenanceCandidates(
  memoryId: string,
  jobId: string,
  poll = false,
) {
  const cache = useQueryClient()
  return useQuery<{ candidates: MemoryMaintenanceCandidate[] }>({
    queryKey: memoryMaintenanceKeys.candidates(memoryId, jobId),
    enabled: !!jobId,
    retry: false,
    staleTime: poll ? 0 : undefined,
    refetchInterval: (query) =>
      poll && !query.state.error ? MEMORY_OPERATION_POLL_MS : false,
    queryFn: async ({ signal }) =>
      filterMaintenanceWithdrawals(
        cache,
        memoryId,
        await memoryAPI.dreaming.candidates(memoryId, jobId, signal),
      ),
  })
}

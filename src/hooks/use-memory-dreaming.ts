import { useQuery, useQueryClient } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { memoryMaintenanceKeys } from './memory-maintenance-keys'
import { filterMaintenanceWithdrawals } from './memory-maintenance-cache'
export { memoryMaintenanceKeys } from './memory-maintenance-keys'

export function useMemoryMaintenanceJobs(memoryId: string, enabled = true) {
  const cache = useQueryClient()
  return useQuery({
    queryKey: memoryMaintenanceKeys.jobs(memoryId),
    enabled,
    retry: false,
    queryFn: async ({ signal }) =>
      filterMaintenanceWithdrawals(
        cache,
        memoryId,
        await memoryAPI.dreaming.list(memoryId, signal),
      ),
  })
}
export function useMemoryMaintenanceJob(memoryId: string, jobId: string) {
  const cache = useQueryClient()
  return useQuery({
    queryKey: memoryMaintenanceKeys.job(memoryId, jobId),
    enabled: !!jobId,
    retry: false,
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
) {
  const cache = useQueryClient()
  return useQuery({
    queryKey: memoryMaintenanceKeys.candidates(memoryId, jobId),
    enabled: !!jobId,
    retry: false,
    queryFn: async ({ signal }) =>
      filterMaintenanceWithdrawals(
        cache,
        memoryId,
        await memoryAPI.dreaming.candidates(memoryId, jobId, signal),
      ),
  })
}

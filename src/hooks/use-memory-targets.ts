import { useMutation } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { memoryMaintenanceKeys } from './memory-maintenance-keys'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import type { MemoryTargetRecommendationRequest } from '@/types/memory-targets'

export const memoryTargetKeys = {
  bank: (memoryId: string) =>
    [
      ...memoryMaintenanceKeys.bank(memoryId),
      'target-recommendations',
    ] as const,
}

/** Recommendations may embed once, so neither GET, mount nor polling invokes this command. */
export function useMemoryTargetRecommendations(memoryId: string) {
  return useMutation({
    mutationKey: memoryTargetKeys.bank(memoryId),
    mutationFn: (request: MemoryTargetRecommendationRequest) =>
      memoryAPI.dreaming.recommendTargets(memoryId, request),
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
  })
}

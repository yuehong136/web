import { useQuery, useQueryClient } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { memoryRevisionKeys } from './memory-revision-keys'
import { MEMORY_OPERATION_POLL_MS } from '@/lib/memory-operation'
import type { MemoryOperationPage } from '@/types/memory-revisions'

export function useMemoryOperationInbox(
  memoryId: string,
  view: 'pending' | 'all' = 'pending',
  cursor?: string,
  enabled = true,
) {
  const cache = useQueryClient()
  return useQuery<MemoryOperationPage>({
    queryKey: memoryRevisionKeys.inbox(memoryId, view, cursor),
    enabled: enabled && !!memoryId,
    retry: false,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const result = await memoryAPI.revision.operations(
        memoryId,
        { view, limit: 20, cursor },
        signal,
      )
      for (const operation of result.operations) {
        const key = memoryRevisionKeys.operation(
          memoryId,
          operation.operation_id,
        )
        if (cache.getQueryState(key)?.status === 'error')
          void cache.invalidateQueries({ queryKey: key })
      }
      return result
    },
    refetchInterval: (query) =>
      query.state.error ? false : MEMORY_OPERATION_POLL_MS,
  })
}

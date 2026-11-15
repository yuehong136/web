import type { QueryClient } from '@tanstack/react-query'
import { memoryKeys } from '@/hooks/use-memory'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { memoryMaintenanceKeys } from '@/hooks/memory-maintenance-keys'
import type { MemoryListResponse } from '@/types/memory'
export { confirmedMemoryDeletion } from '@/lib/memory-operation'

/** A server-confirmed closing bank cannot retain normal-supply bodies in this client. */
export async function clearUnavailableMemoryBodies(
  cache: QueryClient,
  memoryId: string,
): Promise<void> {
  const keys = [
    memoryKeys.messages(memoryId),
    memoryKeys.messageContents(memoryId),
    memoryRevisionKeys.entries(memoryId),
    memoryRevisionKeys.histories(memoryId),
    memoryMaintenanceKeys.bank(memoryId),
  ]
  await Promise.all(
    keys.map((queryKey) =>
      cache.cancelQueries({ queryKey }, { revert: false }),
    ),
  )
  for (const queryKey of keys) cache.removeQueries({ queryKey })
}

/** Cancel stale reads before dropping a confirmed deleted bank's cached bodies. */
export async function clearDeletedMemory(
  cache: QueryClient,
  memoryId: string,
): Promise<void> {
  const keys = [
    memoryMaintenanceKeys.bank(memoryId),
    memoryKeys.messages(memoryId),
    memoryKeys.messageContents(memoryId),
    memoryKeys.detail(memoryId),
    memoryKeys.config(memoryId),
    memoryRevisionKeys.entries(memoryId),
    memoryRevisionKeys.histories(memoryId),
  ]
  await Promise.all(
    keys.map((queryKey) =>
      cache.cancelQueries({ queryKey }, { revert: false }),
    ),
  )
  for (const queryKey of keys) cache.removeQueries({ queryKey })
  await cache.cancelQueries({ queryKey: memoryKeys.lists() }, { revert: false })
  cache.setQueriesData<MemoryListResponse>(
    { queryKey: memoryKeys.lists() },
    (previous) => {
      if (!previous?.memory_list.some((memory) => memory.id === memoryId))
        return previous
      return {
        ...previous,
        memory_list: previous.memory_list.filter(
          (memory) => memory.id !== memoryId,
        ),
        total_count: Math.max(0, previous.total_count - 1),
      }
    },
  )
  void cache.invalidateQueries({ queryKey: memoryKeys.lists() })
}

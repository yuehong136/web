import type { MemoryOperation } from '@/types/memory-revisions'

export function confirmedMemoryDeletion(operation?: MemoryOperation): boolean {
  return (
    operation?.kind === 'delete_memory' &&
    operation.lifecycle === 'deleted' &&
    operation.tracked_cleanup_confirmed === true
  )
}

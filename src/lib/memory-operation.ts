import type { MemoryOperation } from '@/types/memory-revisions'

export function confirmedMemoryDeletion(operation?: MemoryOperation): boolean {
  return (
    operation?.kind === 'delete_memory' &&
    operation.lifecycle === 'deleted' &&
    operation.tracked_cleanup_confirmed === true
  )
}

/** Queue acknowledgement is distinct from the extraction worker finishing. */
export function memoryOperationReady(operation?: MemoryOperation): boolean {
  if (operation?.kind === 'delete_memory')
    return confirmedMemoryDeletion(operation)
  if (operation?.index_sync_status !== 'ready') return false
  if (operation.kind === 'dream_publish') return operation.status === 'ready'
  return (
    operation.kind !== 'append_raw' ||
    operation.queue_state === 'submitted' ||
    operation.queue_state === 'not_required'
  )
}

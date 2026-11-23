import type { MemoryOperation } from '@/types/memory-revisions'
export const MEMORY_OPERATION_POLL_MS = 5000

export function confirmedMemoryDeletion(operation?: MemoryOperation): boolean {
  return (
    operation?.kind === 'delete_memory' &&
    operation.lifecycle === 'deleted' &&
    operation.tracked_cleanup_confirmed === true
  )
}

/** Queue acknowledgement is distinct from the extraction worker finishing. */
export function memoryOperationReady(operation?: MemoryOperation): boolean {
  if (operation?.kind === 'context_compact') return false
  if (
    operation?.writer_busy ||
    operation?.needs_operator_reconciliation ||
    operation?.execution?.needs_operator_reconciliation ||
    (operation?.execution && operation.execution.state !== 'succeeded')
  )
    return false
  if (operation?.kind === 'delete_memory')
    return confirmedMemoryDeletion(operation)
  if (operation?.index_sync_status !== 'ready') return false
  if (operation.kind === 'dream_publish') return operation.status === 'ready'
  if (operation.kind === 'dream_analyze')
    return (
      operation.status === 'ready' &&
      (!operation.execution || operation.execution.state === 'succeeded')
    )
  return (
    operation.kind !== 'append_raw' ||
    operation.queue_state === 'submitted' ||
    operation.queue_state === 'not_required'
  )
}

export function memoryOperationNeedsPolling(
  operation?: MemoryOperation,
): boolean {
  if (operation?.kind === 'context_compact')
    return (
      !!operation.writer_busy ||
      (!operation.needs_operator_reconciliation &&
        operation.status === 'running')
    )
  if (!operation || operation.writer_busy) return true
  if (
    operation.execution &&
    ['queued', 'claimed', 'running', 'needs_reconciliation'].includes(
      operation.execution.state,
    )
  )
    return true
  if (memoryOperationReady(operation)) return false
  return (
    operation.can_reconcile === true ||
    operation.retryable ||
    !['canceled', 'rejected', 'stale', 'failed'].includes(operation.status)
  )
}

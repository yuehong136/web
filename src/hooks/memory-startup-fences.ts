import type { QueryClient } from '@tanstack/react-query'
import { memoryRevisionKeys } from './memory-revision-keys'
import { memoryVerificationKeys } from './memory-verification-keys'
import type { MemoryStartupPackage } from '@/types/memory-startup'
type ObjectValue = Record<string, unknown>
const object = (value: unknown): value is ObjectValue =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const decimal = (value: unknown): bigint | null =>
  typeof value === 'string' && /^[0-9]+$/.test(value)
    ? BigInt(value)
    : typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
      ? BigInt(value)
      : null
const older = (value: unknown, expected: string) => {
  const n = decimal(value)
  return n !== null && n < BigInt(expected)
}
export function memoryStartupObservation(
  cache: QueryClient,
  id: string,
): Map<string, number> {
  return new Map(
    cache
      .getQueryCache()
      .findAll({ queryKey: memoryRevisionKeys.bank(id) })
      .map((query) => [query.queryHash, query.state.dataUpdateCount]),
  )
}
/** A local invalidation fence, never an authorization or factual verification substitute. */
export function memoryStartupChanged(
  cache: QueryClient,
  value: MemoryStartupPackage,
  observed: Map<string, number>,
): boolean {
  const id = value.memory_id
  const operationChanged = (row: unknown): boolean => {
    if (!object(row)) return false
    if (
      row.kind === 'delete_memory' &&
      (row.lifecycle === 'deleting' || row.lifecycle === 'deleted')
    )
      return true
    if (row.status === 'ready' || row.index_sync_status === 'ready') {
      const matches = (entry: unknown) =>
        object(entry) &&
        value.items.some(
          (item) =>
            entry.entry_id === item.entry_id &&
            decimal(entry.new_revision) !== null &&
            decimal(entry.new_revision)! > BigInt(item.revision),
        )
      if (
        matches(row) ||
        (Array.isArray(row.entries) && row.entries.some(matches))
      )
        return true
    }
    return (
      Array.isArray(row.operations) && row.operations.some(operationChanged)
    )
  }
  for (const [, row] of cache.getQueriesData({
    queryKey: memoryRevisionKeys.bank(id),
  }))
    if (operationChanged(row)) return true
  for (const item of value.items) {
    for (const source of item.sources) {
      const known = cache.getQueryData<ObjectValue>(
        memoryRevisionKeys.source(id, source.source_id),
      )
      if (!known || known.memory_id !== id) continue
      if (['forgotten', 'deleted', 'withdrawn'].includes(String(known.state)))
        return true
      if (
        older(known.generation, source.source_generation) ||
        older(known.source_revision, source.source_revision)
      )
        continue
      if (
        known.state !== 'active' ||
        decimal(known.generation) !== BigInt(source.source_generation) ||
        decimal(known.source_revision) !== BigInt(source.source_revision) ||
        known.content_sha256 !== source.content_sha256
      )
        return true
    }
    for (const [, known] of cache.getQueriesData<ObjectValue>({
      queryKey: memoryRevisionKeys.entries(id),
    })) {
      if (!known || known.entry_id !== item.entry_id || known.memory_id !== id)
        continue
      if (
        older(known.generation, item.generation) ||
        older(known.current_revision, item.revision)
      )
        continue
      if (
        known.state !== 'active' ||
        decimal(known.current_revision) !== BigInt(item.revision) ||
        decimal(known.generation) !== BigInt(item.generation) ||
        known.current_message_id !== item.message_id ||
        !object(known.current) ||
        known.current.content_sha256 !== item.content_sha256 ||
        known.current.redacted === true
      )
        return true
    }
    for (const query of cache
      .getQueryCache()
      .findAll({ queryKey: memoryVerificationKeys.bank(id) })) {
      const changed =
        query.state.dataUpdateCount > (observed.get(query.queryHash) ?? 0)
      const invalid = (row: unknown): boolean => {
        if (!object(row)) return false
        if (row.entry_id === item.entry_id) {
          const head = decimal(row.head_version)
          if (head !== null && head > BigInt(item.verification.head_version))
            return true
          if (
            row.binding_sha256 === item.verification.binding_sha256 &&
            (row.state === 'redacted' || row.effective_status === 'redacted')
          )
            return true
          if (
            changed &&
            row.verification_id === item.verification.verification_id &&
            (row.valid_for_current === false ||
              row.is_current === false ||
              [
                'stale',
                'revoked',
                'disputed',
                'needs_review',
                'unavailable',
                'superseded',
              ].includes(String(row.effective_status)))
          )
            return true
        }
        return (
          ['record', 'current_record'].some((key) => invalid(row[key])) ||
          ['records', 'items'].some(
            (key) => Array.isArray(row[key]) && row[key].some(invalid),
          )
        )
      }
      if (invalid(query.state.data)) return true
    }
  }
  return false
}

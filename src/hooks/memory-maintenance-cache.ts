import type { QueryClient } from '@tanstack/react-query'
import { memoryMaintenanceKeys } from './memory-maintenance-keys'
import { memoryRevisionKeys } from './memory-revision-keys'
import type { MemorySourceState } from '@/types/memory-revisions'

type Value = Record<string, unknown>
const record = (value: unknown): value is Value =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const refs = (value: Value, sourceId: string) =>
  Array.isArray(value.sources) &&
  value.sources.some(
    (source) => record(source) && source.source_id === sourceId,
  )

function redact(value: unknown, sourceId: string): unknown {
  if (!record(value)) return value
  if (Array.isArray(value.candidates)) {
    let changed = false
    const candidates = value.candidates.map((candidate) => {
      if (!record(candidate) || !refs(candidate, sourceId)) return candidate
      if (
        candidate.redacted === true &&
        candidate.content === null &&
        candidate.base_content === null &&
        candidate.patch === null &&
        candidate.diff === null &&
        candidate.reason === null
      )
        return candidate
      changed = true
      return {
        ...candidate,
        state: 'redacted',
        redacted: true,
        content: null,
        base_content: null,
        patch: null,
        diff: null,
        reason: null,
      }
    })
    return changed ? { ...value, candidates } : value
  }
  if (Array.isArray(value.jobs)) {
    const jobs = value.jobs.map((job) => redact(job, sourceId))
    return jobs.some((job, index) => job !== (value.jobs as unknown[])[index])
      ? { ...value, jobs }
      : value
  }
  if (
    Array.isArray(value.inputs) &&
    value.inputs.some(
      (input) => record(input) && input.source_id === sourceId,
    ) &&
    !['stale', 'redacted', 'canceled'].includes(String(value.state))
  )
    return { ...value, state: 'stale' }
  return value
}

/** A known source withdrawal also fences stale, already in-flight candidate GETs. */
export function filterMaintenanceWithdrawals<T>(
  cache: QueryClient,
  memoryId: string,
  value: T,
): T {
  let result: unknown = value
  for (const [, source] of cache.getQueriesData<MemorySourceState>({
    queryKey: memoryRevisionKeys.sources(memoryId),
  })) {
    if (
      source?.memory_id === memoryId &&
      source.managed &&
      ['forgotten', 'deleted', 'withdrawn'].includes(source.state)
    )
      result = redact(result, source.source_id)
  }
  for (const [, sourceId] of cache.getQueriesData<string>({
    queryKey: memoryMaintenanceKeys.withdrawals(memoryId),
  }))
    if (sourceId) result = redact(result, sourceId)
  return result as T
}

export async function redactMaintenanceSource(
  cache: QueryClient,
  memoryId: string,
  sourceId: string,
): Promise<void> {
  cache.setQueryData(
    memoryMaintenanceKeys.withdrawal(memoryId, sourceId),
    sourceId,
  )
  const key = memoryMaintenanceKeys.bank(memoryId)
  if (
    !cache
      .getQueriesData({ queryKey: key })
      .some(([, value]) => redact(value, sourceId) !== value)
  )
    return
  await cache.cancelQueries({ queryKey: key }, { revert: false })
  cache.setQueriesData({ queryKey: key }, (value) => redact(value, sourceId))
}

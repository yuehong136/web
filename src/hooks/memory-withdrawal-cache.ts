import type { QueryClient } from '@tanstack/react-query'
import { memoryKeys } from '@/hooks/use-memory'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import type { MemorySourceState } from '@/types/memory-revisions'

type RecordValue = Record<string, unknown>
const record = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const permanent = (value: unknown) =>
  value === 'forgotten' || value === 'deleted' || value === 'withdrawn'
function identity(value: unknown): string | null {
  if (typeof value === 'number')
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null
  return typeof value === 'string' &&
    value.length <= 19 &&
    /^[1-9][0-9]*$/.test(value)
    ? value
    : null
}

/** Only a managed permanent source is proof that normal supply has stopped. */
export function confirmedWithdrawnSource(
  memoryId: string,
  value: unknown,
): MemorySourceState | null {
  if (
    !record(value) ||
    value.memory_id !== memoryId ||
    value.managed !== true ||
    !permanent(value.state)
  )
    return null
  const id = identity(value.source_id)
  return id
    ? ({ ...value, source_id: id } as unknown as MemorySourceState)
    : null
}

export function operationWithdrawnSource(
  memoryId: string,
  value: unknown,
): MemorySourceState | null {
  return record(value) ? confirmedWithdrawnSource(memoryId, value.source) : null
}

function hasSource(revision: RecordValue, sourceId: string): boolean {
  return (
    Array.isArray(revision.sources) &&
    revision.sources.some(
      (ref: unknown) => record(ref) && identity(ref.source_id) === sourceId,
    )
  )
}

/** Cancel old reads before replacing their data; cancellation must not restore old snapshots. */
export async function redactWithdrawnSource(
  cache: QueryClient,
  memoryId: string,
  source: MemorySourceState,
  origin: 'command' | 'source-read' = 'command',
): Promise<void> {
  if (!confirmedWithdrawnSource(memoryId, source)) return
  const sourceId = source.source_id
  const sameCacheSource = (value: unknown): boolean =>
    identity(value) === sourceId ||
    (typeof value === 'number' &&
      Number.isInteger(value) &&
      !Number.isSafeInteger(value) &&
      value === Number(sourceId))
  const affected = new Set<string>()
  const canonicalAffected = new Set<string>()
  const roundedAffected = new Set<number>()
  // Rounded legacy IDs can only widen local body eviction, never select server IO.
  const addCacheIdentity = (value: unknown): void => {
    const exact = identity(value)
    if (exact) {
      affected.add(exact)
      canonicalAffected.add(exact)
      const rounded = Number(exact)
      if (!Number.isSafeInteger(rounded)) roundedAffected.add(rounded)
    } else if (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value > 0
    ) {
      affected.add(String(value))
      roundedAffected.add(value)
    }
  }
  addCacheIdentity(sourceId)
  const matchesAffected = (value: unknown): boolean => {
    const exact = identity(value)
    return (
      (exact !== null && canonicalAffected.has(exact)) ||
      (typeof value === 'number' &&
        !Number.isSafeInteger(value) &&
        roundedAffected.has(value))
    )
  }
  const lists = cache.getQueriesData<unknown>({
    queryKey: memoryKeys.messages(memoryId),
  })
  const entries = cache.getQueriesData<unknown>({
    queryKey: memoryRevisionKeys.entries(memoryId),
  })
  const histories = cache.getQueriesData<unknown>({
    queryKey: memoryRevisionKeys.histories(memoryId),
  })
  let dirty = false
  const sensitiveRevision = (value: RecordValue): boolean =>
    value.content !== null ||
    value.redacted !== true ||
    (record(value.assessment) &&
      Object.keys(value.assessment).some(
        (key) => key !== 'kind' && key !== 'verification_status',
      ))
  const collectMessage = (value: unknown, inherited = false): void => {
    if (!record(value) || value.memory_id !== memoryId) return
    const matches =
      inherited ||
      sameCacheSource(value.message_id) ||
      sameCacheSource(value.source_id) ||
      matchesAffected(value.message_id) ||
      hasSource(value, sourceId)
    if (matches) {
      addCacheIdentity(value.message_id)
      if (
        (typeof value.content === 'string' && value.content.length > 0) ||
        value.content_embed != null ||
        (identity(value.message_id) === sourceId &&
          !permanent(value.managed_source_state))
      )
        dirty = true
    }
    if (Array.isArray(value.extract))
      value.extract.forEach((child) => collectMessage(child, matches))
  }
  const collectList = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach((item) => collectMessage(item))
    else if (record(value)) {
      if (Array.isArray(value.message_list))
        value.message_list.forEach((item) => collectMessage(item))
      if (record(value.messages)) collectList(value.messages)
    }
  }
  lists.forEach(([, value]) => collectList(value))
  for (const [, value] of entries) {
    if (
      record(value) &&
      value.memory_id === memoryId &&
      record(value.current) &&
      hasSource(value.current, sourceId)
    ) {
      dirty ||= sensitiveRevision(value.current)
      for (const id of [
        value.legacy_message_id,
        value.current_message_id,
        value.current.message_id,
      ]) {
        addCacheIdentity(id)
      }
    }
  }
  for (const [, value] of histories)
    if (record(value) && Array.isArray(value.revisions)) {
      for (const revision of value.revisions)
        if (record(revision) && hasSource(revision, sourceId)) {
          addCacheIdentity(revision.message_id)
          dirty ||= sensitiveRevision(revision)
        }
    }
  lists.forEach(([, value]) => collectList(value))
  for (const id of affected) {
    const body = cache.getQueryData<unknown>(
      memoryKeys.messageContent(memoryId, id),
    )
    if (
      record(body) &&
      ((typeof body.content === 'string' && body.content.length > 0) ||
        body.content_embed != null)
    )
      dirty = true
  }
  const prior = confirmedWithdrawnSource(
    memoryId,
    cache.getQueryData(memoryRevisionKeys.source(memoryId, sourceId)),
  )
  if (
    !dirty &&
    prior?.generation === source.generation &&
    prior.content_sha256 === source.content_sha256 &&
    prior.state === source.state
  )
    return
  await Promise.all([
    cache.cancelQueries(
      { queryKey: memoryKeys.messages(memoryId) },
      { revert: false },
    ),
    cache.cancelQueries(
      { queryKey: memoryRevisionKeys.entries(memoryId) },
      { revert: false },
    ),
    cache.cancelQueries(
      { queryKey: memoryRevisionKeys.histories(memoryId) },
      { revert: false },
    ),
    ...[...affected].map((id) =>
      cache.cancelQueries(
        { queryKey: memoryKeys.messageContent(memoryId, id) },
        { revert: false },
      ),
    ),
    ...(origin === 'command'
      ? [
          cache.cancelQueries(
            { queryKey: memoryRevisionKeys.source(memoryId, sourceId) },
            { revert: false },
          ),
        ]
      : []),
  ])
  const matches = (value: RecordValue) =>
    value.memory_id === memoryId &&
    (sameCacheSource(value.message_id) ||
      sameCacheSource(value.source_id) ||
      matchesAffected(value.message_id) ||
      hasSource(value, sourceId))
  const updateRows = (rows: unknown[], metadata: boolean): unknown[] =>
    rows.flatMap((value) => {
      if (!record(value) || value.memory_id !== memoryId) return [value]
      if (matches(value)) {
        if (!metadata || value.message_type !== 'raw') return []
        const {
          content: _content,
          content_embed: _embed,
          extract: _extract,
          ...rest
        } = value
        return [
          {
            ...rest,
            status: false,
            managed_source_state:
              source.state === 'deleted' ? 'deleted' : 'forgotten',
            extract: [],
          },
        ]
      }
      if (Array.isArray(value.extract))
        return [{ ...value, extract: updateRows(value.extract, false) }]
      return [value]
    })
  const updateList = (value: unknown): unknown => {
    if (Array.isArray(value)) return updateRows(value, false)
    if (!record(value)) return value
    if (Array.isArray(value.message_list))
      return { ...value, message_list: updateRows(value.message_list, true) }
    if (record(value.messages))
      return { ...value, messages: updateList(value.messages) }
    return value
  }
  cache.setQueriesData<unknown>(
    { queryKey: memoryKeys.messages(memoryId) },
    updateList,
  )
  for (const id of affected)
    if (cache.getQueryState(memoryKeys.messageContent(memoryId, id))) {
      cache.setQueryData(memoryKeys.messageContent(memoryId, id), {
        content: '',
        unavailable_due_to_withdrawal: true,
      })
    }
  const redactRevision = (value: unknown): unknown => {
    if (!record(value) || !hasSource(value, sourceId)) return value
    const assessment = record(value.assessment) ? value.assessment : {}
    return {
      ...value,
      content: null,
      redacted: true,
      assessment: {
        kind: assessment.kind,
        verification_status: assessment.verification_status,
      },
    }
  }
  cache.setQueriesData<unknown>(
    { queryKey: memoryRevisionKeys.entries(memoryId) },
    (value: unknown) =>
      record(value) &&
      value.memory_id === memoryId &&
      record(value.current) &&
      hasSource(value.current, sourceId)
        ? {
            ...value,
            state: 'withdrawn',
            current: redactRevision(value.current),
          }
        : value,
  )
  cache.setQueriesData<unknown>(
    { queryKey: memoryRevisionKeys.histories(memoryId) },
    (value: unknown) =>
      record(value) && Array.isArray(value.revisions)
        ? { ...value, revisions: value.revisions.map(redactRevision) }
        : value,
  )
  if (origin === 'command')
    cache.setQueryData(memoryRevisionKeys.source(memoryId, sourceId), source)
  else {
    // A source read can cancel an initial normal read with no data. Resume it
    // against the now-confirmed server policy rather than leaving a spinner.
    void Promise.all([
      cache.invalidateQueries({
        queryKey: memoryKeys.messages(memoryId),
        refetchType: 'active',
      }),
      cache.invalidateQueries({
        queryKey: memoryRevisionKeys.entries(memoryId),
        refetchType: 'active',
      }),
      cache.invalidateQueries({
        queryKey: memoryRevisionKeys.histories(memoryId),
        refetchType: 'active',
      }),
    ])
  }
}

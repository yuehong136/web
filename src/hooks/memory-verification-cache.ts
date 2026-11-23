import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { memoryRevisionKeys } from './memory-revision-keys'
import { memoryVerificationKeys } from './memory-verification-keys'
import type { MemoryEntry, MemorySourceState } from '@/types/memory-revisions'
import type { MemoryVerificationBinding } from '@/types/memory-verification'
type Value = Record<string, unknown>
const object = (value: unknown): value is Value =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const under = (key: QueryKey, prefix: QueryKey) =>
  prefix.every((part, index) => key[index] === part)
const decimal = (value: unknown) =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' && Number.isSafeInteger(value)
      ? String(value)
      : null
const older = (known: unknown, expected: string) => {
  const value = decimal(known)
  return (
    value !== null &&
    /^[0-9]+$/.test(value) &&
    /^[0-9]+$/.test(expected) &&
    BigInt(value) < BigInt(expected)
  )
}
function invalidBinding(
  cache: QueryClient,
  id: string,
  binding: MemoryVerificationBinding,
): { stale: boolean; redacted: boolean } {
  let stale = false,
    redacted = false
  for (const ref of binding.sources) {
    const source = cache.getQueryData<MemorySourceState>(
      memoryRevisionKeys.source(id, ref.source_id),
    )
    if (!source || source.memory_id !== id) continue
    if (
      !['forgotten', 'deleted', 'withdrawn'].includes(source.state) &&
      (older(source.generation, ref.source_generation) ||
        older(source.source_revision, ref.source_revision))
    )
      continue
    if (['forgotten', 'deleted', 'withdrawn'].includes(source.state)) {
      stale = true
      redacted = true
    } else if (
      source.state !== 'active' ||
      decimal(source.source_revision) !== ref.source_revision ||
      decimal(source.generation) !== ref.source_generation ||
      source.content_sha256 !== ref.content_sha256
    )
      stale = true
  }
  for (const [, entry] of cache.getQueriesData<MemoryEntry>({
    queryKey: memoryRevisionKeys.entries(id),
  })) {
    if (
      !entry ||
      entry.memory_id !== id ||
      entry.entry_id !== binding.entry.entry_id
    )
      continue
    if (
      older(entry.generation, binding.entry.generation) ||
      older(entry.current_revision, binding.entry.revision)
    )
      continue
    if (
      entry.state !== 'active' ||
      decimal(entry.current_revision) !== binding.entry.revision ||
      entry.current_message_id !== binding.entry.message_id ||
      decimal(entry.generation) !== binding.entry.generation ||
      entry.current.content_sha256 !== binding.entry.content_sha256
    )
      stale = true
    if (entry.current.redacted || entry.current.content === null) {
      stale = true
      redacted = true
    }
  }
  return { stale, redacted }
}
function latestKnownHead(cache: QueryClient, id: string, eid: string): bigint {
  let latest = 0n
  const inspect = (value: unknown): void => {
    if (!object(value)) return
    if (
      value.entry_id === eid &&
      typeof value.head_version === 'string' &&
      /^[0-9]+$/.test(value.head_version)
    ) {
      const head = BigInt(value.head_version)
      if (head > latest) latest = head
    }
    for (const key of ['record', 'current_record']) inspect(value[key])
    for (const key of ['records', 'items'])
      if (Array.isArray(value[key])) value[key].forEach(inspect)
  }
  for (const [, value] of cache.getQueriesData({
    queryKey: memoryVerificationKeys.bank(id),
  }))
    inspect(value)
  return latest
}
function knownBindingRedacted(
  cache: QueryClient,
  id: string,
  entryId: unknown,
  hash: unknown,
): boolean {
  let redacted = false
  const inspect = (value: unknown): void => {
    if (!object(value)) return
    if (
      value.memory_id === id &&
      value.entry_id === entryId &&
      value.binding_sha256 === hash &&
      (value.state === 'redacted' || value.effective_status === 'redacted')
    )
      redacted = true
    for (const key of ['record', 'current_record']) inspect(value[key])
    for (const key of ['records', 'items'])
      if (Array.isArray(value[key])) value[key].forEach(inspect)
  }
  if (typeof hash === 'string')
    for (const [, value] of cache.getQueriesData({
      queryKey: memoryVerificationKeys.bank(id),
    }))
      inspect(value)
  return redacted
}
function knownNegative(
  cache: QueryClient,
  id: string,
  vid: unknown,
): string | undefined {
  const priorities = [
    'unavailable',
    'stale',
    'revoked',
    'superseded',
    'redacted',
  ]
  let result: string | undefined
  const inspect = (value: unknown): void => {
    if (!object(value)) return
    if (
      value.memory_id === id &&
      value.verification_id === vid &&
      typeof value.effective_status === 'string' &&
      priorities.includes(value.effective_status) &&
      (!result ||
        priorities.indexOf(value.effective_status) > priorities.indexOf(result))
    )
      result = value.effective_status
    for (const key of ['record', 'current_record']) inspect(value[key])
    for (const key of ['records', 'items'])
      if (Array.isArray(value[key])) value[key].forEach(inspect)
  }
  if (typeof vid === 'string')
    for (const [, value] of cache.getQueriesData({
      queryKey: memoryVerificationKeys.bank(id),
    }))
      inspect(value)
  return result
}
/** Known local dependency changes fence stale responses; this does not replace server revalidation. */
export function protectMemoryVerification<T>(
  cache: QueryClient,
  id: string,
  value: T,
): T {
  function protect(raw: unknown): unknown {
    if (!object(raw)) return raw
    const next = { ...raw }
    let changed = false
    for (const key of ['records', 'items']) {
      const previous = raw[key]
      if (Array.isArray(previous)) {
        const protectedRows = previous.map(protect)
        const rows =
          key === 'items'
            ? protectedRows.filter(
                (row) =>
                  object(row) &&
                  row.is_current === true &&
                  row.review_required === true,
              )
            : protectedRows
        if (
          rows.length !== previous.length ||
          rows.some((row, index) => row !== previous[index])
        ) {
          next[key] = rows
          changed = true
        }
      }
    }
    for (const key of ['record', 'current_record'])
      if (object(raw[key])) {
        const row = protect(raw[key])
        if (row !== raw[key]) {
          next[key] = row
          changed = true
        }
      }
    if (
      raw.memory_id === id &&
      object(raw.binding) &&
      object(raw.binding.entry) &&
      Array.isArray(raw.binding.sources)
    ) {
      const status = invalidBinding(
        cache,
        id,
        raw.binding as unknown as MemoryVerificationBinding,
      )
      const oldHead =
        typeof raw.head_version === 'string' &&
        /^[0-9]+$/.test(raw.head_version) &&
        typeof raw.entry_id === 'string' &&
        latestKnownHead(cache, id, raw.entry_id) > BigInt(raw.head_version)
      if (oldHead && 'entry_content' in raw && raw.can_record !== false) {
        next.can_record = false
        changed = true
      }
      if (oldHead && raw.is_current === true) {
        Object.assign(next, {
          is_current: false,
          effective_status: 'superseded',
          valid_for_current: false,
          review_required: false,
          can_actions: { record: false, revoke: false },
        })
        changed = true
      }

      const nested = next.current_record
      if (
        'entry_content' in raw &&
        (knownBindingRedacted(cache, id, raw.entry_id, raw.binding_sha256) ||
          (object(nested) &&
            nested.binding_sha256 === raw.binding_sha256 &&
            (nested.state === 'redacted' ||
              nested.effective_status === 'redacted')))
      ) {
        status.stale = true
        status.redacted = true
      }
      const negative = knownNegative(cache, id, raw.verification_id)
      if (negative) {
        status.stale = true
        if (negative === 'redacted') status.redacted = true
      }
      if (status.stale) {
        if ('entry_content' in raw) {
          if (raw.can_record !== false) {
            next.can_record = false
            changed = true
          }
          if (status.redacted && raw.entry_content !== null) {
            next.entry_content = null
            changed = true
          }
        }
        if ('effective_status' in raw) {
          const current = !oldHead && raw.is_current === true
          const state = status.redacted
            ? 'redacted'
            : !current
              ? 'superseded'
              : raw.state === 'revoked' || negative === 'revoked'
                ? 'revoked'
                : negative === 'unavailable'
                  ? 'unavailable'
                  : 'stale'
          const reviewRequired = current && ['stale', 'revoked'].includes(state)
          if (
            raw.effective_status !== state ||
            raw.valid_for_current !== false
          ) {
            Object.assign(next, {
              effective_status: state,
              ...(state === 'revoked' ? { state: 'revoked' } : {}),
              valid_for_current: false,
              review_required: reviewRequired,
              stale_reasons: [
                ...(Array.isArray(raw.stale_reasons) ? raw.stale_reasons : []),
                'local_dependency_changed',
              ],
              can_actions: {
                ...(object(raw.can_actions) ? raw.can_actions : {}),
                record: false,
              },
            })
            changed = true
          }
          if (
            status.redacted &&
            (raw.notes !== null ||
              raw.applicability !== null ||
              raw.revocation_reason !== null ||
              (Array.isArray(raw.evidence) && raw.evidence.length))
          ) {
            Object.assign(next, {
              notes: null,
              applicability: null,
              evidence: [],
              revocation_reason: null,
              state: 'redacted',
              can_actions: { record: false, revoke: false },
            })
            changed = true
          }
        }
      }
    }
    return changed ? next : raw
  }
  return protect(value) as T
}
const fencing = new WeakMap<QueryClient, Set<string>>()
/** Cancel without restoring old values, then reapply the current source fences. */
export async function refreshMemoryVerificationFences(
  cache: QueryClient,
  id: string,
): Promise<void> {
  const active = fencing.get(cache) ?? new Set<string>()
  fencing.set(cache, active)
  if (active.has(id)) return
  let canceled: Promise<void> | undefined
  active.add(id)
  try {
    const affected = cache
      .getQueryCache()
      .findAll({ queryKey: memoryVerificationKeys.bank(id) })
      .filter(
        (query) =>
          protectMemoryVerification(cache, id, query.state.data) !==
          query.state.data,
      )
    if (!affected.length) return
    const hashes = new Set(affected.map((query) => query.queryHash))
    canceled = cache.cancelQueries(
      { predicate: (query) => hashes.has(query.queryHash) },
      { revert: false },
    )
    cache.setQueriesData(
      { queryKey: memoryVerificationKeys.bank(id) },
      (value) => protectMemoryVerification(cache, id, value),
    )
  } finally {
    active.delete(id)
  }
  if (canceled) await canceled
  // The short reentrancy guard covers our own synchronous cache notifications only.
  // A real source update during cancellation must be able to redact immediately.
  active.add(id)
  try {
    cache.setQueriesData(
      { queryKey: memoryVerificationKeys.bank(id) },
      (value) => protectMemoryVerification(cache, id, value),
    )
  } finally {
    active.delete(id)
  }
}

export function watchMemoryVerificationFences(
  cache: QueryClient,
  id: string,
): () => void {
  void refreshMemoryVerificationFences(cache, id)
  return cache.getQueryCache().subscribe((event) => {
    const key = event.query.queryKey
    if (
      under(key, memoryRevisionKeys.sources(id)) ||
      under(key, memoryRevisionKeys.entries(id)) ||
      under(key, memoryVerificationKeys.bank(id))
    )
      void refreshMemoryVerificationFences(cache, id)
  })
}

import type { QueryClient } from '@tanstack/react-query'
import { memoryRevisionKeys } from './memory-revision-keys'
import type {
  MemorySourceProvenance,
  MemorySourceBinding,
} from '@/types/memory-sources'
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const number = (v: unknown): bigint | null =>
  typeof v === 'string' && /^[0-9]+$/.test(v)
    ? BigInt(v)
    : typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
      ? BigInt(v)
      : null
/** Known source/bank changes clear this local snapshot; never an authorization substitute. */
export function sourceProvenanceChanged(
  cache: QueryClient,
  memoryId: string,
  sourceId: string,
  value?: MemorySourceProvenance | MemorySourceBinding,
): boolean {
  const withdrawn = (row: unknown): boolean => {
    if (!object(row)) return false
    if (
      row.kind === 'delete_memory' &&
      ['deleting', 'deleted'].includes(String(row.lifecycle))
    )
      return true
    const withdrawnId =
      object(row.source) && row.source.source_id !== undefined
        ? row.source.source_id
        : row.source_id
    if (
      row.kind === 'withdraw_source' &&
      String(withdrawnId) === sourceId &&
      row.stop_supply === 'withdrawn'
    )
      return true
    return Array.isArray(row.operations) && row.operations.some(withdrawn)
  }
  if (
    cache
      .getQueriesData({ queryKey: memoryRevisionKeys.bank(memoryId) })
      .some(([, row]) => withdrawn(row))
  )
    return true
  const known = cache.getQueryData<Record<string, unknown>>(
    memoryRevisionKeys.source(memoryId, sourceId),
  )
  if (!known || known.memory_id !== memoryId) return false
  if (
    ['inactive', 'forgotten', 'deleted', 'withdrawn'].includes(
      String(known.state),
    )
  )
    return true
  if (!value) return false
  const revision = number(value.source_revision),
    generation = number(value.source_generation),
    kr = number(known.source_revision),
    kg = number(known.generation)
  if (
    (revision !== null && kr !== null && kr < revision) ||
    (generation !== null && kg !== null && kg < generation)
  )
    return false
  const scope = known.scope
  return (
    known.content_sha256 !== value.content_sha256 ||
    (revision !== null && kr !== revision) ||
    (generation !== null && kg !== generation) ||
    (object(scope) &&
      ['user_id', 'agent_id', 'session_id'].some(
        (key) => scope[key] !== value.scope[key as keyof typeof value.scope],
      ))
  )
}

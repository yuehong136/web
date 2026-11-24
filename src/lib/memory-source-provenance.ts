import type {
  MemorySourceBinding,
  MemorySourceProvenance,
  MemorySourceRole,
} from '@/types/memory-sources'
import type { MemorySourceState } from '@/types/memory-revisions'
const roles: MemorySourceRole[] = ['user', 'assistant', 'tool', 'unknown']
const decimal = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[1-9][0-9]*$/.test(value) &&
  BigInt(value) <= 9223372036854775807n
const hash = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
export function sourceStateBinding(
  value: MemorySourceState,
): MemorySourceBinding | undefined {
  if (
    value.source_revision === null ||
    value.generation === null ||
    !Number.isSafeInteger(value.source_revision) ||
    !Number.isSafeInteger(value.generation)
  )
    return
  const revision = String(value.source_revision),
    generation = String(value.generation)
  if (
    !decimal(revision) ||
    !decimal(generation) ||
    !hash(value.content_sha256) ||
    !['user_id', 'agent_id', 'session_id'].every(
      (field) => typeof value.scope[field] === 'string',
    )
  )
    return
  return {
    source_id: value.source_id,
    source_revision: revision,
    source_generation: generation,
    content_sha256: value.content_sha256,
    scope: value.scope as MemorySourceBinding['scope'],
  }
}
/** A response must match the selected version before any content or attribution is shown. */
export function validateSourceProvenance(
  value: MemorySourceProvenance,
  memoryId: string,
  sourceId: string,
  expected?: MemorySourceBinding,
  includeSegments = false,
): void {
  const structured = value.format === 'structured'
  if (
    value.memory_id !== memoryId ||
    value.source_id !== sourceId ||
    !decimal(sourceId) ||
    !hash(value.content_sha256) ||
    !['structured', 'legacy_combined'].includes(value.format) ||
    value.provenance.speaker_identity_verified !== false ||
    value.provenance.content_verified !== false ||
    !['user_id', 'agent_id', 'session_id'].every(
      (key) => typeof value.scope[key as keyof typeof value.scope] === 'string',
    )
  )
    throw new Error('source_provenance_invalid')
  if (
    expected &&
    (value.source_revision !== expected.source_revision ||
      value.source_generation !== expected.source_generation ||
      value.content_sha256 !== expected.content_sha256 ||
      (expected.provenance_sha256 !== undefined &&
        value.provenance_sha256 !== expected.provenance_sha256) ||
      ['user_id', 'agent_id', 'session_id'].some(
        (key) =>
          value.scope[key as keyof typeof value.scope] !==
          expected.scope[key as keyof typeof expected.scope],
      ))
  )
    throw new Error('source_provenance_changed')
  if (structured) {
    if (
      !decimal(value.source_revision) ||
      !decimal(value.source_generation) ||
      !hash(value.provenance_sha256) ||
      value.role_status !== 'caller_declared' ||
      value.provenance.kind !== 'authenticated_submission' ||
      value.provenance.authenticated_submitter !== true ||
      typeof value.provenance.submitted_by !== 'string' ||
      typeof value.received_at !== 'string' ||
      !Number.isSafeInteger(value.segment_count) ||
      value.segment_count! < 1 ||
      value.segment_count! > 32 ||
      !Array.isArray(value.declared_roles) ||
      value.declared_roles.some((role) => !roles.includes(role))
    )
      throw new Error('source_provenance_invalid')
  } else if (
    value.role_status !== 'role_unknown' ||
    value.provenance.kind !== 'legacy_unknown' ||
    value.provenance.authenticated_submitter ||
    value.provenance.submitted_by !== null ||
    value.received_at !== null ||
    value.segment_count !== null ||
    value.declared_roles.length ||
    value.event_time.status !== 'unknown' ||
    value.event_time.value !== null
  )
    throw new Error('source_provenance_invalid')
  if (!includeSegments && (value.segments_included || value.segments !== null))
    throw new Error('source_provenance_unrequested_body')
  if (
    includeSegments &&
    structured &&
    (!value.segments_included ||
      !Array.isArray(value.segments) ||
      value.segments.length !== value.segment_count ||
      value.segments.some(
        (segment) =>
          !roles.includes(segment.role) ||
          typeof segment.content !== 'string' ||
          !segment.content.trim(),
      ))
  )
    throw new Error('source_provenance_invalid')
}

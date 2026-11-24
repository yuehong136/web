import type {
  MemoryCompactionResult,
  MemoryCompactionReference,
  MemoryCompactionSource,
} from '@/types/memory-compaction'
import type { MemoryBoundSourceReference } from '@/types/memory-startup'

const decimal = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 19 &&
  /^[1-9][0-9]*$/.test(value) &&
  BigInt(value) <= 9223372036854775807n
const hash = (value: unknown) =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const states = [
  'running',
  'generated',
  'failed',
  'stale',
  'canceled',
  'persistence_unknown',
]

/** Fail closed for a mismatched response or invented lineage; source truth still requires the server's fresh read. */
export function validateCompactionResult(
  value: MemoryCompactionResult,
  memoryId: string,
  operationId: string,
): void {
  if (
    value.operation.memory_id !== memoryId ||
    value.operation.operation_id !== operationId ||
    value.operation.kind !== 'context_compact' ||
    !states.includes(value.operation.status)
  )
    throw new Error('compaction_operation_binding_mismatch')
  const artifact = value.artifact
  if (!artifact) throw new Error('compaction_artifact_missing')
  if (
    artifact.memory_id !== memoryId ||
    artifact.operation_id !== operationId ||
    value.operation.artifact_id !== artifact.artifact_id ||
    !states.includes(artifact.state) ||
    !Array.isArray(artifact.sources) ||
    artifact.sources.length > 32
  )
    throw new Error('compaction_artifact_binding_mismatch')
  for (const source of artifact.sources) {
    if (
      !decimal(source.source_id) ||
      !decimal(source.source_revision) ||
      !decimal(source.source_generation) ||
      !hash(source.content_sha256) ||
      (source.provenance_sha256 !== null && !hash(source.provenance_sha256)) ||
      source.locator.kind !== 'memory_message' ||
      source.locator.memory_id !== memoryId ||
      source.locator.message_id !== source.source_id ||
      !['user_id', 'agent_id', 'session_id'].every(
        (field) =>
          typeof source.scope[field as keyof typeof source.scope] === 'string',
      )
    )
      throw new Error('compaction_source_binding_mismatch')
  }
  const body = artifact.package
  if (artifact.retired_at != null || value.operation.retired_at != null) {
    const receipt = artifact.retirement
    if (
      typeof artifact.retired_at !== 'string' ||
      !Number.isFinite(Date.parse(artifact.retired_at)) ||
      value.operation.retired_at !== artifact.retired_at ||
      artifact.state !== 'stale' ||
      value.operation.status !== 'stale' ||
      value.operation.error_code !== 'compaction_retired' ||
      artifact.error_code !== 'compaction_retired' ||
      value.operation.writer_busy !== false ||
      value.operation.needs_operator_reconciliation !== false ||
      body !== null ||
      artifact.sources.length !== 0 ||
      artifact.redacted !== true ||
      artifact.valid_for_current !== false ||
      receipt?.retired_at !== artifact.retired_at ||
      receipt.input_manifest_sha256 !== artifact.input_manifest_sha256 ||
      !hash(receipt.input_manifest_sha256) ||
      !hash(receipt.preview_sha256)
    )
      throw new Error('invalid_retired_compaction_receipt')
  }
  if (!body) return
  if (
    artifact.valid_for_current !== true ||
    artifact.validity_checked !== true ||
    artifact.redacted !== false ||
    body.schema !== 'memory_context_compaction' ||
    body.schema_version !== 1 ||
    body.data_only !== true ||
    (body.summary !== null && typeof body.summary !== 'string') ||
    !Array.isArray(body.covered) ||
    !Array.isArray(body.retained) ||
    !Array.isArray(body.lineage) ||
    !body.lineage.length ||
    body.lineage.length !== artifact.sources.length ||
    body.omitted.source_count !== 0 ||
    body.omitted.codepoints !== 0
  )
    throw new Error('invalid_compaction_package')
  if (
    body.covered.some(
      (span) =>
        span.offset !== 0 ||
        span.offset_unit !== 'unicode_codepoint' ||
        !Number.isSafeInteger(span.end_offset) ||
        span.end_offset < 0,
    ) ||
    body.retained.some((block) => typeof block.content !== 'string')
  )
    throw new Error('invalid_compaction_span')
  const ordered = artifact.sources.map((s) => s.source_id)
  if (
    new Set(ordered).size !== ordered.length ||
    JSON.stringify([
      ...body.covered.map((s) => s.source_id),
      ...body.retained.map((s) => s.source_id),
    ]) !== JSON.stringify(ordered)
  )
    throw new Error('compaction_source_order_changed')
  const signature = (s: MemoryCompactionSource) => [
    s.source_id,
    s.source_revision,
    s.source_generation,
    s.content_sha256,
    s.provenance_sha256,
    s.scope.user_id,
    s.scope.agent_id,
    s.scope.session_id,
    s.locator.memory_id,
    s.locator.message_id,
    s.format,
    s.role_status,
    s.reference_time,
    s.event_time.status,
    s.event_time.value,
  ]
  if (
    body.lineage.some(
      (s, index) =>
        JSON.stringify(signature(s)) !==
        JSON.stringify(signature(artifact.sources[index]!)),
    )
  )
    throw new Error('compaction_lineage_changed')
}

export function compactionReaderSource(
  source: MemoryCompactionSource,
): MemoryBoundSourceReference {
  const { provenance_sha256, ...binding } = source
  return { ...binding, ...(provenance_sha256 ? { provenance_sha256 } : {}) }
}

/** A generated artifact is neither an applied context nor a completed in-flight provider attempt. */
export function compactionBodyReady(
  value: MemoryCompactionResult | undefined,
): boolean {
  return (
    value?.operation.status === 'generated' &&
    !value.operation.writer_busy &&
    !value.operation.needs_operator_reconciliation &&
    value.artifact?.state === 'generated' &&
    value.artifact.valid_for_current === true &&
    value.artifact.validity_checked === true &&
    value.artifact.redacted === false &&
    !value.artifact.retired_at &&
    !!value.artifact.package
  )
}

export function compactionNeedsPolling(
  value: MemoryCompactionResult | undefined,
): boolean {
  return (
    !!value &&
    (value.operation.writer_busy ||
      (!value.operation.needs_operator_reconciliation &&
        value.operation.status === 'running'))
  )
}

export function compactionOperationHref(
  memoryId: string,
  operationId: string,
): string {
  return `/memory/${encodeURIComponent(memoryId)}/compaction?${new URLSearchParams({ compaction_operation: operationId })}`
}

export function compactionCanStartNew(
  value: MemoryCompactionResult | undefined,
): boolean {
  return (
    !!value &&
    !value.operation.writer_busy &&
    !value.operation.needs_operator_reconciliation &&
    ['generated', 'failed', 'stale', 'canceled'].includes(
      value.operation.status,
    )
  )
}

/** Export only an explicitly fresh, currently valid binding; the consumer must independently re-read it. */
export function compactionConsumptionReference(
  value: MemoryCompactionResult,
  memoryId: string,
  operationId: string,
): MemoryCompactionReference {
  validateCompactionResult(value, memoryId, operationId)
  if (
    !compactionBodyReady(value) ||
    !hash(value.artifact.input_manifest_sha256) ||
    ![memoryId, operationId, value.artifact.artifact_id].every(
      (id) => typeof id === 'string' && id.length > 0 && !/\p{Cc}/u.test(id),
    )
  )
    throw new Error('compaction_reference_unavailable')
  return {
    memory_id: memoryId,
    operation_id: operationId,
    artifact_id: value.artifact.artifact_id,
    input_manifest_sha256: value.artifact.input_manifest_sha256,
  }
}

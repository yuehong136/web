import type {
  MemoryCompactionResult,
  MemoryCompactionRetentionCapability,
} from '@/types/memory-compaction'
import type {
  MemoryCompactionInventory,
  MemoryCompactionRetentionPreview,
} from '@/types/memory-compaction-retention'
import { validateCompactionResult } from './memory-compaction'

const count = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const hash = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const date = (value: unknown) =>
  value === null ||
  (typeof value === 'string' && Number.isFinite(Date.parse(value)))
const decimal = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[1-9][0-9]{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n
const states = [
  'running',
  'generated',
  'failed',
  'stale',
  'canceled',
  'persistence_unknown',
] as const

export function compactionRetentionSupported(
  value: MemoryCompactionRetentionCapability | undefined,
): boolean {
  return (
    value?.supported === true &&
    value.automatic === false &&
    value.creator_only === true &&
    value.preview_required === true &&
    value.terminal_drained_only === true &&
    value.preserves_generation_operation === true &&
    value.quota_unit === 'artifact' &&
    count(value.max_retained_artifacts) &&
    value.max_retained_artifacts > 0
  )
}

export function validateCompactionInventory(
  value: MemoryCompactionInventory,
  memoryId: string,
): void {
  if (
    value.memory_id !== memoryId ||
    value.unit !== 'artifact' ||
    !count(value.limit) ||
    !value.limit ||
    !count(value.retained_count) ||
    !count(value.retired_count) ||
    !count(value.available_slots) ||
    !count(value.writer_busy_count) ||
    !count(value.unsettled_count) ||
    value.automatic !== false ||
    value.snapshot_only !== true ||
    !value.counts_by_state ||
    states.some((state) => !count(value.counts_by_state[state])) ||
    states.reduce((sum, state) => sum + value.counts_by_state[state], 0) !==
      value.retained_count ||
    value.available_slots !== Math.max(0, value.limit - value.retained_count) ||
    value.writer_busy_count > value.retained_count ||
    value.unsettled_count > value.retained_count
  )
    throw new Error('invalid_compaction_inventory')
}

export function validateRetentionPreview(
  value: MemoryCompactionRetentionPreview,
  current: MemoryCompactionResult,
): void {
  const { artifact, operation } = current,
    pins = value.affected?.consumption_reference
  if (
    value.memory_id !== operation.memory_id ||
    value.operation_id !== operation.operation_id ||
    value.artifact_id !== artifact.artifact_id ||
    value.input_manifest_sha256 !== artifact.input_manifest_sha256 ||
    !hash(value.preview_sha256) ||
    !hash(value.input_manifest_sha256) ||
    typeof value.eligible !== 'boolean' ||
    typeof value.writer_busy !== 'boolean' ||
    !Array.isArray(value.blockers) ||
    value.blockers.some((code) => typeof code !== 'string') ||
    !date(value.retired_at) ||
    value.audit_preserved !== true ||
    value.snapshot_only !== true ||
    !pins ||
    pins.memory_id !== value.memory_id ||
    pins.operation_id !== value.operation_id ||
    pins.artifact_id !== value.artifact_id ||
    pins.input_manifest_sha256 !== value.input_manifest_sha256 ||
    !Array.isArray(value.affected.source_ids) ||
    value.affected.source_ids.length > 32 ||
    value.affected.source_ids.some((id) => !decimal(id)) ||
    new Set(value.affected.source_ids).size !==
      value.affected.source_ids.length ||
    !count(value.affected.source_count) ||
    value.affected.source_count !== value.affected.source_ids.length ||
    typeof value.affected.clears_package !== 'boolean' ||
    ![0, 1].includes(value.affected.releases_slots) ||
    (value.eligible &&
      (value.writer_busy ||
        value.retired_at !== null ||
        value.blockers.length > 0 ||
        value.affected.releases_slots !== 1))
  )
    throw new Error('invalid_compaction_retention_preview')
}

export function retentionCanConfirm(
  preview: MemoryCompactionRetentionPreview | undefined,
  current: MemoryCompactionResult | undefined,
): boolean {
  return (
    !!preview &&
    !!current &&
    preview.eligible === true &&
    preview.writer_busy === false &&
    preview.retired_at === null &&
    !preview.blockers.length &&
    !current.artifact.retired_at &&
    current.operation.writer_busy === false &&
    current.operation.needs_operator_reconciliation === false &&
    ['generated', 'failed', 'stale', 'canceled'].includes(
      current.operation.status,
    )
  )
}

export function validateRetirementResult(
  value: MemoryCompactionResult,
  expected: MemoryCompactionRetentionPreview,
): void {
  validateCompactionResult(value, expected.memory_id, expected.operation_id)
  const { artifact } = value
  if (
    artifact.artifact_id !== expected.artifact_id ||
    artifact.input_manifest_sha256 !== expected.input_manifest_sha256 ||
    !artifact.retired_at ||
    artifact.retirement?.preview_sha256 !== expected.preview_sha256
  )
    throw new Error('invalid_compaction_retirement_receipt')
}

import type {
  MemoryCompactionResult,
  MemoryCompactionRetentionCapability,
} from '@/types/memory-compaction'
import type {
  MemoryCompactionInventory,
  MemoryCompactionRetentionPreview,
} from '@/types/memory-compaction-retention'

export const retentionCapability: MemoryCompactionRetentionCapability = {
  supported: true,
  automatic: false,
  creator_only: true,
  preview_required: true,
  terminal_drained_only: true,
  preserves_generation_operation: true,
  quota_unit: 'artifact',
  max_retained_artifacts: 1000,
}

const retiredAt = '2026-11-22T04:15:05+00:00'
export const previewHash = 'd'.repeat(64)

export function retentionInventory(
  memoryId: string,
  retired: boolean,
): MemoryCompactionInventory {
  return {
    memory_id: memoryId,
    limit: 1000,
    unit: 'artifact',
    automatic: false,
    snapshot_only: true,
    retained_count: retired ? 0 : 1,
    retired_count: retired ? 1 : 0,
    available_slots: retired ? 1000 : 999,
    counts_by_state: {
      running: 0,
      generated: retired ? 0 : 1,
      failed: 0,
      stale: 0,
      canceled: 0,
      persistence_unknown: 0,
    },
    writer_busy_count: 0,
    unsettled_count: 0,
  }
}

export function retentionPreview(
  value: MemoryCompactionResult,
  ticket = previewHash,
): MemoryCompactionRetentionPreview {
  const { artifact } = value
  const retired = !!artifact.retired_at
  const reference = {
    memory_id: artifact.memory_id,
    operation_id: artifact.operation_id,
    artifact_id: artifact.artifact_id,
    input_manifest_sha256: artifact.input_manifest_sha256,
  }
  return {
    ...reference,
    preview_sha256: ticket,
    eligible: !retired,
    blockers: retired ? ['already_retired'] : [],
    retired_at: artifact.retired_at ?? null,
    writer_busy: false,
    affected: {
      consumption_reference: reference,
      source_ids: artifact.sources.map((source) => source.source_id),
      source_count: artifact.sources.length,
      clears_package: !!artifact.package,
      releases_slots: retired ? 0 : 1,
    },
    audit_preserved: true,
    snapshot_only: true,
  }
}

export function retirementReceipt(
  value: MemoryCompactionResult,
  ticket = previewHash,
): MemoryCompactionResult {
  const { artifact } = value
  return {
    operation: {
      ...value.operation,
      status: 'stale',
      error_code: 'compaction_retired',
      retired_at: retiredAt,
    },
    artifact: {
      ...artifact,
      state: 'stale',
      error_code: 'compaction_retired',
      retired_at: retiredAt,
      package: null,
      redacted: true,
      valid_for_current: false,
      sources: [],
      retirement: {
        preview_sha256: ticket,
        retired_at: retiredAt,
        retired_by: 'original-actor',
        prior_state: artifact.state,
        source_count: artifact.sources.length,
        input_manifest_sha256: artifact.input_manifest_sha256,
        package_sha256: artifact.package ? 'e'.repeat(64) : null,
      },
    },
  }
}

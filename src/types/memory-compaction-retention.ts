import type {
  MemoryCompactionReference,
  MemoryCompactionState,
} from './memory-compaction'

export interface MemoryCompactionInventory {
  memory_id: string
  limit: number
  unit: 'artifact'
  retained_count: number
  retired_count: number
  available_slots: number
  counts_by_state: Record<MemoryCompactionState, number>
  writer_busy_count: number
  unsettled_count: number
  automatic: false
  snapshot_only: true
}

export const RETENTION_BLOCKERS = [
  'already_retired',
  'not_creator',
  'memory_not_active',
  'generation_unsettled',
  'writer_not_drained',
  'metadata_unavailable',
] as const
export type MemoryCompactionRetentionBlocker =
  (typeof RETENTION_BLOCKERS)[number]

export interface MemoryCompactionRetentionPreview {
  memory_id: string
  artifact_id: string
  operation_id: string
  input_manifest_sha256: string
  preview_sha256: string
  eligible: boolean
  blockers: string[]
  retired_at: string | null
  writer_busy: boolean
  affected: {
    consumption_reference: MemoryCompactionReference
    source_ids: string[]
    source_count: number
    clears_package: boolean
    releases_slots: 0 | 1
  }
  audit_preserved: true
  snapshot_only: true
}

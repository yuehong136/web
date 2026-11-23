import type {
  MemoryTargetSourceVersion,
  MemoryTargetPrecondition,
} from './memory-targets'
export type MemoryVerificationResult =
  'human_confirmed' | 'disputed' | 'needs_review'
export type MemoryVerificationMethod =
  'source_comparison' | 'external_check' | 'other'
export type MemoryVerificationStatus =
  | MemoryVerificationResult
  | 'stale'
  | 'revoked'
  | 'superseded'
  | 'redacted'
  | 'unavailable'
export interface MemoryVerificationBinding {
  entry: Omit<MemoryTargetPrecondition, 'source_versions'>
  sources: MemoryTargetSourceVersion[]
}
export interface MemoryVerificationEvidence {
  description: string
  reference: string
}
export interface MemoryVerificationRecord {
  verification_id: string
  memory_id: string
  entry_id: string
  record_version: string
  head_version: string
  is_current: boolean
  result: MemoryVerificationResult
  method: MemoryVerificationMethod
  applicability: string | null
  notes: string | null
  evidence: MemoryVerificationEvidence[]
  checked_at: string
  checked_at_is_user_reported: boolean
  recorded_at: string
  actor_id: string
  state: 'active' | 'revoked' | 'redacted'
  revoked_at: string | null
  revoked_by: string | null
  revocation_reason: string | null
  binding_sha256: string
  binding: MemoryVerificationBinding
  effective_status: MemoryVerificationStatus
  valid_for_current: boolean
  review_required: boolean
  stale_reasons: string[]
  can_actions: { record: boolean; revoke: boolean }
  snapshot_only: true
}
export interface MemoryVerificationSnapshot {
  memory_id: string
  entry_id: string
  head_version: string
  binding_sha256: string
  binding: MemoryVerificationBinding
  entry_content: string | null
  current_record: MemoryVerificationRecord | null
  can_record: boolean
  snapshot_only: true
}
export interface MemoryVerificationCommand {
  operation_id: string
  expected_head_version: string
  expected_binding_sha256: string
  result: MemoryVerificationResult
  method: MemoryVerificationMethod
  applicability: string
  notes: string
  evidence: MemoryVerificationEvidence[]
  checked_at?: string
}
export interface MemoryVerificationRevocation {
  operation_id: string
  expected_head_version: string
  reason: string
}
export interface MemoryVerificationOperation {
  operation_id: string
  kind: 'verification_record' | 'verification_revoke'
  status: 'ready'
  verification_id: string
  head_version: string
  record: MemoryVerificationRecord
}
export interface MemoryVerificationHistory {
  records: MemoryVerificationRecord[]
  next_cursor: string | null
  has_more: boolean
  snapshot_only: true
}
export interface MemoryVerificationTodos {
  items: MemoryVerificationRecord[]
  next_cursor: string | null
  has_more: boolean
  scan_limited: boolean
  scanned_count: number
  inventory_scope: 'latest_registered_verification_heads'
  snapshot_only: true
}
export interface MemoryVerificationCapabilities {
  supported: boolean
  requires_managed_entry: true
  results: MemoryVerificationResult[]
  methods: MemoryVerificationMethod[]
  automatic_verification: false
  mutates_assessment: false
  model_calls: false
  snapshot_only: true
  max_sources: number
  max_evidence_items: number
  max_applicability_chars: number
  max_notes_chars: number
  max_evidence_description_chars: number
  max_evidence_reference_chars: number
  max_revocation_reason_chars: number
  max_history_limit: number
  max_todo_limit: number
  todo_scan_limit: number
  todo_physical_read_limit: number
}

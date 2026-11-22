import type { MemoryTargetSourceVersion } from './memory-targets'
export interface MemoryStartupRequest {
  user_id: string
  agent_id: string
  session_id: string | null
  entry_ids: string[] | null
  budget_tokens: number
  max_items: number
  inventory_limit: number
}
export interface MemoryStartupSource extends MemoryTargetSourceVersion {
  provenance_sha256?: string
  locator: { kind: 'memory_message'; memory_id: string; message_id: string }
}
/** Minimal fields used by bound excerpt/provenance reads; no invented projection digest. */
export type MemoryBoundSourceReference = Pick<
  MemoryStartupSource,
  | 'source_id'
  | 'source_revision'
  | 'source_generation'
  | 'content_sha256'
  | 'scope'
  | 'locator'
  | 'provenance_sha256'
>
export interface MemoryStartupItem {
  entry_id: string
  revision: string
  message_id: string
  generation: string
  content_sha256: string
  message_type: string
  content: string
  scope: { user_id: string; agent_id: string; session_id: string }
  valid_at: string | null
  invalid_at: string | null
  assessment: Record<string, unknown>
  verification: {
    verification_id: string
    head_version: string
    record_version: string
    result: 'human_confirmed'
    applicability: string
    method: string
    checked_at: string
    checked_at_is_user_reported: boolean
    recorded_at: string
    actor_id: string
    binding_sha256: string
    locator: { memory_id: string; verification_id: string }
    snapshot_only: true
  }
  sources: MemoryStartupSource[]
}
export type MemoryStartupOmission =
  | 'entry_unavailable'
  | 'scope_mismatch'
  | 'source_scope_mismatch'
  | 'unverified'
  | 'disputed'
  | 'needs_review'
  | 'verification_revoked'
  | 'verification_stale'
  | 'verification_redacted'
  | 'source_unavailable'
  | 'not_ready'
  | 'source_closure_limit'
  | 'physical_read_limit'
  | 'max_items'
  | 'budget'
export interface MemoryStartupPackage {
  memory_id: string
  scope: { user_id: string; agent_id: string; session_id: string | null }
  items: MemoryStartupItem[]
  startup_text: string
  package_sha256: string
  usage: {
    budget_tokens: number
    estimated_tokens: number
    token_count_is_estimate: true
    includes: 'entire_json_with_startup_text'
  }
  selection: {
    mode: 'inventory' | 'explicit'
    order: 'entry_id_asc'
    inventory_limit: number
    scanned_count: number
    inventory_truncated: boolean
    physical_read_limit: number
    read_limited: boolean
    selection_complete: boolean
  }
  omitted: {
    counts: Partial<Record<MemoryStartupOmission, number>>
    entries: { entry_id: string; reason: MemoryStartupOmission }[]
    details_truncated: boolean
  }
  snapshot_only: true
  mutates_memory: false
  model_calls: false
  data_only: true
}
export interface MemoryStartupCapabilities {
  supported: boolean
  request_generated: true
  persistent_cache: false
  model_calls: false
  requires_human_confirmed: true
  scope_is_exact: true
  budget_tokens_min: number
  budget_tokens_max: number
  max_items: number
  max_entry_ids: number
  max_inventory_limit: number
  physical_read_limit: number
  version_bound_sources: true
  source_offset_unit: 'unicode_codepoint'
}
export interface MemoryBoundSourceExcerpt {
  state:
    'available' | 'missing' | 'mismatch' | 'inactive' | 'forgotten' | 'deleted'
  verification: 'provenance_only'
  snapshot_only: true
  locator: {
    kind: 'memory_message'
    memory_id: string
    message_id: string
  } | null
  content_sha256: string | null
  excerpt: string | null
  offset: number | null
  next_offset: number | null
  total_chars: number | null
  truncated: boolean
  continuation_requires_authorization: true
  source_revision: string
  source_generation: string
  scope: { user_id: string; agent_id: string; session_id: string }
  offset_unit: 'unicode_codepoint'
}

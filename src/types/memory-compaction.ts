/** Ordered root sources are an explicit conversational selection, never an inventory sort. */
export interface MemoryCompactionCommand {
  operation_id: string
  source_ids: string[]
  prefix_count: number
  input_budget_tokens: number
  output_budget_tokens: number
  budget_tokens: number
}

export const MEMORY_COMPACTION_LIMITS = {
  sources: 32,
  input: { min: 1024, max: 32768, default: 16384 },
  output: { min: 256, max: 8192, default: 1024 },
  package: { min: 1024, max: 32768, default: 4096 },
} as const

export type MemoryCompactionState =
  | 'running'
  | 'generated'
  | 'failed'
  | 'stale'
  | 'canceled'
  | 'persistence_unknown'
export interface MemoryCompactionRetirement {
  preview_sha256: string
  retired_by: string
  retired_at: string
  prior_state: MemoryCompactionState
  source_count: number
  package_sha256: string | null
  input_manifest_sha256: string
}
export interface MemoryCompactionSource {
  source_id: string
  source_revision: string
  source_generation: string
  content_sha256: string
  scope: { user_id: string; agent_id: string; session_id: string }
  locator: { kind: 'memory_message'; memory_id: string; message_id: string }
  provenance_sha256: string | null
  format: 'legacy_combined' | 'structured'
  role_status: 'role_unknown' | 'caller_declared'
  reference_time: string | null
  event_time: { value: string | null; status: 'unknown' | 'caller_declared' }
}
export interface MemoryCompactionPackage {
  schema: 'memory_context_compaction'
  schema_version: 1
  data_only: true
  summary: string | null
  covered: {
    source_id: string
    offset: 0
    end_offset: number
    offset_unit: 'unicode_codepoint'
  }[]
  retained: {
    source_id: string
    content: string
    role_status: 'role_unknown' | 'caller_declared'
    format: 'legacy_combined' | 'structured'
  }[]
  lineage: MemoryCompactionSource[]
  omitted: { source_count: 0; codepoints: 0 }
}
export interface MemoryCompactionArtifact {
  retired_at?: string | null
  retirement?: MemoryCompactionRetirement | null
  error_code?: string | null
  artifact_id: string
  memory_id: string
  operation_id: string
  state: MemoryCompactionState
  valid_for_current: boolean | null
  validity_checked: boolean
  redacted: boolean
  snapshot_only: true
  input_manifest_sha256: string
  model_binding: {
    model_reference: string
    config_reference: string
    tenant_model_id: string | null
  }
  sources: MemoryCompactionSource[]
  usage: {
    estimated_before_tokens: number | null
    estimated_after_tokens: number | null
    budget_tokens: number
    estimated_input_tokens: number | null
    input_budget_tokens: number
    output_budget_tokens: number
    token_count_is_estimate: true
    provider_tokens: null
    provider_billing_verified: false
  }
  package: MemoryCompactionPackage | null
  created_at: string
}
export interface MemoryCompactionResult {
  operation: {
    retired_at?: string | null
    operation_id: string
    memory_id: string
    kind: 'context_compact'
    status: MemoryCompactionState
    artifact_id: string | null
    error_code: string | null
    writer_busy: boolean
    needs_operator_reconciliation: boolean
    can_retry: false
  }
  artifact: MemoryCompactionArtifact
}
export interface MemoryCompactionList {
  items: {
    retired_at?: string | null
    retirement?: MemoryCompactionRetirement | null
    artifact_id: string
    memory_id: string
    operation_id: string
    state: MemoryCompactionState
    error_code: string | null
    created_at: string
    valid_for_current: null
    validity_checked: false
    package: null
  }[]
  next_cursor: string | null
  has_more: boolean
  limit: number
}
export interface MemoryCompactionCapability {
  retention?: MemoryCompactionRetentionCapability
  supported: boolean
  requires_managed: true
  requires_registered_sources: true
  automatic: false
  root_raw_only: true
  ordered_prefix_only: true
  model_calls: true
  no_application: true
  max_sources: 32
}

export interface MemoryCompactionRetentionCapability {
  supported: boolean
  automatic: false
  creator_only: true
  preview_required: true
  terminal_drained_only: true
  preserves_generation_operation: true
  quota_unit: 'artifact'
  max_retained_artifacts: number
}

/** A binding to re-read, not a context body or an application receipt. */
export interface MemoryCompactionReference {
  memory_id: string
  operation_id: string
  artifact_id: string
  input_manifest_sha256: string
}

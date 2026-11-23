export interface MemoryTargetSourceVersion {
  source_id: string
  source_revision: string
  source_generation: string
  content_sha256: string
  projection_sha256: string
  scope: { user_id: string; agent_id: string; session_id: string }
}
export interface MemoryTargetPrecondition {
  entry_id: string
  revision: string
  message_id: string
  generation: string
  content_sha256: string
  scope: { user_id: string; agent_id: string; session_id: string }
  projection_sha256: string
  source_versions: MemoryTargetSourceVersion[]
}
export interface MemoryTargetModelBinding {
  tenant_model_id: string
  model_reference: string
  dimension: number
  config_reference: string
}
export interface MemoryTargetConfirmation {
  inputs: MemoryTargetSourceVersion[]
  targets: MemoryTargetPrecondition[]
  model_binding: MemoryTargetModelBinding
}
export interface MemoryTargetRecommendationRequest {
  source_ids: string[]
  user_id: string
  agent_id: string
  query: string | null
  retrieval_mode: 'hybrid' | 'lexical'
  limit: number
  budget_tokens: number
  query_budget_tokens: number
}
export type MemoryTargetReason =
  | { kind: 'semantic_rank'; rank: number }
  | { kind: 'lexical_overlap'; score: number }
export interface MemoryRecommendedTarget extends MemoryTargetPrecondition {
  content: string
  reasons: MemoryTargetReason[]
}
export interface MemoryTargetRecommendations {
  targets: MemoryRecommendedTarget[]
  confirmation: MemoryTargetConfirmation
  retrieval: {
    mode: 'hybrid' | 'lexical'
    embedding_calls: number
    semantic_limit: number
    lexical_scan_limit: number
    registered_current_only: boolean
    lexical_inventory_truncated: boolean
    semantic_candidates_truncated: boolean
    inventory_complete: boolean
    query_sha256: string
    query_truncated: boolean
  }
  budget: {
    budget_tokens: number
    estimated_tokens: number
    token_count_is_estimate: boolean
  }
  truncated: boolean
  omitted: {
    not_ready: number
    source_unavailable: number
    scope_mismatch: number
    closure_limit: number
    budget: number
  }
}
export interface MemoryTargetCapabilities {
  supported: boolean
  retrieval_modes: ('hybrid' | 'lexical')[]
  max_input_sources: number
  max_targets: number
  max_closure_sources: number
  semantic_limit: number
  lexical_scan_limit: number
  max_budget_tokens: number
  max_query_budget_tokens: number
  registered_current_only: boolean
  mutates_memory: false
  automatic_selection: false
}

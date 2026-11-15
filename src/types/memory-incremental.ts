import type { MemoryDreamingPolicy } from './memory-dreaming'
import type { MemoryBackgroundExecution } from './memory-revisions'

export interface MemoryDiscoveryScope {
  user_id: string | null
  agent_id: string | null
  session_id: string | null
}
export interface MemoryDiscoverySelection {
  scope: MemoryDiscoveryScope
  policy: MemoryDreamingPolicy
  entry_ids: string[]
  batch_size: number
  max_sources: number
  input_budget_tokens: number
  output_budget_tokens: number
}
/** Physical source identities and SQL version counters remain decimal strings. */
export interface MemoryDiscoverySource {
  source_id: string
  source_revision: string
  source_generation: string
  content_sha256: string
}
export interface MemoryDiscoveryProfile {
  scope: MemoryDiscoveryScope
  policy: MemoryDreamingPolicy
  input_budget_tokens: number
  output_budget_tokens: number
  strategy_sha256: string
  model_reference: string
  config_reference: string
  entries: {
    entry_id: string
    revision: string
    message_id: string
    generation: string
    content_sha256: string
  }[]
  context_sources: MemoryDiscoverySource[]
}
export interface MemoryDiscoveryCounts {
  active: number
  covered: number
  inflight: number
  blocked: number
  eligible: number
  selected_primary: number
  context: number
}
export interface MemoryDiscoveryPreviewBatch {
  ordinal: number
  primary_sources: MemoryDiscoverySource[]
  context_sources: MemoryDiscoverySource[]
  entry_ids: string[]
}
export interface MemoryDiscoveryPreview {
  preview_sha256: string
  profile_sha256: string
  profile: MemoryDiscoveryProfile
  counts: MemoryDiscoveryCounts
  batches: MemoryDiscoveryPreviewBatch[]
  has_more: boolean
  registered_active_only: true
  token_fit: 'not_checked'
}
export interface MemoryDiscoveryCreate extends MemoryDiscoverySelection {
  operation_id: string
  expected_preview_sha256: string
}
export type MemoryDiscoveryState =
  | 'planned'
  | 'partial'
  | 'submitted'
  | 'running'
  | 'settled'
  | 'canceled'
  | 'stale'
export type MemoryDiscoveryBatchState =
  | 'planned'
  | 'created'
  | 'submitted'
  | 'running'
  | 'analyzed'
  | 'failed'
  | 'canceled'
  | 'blocked'
  | 'stale'
  | 'unknown'
export interface MemoryDiscoveryBatch extends MemoryDiscoveryPreviewBatch {
  batch_id: string
  state: MemoryDiscoveryBatchState
  create_operation_id: string
  analysis_operation_id: string
  job_id: string
  error_code: string | null
  job_state: string | null
  execution: MemoryBackgroundExecution | null
}
export interface MemoryDiscoveryProgress {
  planned: number
  created: number
  submitted: number
  running: number
  analyzed: number
  failed: number
  canceled: number
  blocked: number
  pending: number
}
export interface MemoryDiscovery extends Omit<
  MemoryDiscoveryPreview,
  'batches'
> {
  discovery_id: string
  operation_id: string
  state: MemoryDiscoveryState
  progress: MemoryDiscoveryProgress
  batches: MemoryDiscoveryBatch[]
  created_at: string
  updated_at: string
}
export interface MemoryDiscoveryPage {
  discoveries: MemoryDiscovery[]
}
export interface MemoryDiscoveryRun {
  operation_id: string
  limit: number
}

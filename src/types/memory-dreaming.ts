import type { MemoryOperation } from './memory-revisions'

export type MemoryDreamingPolicy =
  | 'general'
  | 'preferences'
  | 'decisions'
  | 'procedures'
export interface MemoryMaintenanceInput {
  input_id: string
  source_id: string
  source_revision: number
  source_generation: number
  content_sha256: string
  scope: Record<string, unknown>
  coverage: 'included' | 'deferred' | 'analyzed'
  defer_reason: string | null
}
export interface MemoryMaintenanceJob {
  job_id: string
  operation_id: string
  state:
    | 'pending'
    | 'running'
    | 'ready'
    | 'failed'
    | 'cancel_requested'
    | 'canceled'
    | 'stale'
    | 'redacted'
  generation: number
  policy: MemoryDreamingPolicy
  input_budget_tokens: number
  output_budget_tokens: number
  estimated_input_tokens: number
  coverage: {
    selected: number
    included: number
    analyzed: number
    deferred: number
  }
  inputs: MemoryMaintenanceInput[]
  analysis_operation_id: string | null
  error_code: string | null
  model_reference: string | null
  usage: Record<string, unknown>
  created_at: string
  updated_at: string
}
export interface MemoryMaintenanceCandidate {
  candidate_id: string
  revision: number
  state:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'publishing'
    | 'published'
    | 'stale'
    | 'redacted'
  action: 'add' | 'patch' | 'noop'
  target_entry_id: string | null
  expected_revision: number | null
  message_type: string | null
  content: string | null
  base_content: string | null
  patch: { old_text: string; new_text: string } | null
  diff: { old_text: string; new_text: string } | null
  reason: string | null
  sources: Omit<MemoryMaintenanceInput, 'scope' | 'coverage' | 'defer_reason'>[]
  assessment: { kind: 'hypothesis'; verification_status: 'unverified' }
  review_actor_id: string | null
  reviewed_at: string | null
  publication_operation_id: string | null
  redacted: boolean
}
export interface MemoryMaintenanceCommand {
  operation_id: string
  source_ids: string[]
  entry_ids: string[]
  policy: MemoryDreamingPolicy
  input_budget_tokens: number
  output_budget_tokens: number
}
export interface MemoryCandidateReview {
  operation_id: string
  expected_revision: number
  decision: 'approve' | 'reject'
}
export interface MemoryCandidatePublication {
  operation_id: string
  candidates: { candidate_id: string; expected_revision: number }[]
}
export interface MemoryMaintenancePublication extends MemoryOperation {
  kind: 'dream_publish'
  job_id: string
  candidate_ids: string[]
  entries: {
    candidate_id: string
    entry_id: string
    new_revision: number
    message_id: string
  }[]
}

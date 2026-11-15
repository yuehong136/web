/** Physical IDs are decimal strings; revision counters remain safe integers. */
export interface MemoryCapabilities {
  maintenance?: {
    supported: boolean
    modes: string[]
    candidate_review_required: boolean
    actions: string[]
    requires_registered_sources: boolean
    automatic_publication: boolean
    max_sources: number
    max_candidates: number
    max_publication_candidates: number
  }
  revisions?: {
    supported: boolean
    managed: boolean
    activation_scope: 'memory_bank'
    ordinary_writes_after_activation: boolean
    managed_delete_supported: boolean
    coordinated_state_changes?: boolean
    max_content_bytes: number
    max_content_tokens: number
    max_reason_chars?: number
  }
  source_withdrawals?: { supported: boolean; permanent: boolean }
  writes?: {
    supported: boolean
    append: boolean
    automatic_extraction: boolean
    fifo: boolean
    publication_state: 'operation'
    queue_replay: 'stable_task_id'
    untracked_legacy_tasks: 'operator_attestation'
  }
  deletions?: {
    supported: boolean
    requires_writer_drain: boolean
    audit_tombstone: boolean
    physical_erasure_certified: boolean
    publication_state: 'operation'
  }
}

export interface MemoryRevisionSource {
  source_id: string
  source_revision: number
  generation: number
  content_sha256: string
  relation: string
  locator: Record<string, unknown>
}

export interface MemoryRevision {
  revision: number
  parent_revision: number | null
  message_id: string
  content: string | null
  content_sha256: string
  origin: string
  assessment: { kind?: string; verification_status?: string }
  redacted: boolean
  sources: MemoryRevisionSource[]
}

export interface MemoryEntry {
  entry_id: string
  memory_id: string
  legacy_message_id: string
  current_revision: number
  current_message_id: string
  generation: number
  state: string
  current: MemoryRevision
}

export interface MemoryRevisionPage {
  revisions: MemoryRevision[]
  next_cursor: string | null
}

export interface MemoryRevisionCommand {
  operation_id: string
  expected_revision: number
  content?: string
  patch?: { old_text: string; new_text: string }
  reason: string
  dry_run: boolean
}

export interface MemoryRevisionPreview {
  dry_run: true
  entry_id: string
  expected_revision: number
  current_revision: number
  content: string
  content_sha256: string
  estimated_tokens: number
  diff: { old_text: string; new_text: string }
  source_checks: { source_id: string; state: string }[]
}

export interface MemoryOperation {
  job_id?: string
  candidate_ids?: string[]
  entries?: {
    candidate_id: string
    entry_id: string
    new_revision: number
    message_id: string
  }[]
  operation_id: string
  kind: string
  status: string
  entry_id?: string | null
  new_revision?: number | null
  index_sync_status: string
  retryable: boolean
  error_code?: string | null
  outbox_id?: string | null
  stop_supply?: string
  physical_cleanup_complete?: boolean
  projection_cleanup_status?: string
  untraceable_copies?: boolean
  lifecycle?: 'deleting' | 'deleted'
  tracked_cleanup_confirmed?: boolean
  blocked_by?: string[]
  writer_drain?: {
    active_attempts: number
    unknown_attempts: number
    pending_appends: number
    untracked_tasks: number
  }
  needs_operator_reconciliation?: boolean
  raw_source_id?: string | null
  message_ids?: string[]
  extraction_task_id?: string | null
  queue_state?: MemoryAppendQueueState
  evicted_sources?: { source_id: string; operation_id: string; state: string }[]
  source?: MemorySourceState
}

export type MemoryAppendQueueState =
  | 'not_required'
  | 'pending'
  | 'submitted'
  | 'unknown'

export interface MemoryAppendCommand {
  operation_id: string
  user_input: string
  agent_response: string
  agent_id: string
  session_id: string
  user_id?: string
}

export interface MemoryAppendOperation extends MemoryOperation {
  kind: 'append_raw'
  raw_source_id: string | null
  message_ids: string[]
  extraction_task_id: string | null
  queue_state: MemoryAppendQueueState
  evicted_sources: { source_id: string; operation_id: string; state: string }[]
}

export interface MemorySourceState {
  managed: boolean
  memory_id: string
  source_id: string
  source_revision: number | null
  generation: number | null
  state: string
  content_sha256: string
  scope: Record<string, unknown>
}

/** Client-declared roles are data, independently of authenticated submission. */
export type MemorySourceRole = 'user' | 'assistant' | 'tool' | 'unknown'
export interface MemorySourceSegment {
  role: MemorySourceRole
  content: string
}
export interface MemoryStructuredSourceCommand {
  operation_id: string
  user_id: string
  agent_id: string
  session_id: string
  segments: MemorySourceSegment[]
  event_time: string | null
}
export interface MemorySourceAttribution {
  format: 'structured' | 'legacy_combined'
  role_status: 'caller_declared' | 'role_unknown'
  segments: MemorySourceSegment[] | null
  segments_included: boolean
  segment_count: number | null
  declared_roles: MemorySourceRole[]
  event_time: {
    value: string | null
    status: 'caller_declared' | 'unknown'
  }
  received_at: string | null
  reference_time: string | null
  provenance: {
    kind: 'authenticated_submission' | 'legacy_unknown'
    submitted_by: string | null
    operation_id?: string | null
    authenticated_submitter: boolean
    speaker_identity_verified: false
    content_verified: false
  }
}

export interface MemorySourceProvenance extends MemorySourceAttribution {
  memory_id: string
  source_id: string
  source_revision: string | null
  source_generation: string | null
  content_sha256: string
  provenance_sha256: string | null
  envelope_sha256: string | null
  state: 'available'
  snapshot_only: true
  scope: { user_id: string; agent_id: string; session_id: string }
}
export interface MemorySourceBinding {
  source_id: string
  source_revision: string
  source_generation: string
  content_sha256: string
  scope: { user_id: string; agent_id: string; session_id: string }
  provenance_sha256?: string
}
export interface MemoryStructuredSourcesCapability {
  supported: boolean
  schema_version: 1
  max_segments: number
  max_content_bytes: number
  max_content_tokens: number
  declared_roles: MemorySourceRole[]
  roles_are_caller_declared: true
  submitter_identity_is_authenticated: true
  speaker_identity_is_verified: false
  content_is_verified: false
  automatic_extraction: false
  provenance_default_includes_segments: false
  legacy_roles: 'role_unknown'
  event_time_is_caller_declared: true
  snapshot_only: true
}

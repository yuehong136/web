import type {
  MemorySourceProvenance,
  MemoryStructuredSourcesCapability,
} from '@/types/memory-sources'
export const sourceCapability: MemoryStructuredSourcesCapability = {
  supported: true,
  schema_version: 1,
  max_segments: 32,
  max_content_bytes: 65535,
  max_content_tokens: 8192,
  declared_roles: ['user', 'assistant', 'tool', 'unknown'],
  roles_are_caller_declared: true,
  submitter_identity_is_authenticated: true,
  speaker_identity_is_verified: false,
  content_is_verified: false,
  automatic_extraction: false,
  provenance_default_includes_segments: false,
  legacy_roles: 'role_unknown',
  event_time_is_caller_declared: true,
  snapshot_only: true,
}
export const sourceBinding = {
  source_id: '9007199254740993',
  source_revision: '1',
  source_generation: '1',
  content_sha256: 'a'.repeat(64),
  scope: { user_id: ' exact ', agent_id: '', session_id: '' },
}
export function sourceProvenance(): MemorySourceProvenance {
  return {
    ...sourceBinding,
    memory_id: 'bank',
    state: 'available',
    snapshot_only: true,
    format: 'structured',
    role_status: 'caller_declared',
    segments: null,
    segments_included: false,
    segment_count: 3,
    declared_roles: ['user', 'assistant', 'tool'],
    event_time: {
      value: '2026-11-12T08:00:00+08:00',
      status: 'caller_declared',
    },
    received_at: '2026-11-16T13:00:00+00:00',
    reference_time: '2026-11-16 13:00:00',
    provenance_sha256: 'b'.repeat(64),
    envelope_sha256: 'a'.repeat(64),
    provenance: {
      kind: 'authenticated_submission',
      submitted_by: 'authenticated-only',
      operation_id: 'original-operation',
      authenticated_submitter: true,
      speaker_identity_verified: false,
      content_verified: false,
    },
  }
}

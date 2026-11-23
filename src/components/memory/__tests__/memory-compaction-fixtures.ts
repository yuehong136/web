import type {
  MemoryCompactionCapability,
  MemoryCompactionResult,
  MemoryCompactionSource,
} from '@/types/memory-compaction'
export const compactionCapability: MemoryCompactionCapability = {
  supported: true,
  requires_managed: true,
  requires_registered_sources: true,
  automatic: false,
  root_raw_only: true,
  ordered_prefix_only: true,
  model_calls: true,
  no_application: true,
  max_sources: 32,
}
export const compactionSource = (id: string): MemoryCompactionSource => ({
  source_id: id,
  source_revision: '1',
  source_generation: '1',
  content_sha256: 'a'.repeat(64),
  scope: { user_id: 'subject', agent_id: 'agent', session_id: '' },
  locator: { kind: 'memory_message', memory_id: 'bank', message_id: id },
  provenance_sha256: null,
  format: 'legacy_combined',
  role_status: 'role_unknown',
  reference_time: '2026-11-17 08:52:48',
  event_time: { value: null, status: 'unknown' },
})
export function compactionResult(
  operationId = 'compaction-original',
): MemoryCompactionResult {
  const sources = [
    compactionSource('9223372036854775807'),
    compactionSource('2'),
  ]
  return {
    operation: {
      operation_id: operationId,
      memory_id: 'bank',
      kind: 'context_compact',
      status: 'generated',
      artifact_id: 'artifact-' + operationId,
      error_code: null,
      writer_busy: false,
      needs_operator_reconciliation: false,
      can_retry: false,
    },
    artifact: {
      artifact_id: 'artifact-' + operationId,
      memory_id: 'bank',
      operation_id: operationId,
      state: 'generated',
      valid_for_current: true,
      validity_checked: true,
      redacted: false,
      snapshot_only: true,
      input_manifest_sha256: 'b'.repeat(64),
      model_binding: {
        model_reference: 'owned-model@Provider',
        config_reference: 'c'.repeat(64),
        tenant_model_id: 'a'.repeat(32),
      },
      sources,
      usage: {
        estimated_before_tokens: 2600,
        estimated_after_tokens: 1200,
        budget_tokens: 4096,
        estimated_input_tokens: 3000,
        input_budget_tokens: 16384,
        output_budget_tokens: 1024,
        token_count_is_estimate: true,
        provider_tokens: null,
        provider_billing_verified: false,
      },
      package: {
        schema: 'memory_context_compaction',
        schema_version: 1,
        data_only: true,
        summary: 'Owned summary <script>window.__unsafe=1</script>',
        covered: [
          {
            source_id: sources[0]!.source_id,
            offset: 0,
            end_offset: 2400,
            offset_unit: 'unicode_codepoint',
          },
        ],
        retained: [
          {
            source_id: '2',
            content: 'Original retained 🧭 text',
            format: 'legacy_combined',
            role_status: 'role_unknown',
          },
        ],
        lineage: sources,
        omitted: { source_count: 0, codepoints: 0 },
      },
      created_at: '2026-11-17T08:52:48Z',
    },
  }
}
export const compactionList = () => ({
  items: [
    {
      artifact_id: 'artifact-compaction-original',
      memory_id: 'bank',
      operation_id: 'compaction-original',
      state: 'generated' as const,
      error_code: null,
      created_at: '2026-11-17T08:52:48Z',
      valid_for_current: null,
      validity_checked: false as const,
      package: null,
    },
  ],
  next_cursor: null,
  has_more: false,
  limit: 20,
})

import type {
  MemoryTargetCapabilities,
  MemoryTargetRecommendations,
  MemoryTargetSourceVersion,
} from '@/types/memory-targets'
export const targetCapability: MemoryTargetCapabilities = {
  supported: true,
  retrieval_modes: ['hybrid', 'lexical'],
  max_input_sources: 8,
  max_targets: 8,
  max_closure_sources: 32,
  semantic_limit: 64,
  lexical_scan_limit: 128,
  max_budget_tokens: 8192,
  max_query_budget_tokens: 4096,
  registered_current_only: true,
  mutates_memory: false,
  automatic_selection: false,
}
export const targetInputId = '9007199254740993',
  targetDependencyId = '9007199254741001',
  targetEntryId = 'e'.repeat(32)
const source = (id: string): MemoryTargetSourceVersion => ({
  source_id: id,
  source_revision: '1',
  source_generation: '2',
  content_sha256: 'a'.repeat(64),
  projection_sha256: 'b'.repeat(64),
  scope: { user_id: ' alpha ', agent_id: '', session_id: 'old-session' },
})
export function targetResult(): MemoryTargetRecommendations {
  const targets = [targetEntryId, 'f'.repeat(32)].map((entry_id, index) => ({
    entry_id,
    revision: '2',
    message_id: String(9007199254741003n + BigInt(index)),
    generation: '3',
    content_sha256: 'c'.repeat(64),
    content:
      index === 0
        ? 'Original scoped preference; inspect before correction.'
        : 'Another related entry, not automatically selected.',
    scope: { user_id: ' alpha ', agent_id: '', session_id: 'old-session' },
    projection_sha256: 'd'.repeat(64),
    source_versions: [source(targetDependencyId)],
    reasons: [
      { kind: 'semantic_rank' as const, rank: index + 1 },
      { kind: 'lexical_overlap' as const, score: 0.4 },
    ],
  }))
  return {
    targets,
    confirmation: {
      inputs: [source(targetInputId)],
      targets: targets.map(
        ({ content: _content, reasons: _reasons, ...metadata }) => metadata,
      ),
      model_binding: {
        tenant_model_id: 56,
        model_reference: 'controlled-embedding@fixture',
        dimension: 8,
        config_reference: 'f'.repeat(64),
      },
    },
    retrieval: {
      mode: 'hybrid',
      embedding_calls: 1,
      semantic_limit: 64,
      lexical_scan_limit: 128,
      registered_current_only: true,
      lexical_inventory_truncated: true,
      semantic_candidates_truncated: false,
      inventory_complete: false,
      query_sha256: '9'.repeat(64),
      query_truncated: false,
    },
    budget: {
      budget_tokens: 4096,
      estimated_tokens: 500,
      token_count_is_estimate: true,
    },
    truncated: true,
    omitted: {
      not_ready: 0,
      source_unavailable: 0,
      scope_mismatch: 1,
      closure_limit: 0,
      budget: 1,
    },
  }
}

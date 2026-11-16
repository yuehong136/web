import { createHash } from 'node:crypto'

export const incrementalSourceIds = [
  '9007199254740993',
  '9007199254741001',
  '9007199254741009',
]
export const fingerprint = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
export const sourceVersion = (id) => ({
  source_id: id,
  source_revision: '1',
  source_generation: '2',
  content_sha256: 'a'.repeat(64),
})
export const execution = (state) => ({
  state,
  attempt: state === 'queued' ? 0 : 1,
  queued_at: '2026-11-15T12:00:00Z',
  heartbeat_at: null,
  finished_at: ['succeeded', 'failed'].includes(state)
    ? '2026-11-15T12:01:00Z'
    : null,
  error_code: state === 'failed' ? 'fixture_analysis_failed' : null,
  needs_operator_reconciliation: false,
})
export const makeProfile = (selection) => ({
  scope: selection.scope,
  policy: selection.policy,
  input_budget_tokens: selection.input_budget_tokens,
  output_budget_tokens: selection.output_budget_tokens,
  strategy_sha256: 'b'.repeat(64),
  model_reference: 'controlled@fixture',
  config_reference: 'c'.repeat(64),
  entries: [],
  context_sources: [],
})
export const makeBatch = (index) => ({
  batch_id: String(index + 1).repeat(32),
  ordinal: index + 1,
  state: 'planned',
  create_operation_id: `create-child-${index + 1}`,
  analysis_operation_id: `analyze-child-${index + 1}`,
  job_id: String(index + 4).repeat(32),
  primary_sources: [sourceVersion(incrementalSourceIds[index])],
  context_sources: [],
  entry_ids: [],
  error_code: null,
  job_state: null,
  execution: null,
})
export const initialCounts = () => ({
  active: 5,
  covered: 1,
  inflight: 0,
  blocked: 1,
  eligible: 3,
  selected_primary: 3,
  context: 0,
})
export function makePlan(selection, operationId, previewHash) {
  const profile = makeProfile(selection)
  return {
    discovery_id: 'd'.repeat(32),
    operation_id: operationId,
    state: 'planned',
    profile_sha256: fingerprint(profile),
    preview_sha256: previewHash,
    profile,
    registered_active_only: true,
    token_fit: 'not_checked',
    counts: initialCounts(),
    has_more: false,
    progress: {
      planned: 3,
      created: 0,
      submitted: 0,
      running: 0,
      analyzed: 0,
      failed: 0,
      canceled: 0,
      blocked: 0,
      pending: 3,
    },
    batches: [0, 1, 2].map(makeBatch),
    created_at: '2026-11-15T12:00:00Z',
    updated_at: '2026-11-15T12:00:00Z',
  }
}
export function childJob(plan, batch) {
  return {
    job_id: batch.job_id,
    operation_id: batch.create_operation_id,
    state: batch.job_state,
    generation: 1,
    policy: plan.profile.policy,
    input_budget_tokens: plan.profile.input_budget_tokens,
    output_budget_tokens: plan.profile.output_budget_tokens,
    estimated_input_tokens: 100,
    coverage: {
      selected: 1,
      included: 1,
      analyzed: batch.state === 'analyzed' ? 1 : 0,
      deferred: 0,
    },
    inputs: batch.primary_sources.map((source) => ({
      input_id: `source-${source.source_id}`,
      ...source,
      scope: { user_id: '', agent_id: ' agent ', session_id: 'sample' },
      coverage: batch.state === 'analyzed' ? 'analyzed' : 'included',
      defer_reason: null,
    })),
    analysis_operation_id: batch.analysis_operation_id,
    execution: batch.execution,
    error_code: batch.error_code,
    model_reference: 'controlled@fixture',
    usage: {},
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  }
}
export function childCandidate(batch) {
  return {
    candidate_id: 'f'.repeat(32),
    revision: 1,
    state: 'pending',
    action: 'add',
    target_entry_id: null,
    expected_revision: null,
    message_type: 'semantic',
    content: 'Controlled proposal waiting for human review.',
    base_content: null,
    patch: null,
    diff: {
      old_text: '',
      new_text: 'Controlled proposal waiting for human review.',
    },
    reason: 'Review the source before adopting the proposal.',
    sources: batch.primary_sources.map((source) => ({
      input_id: `source-${source.source_id}`,
      ...source,
    })),
    assessment: { kind: 'hypothesis', verification_status: 'unverified' },
    review_actor_id: null,
    reviewed_at: null,
    publication_operation_id: null,
    redacted: false,
  }
}

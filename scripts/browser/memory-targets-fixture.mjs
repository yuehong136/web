import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { installMemoryIncrementalFixture } from './memory-incremental-fixture.mjs'
import {
  makeProfile,
  sourceVersion,
  fingerprint,
} from './memory-incremental-data.mjs'

export async function installMemoryTargetsFixture(context, onError) {
  const base = await installMemoryIncrementalFixture(context, onError)
  const capabilities = structuredClone(base.capabilities)
  capabilities.maintenance.target_recommendations = {
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
  const input = '9007199254740993',
    dependency = '9007199254741001',
    entry = 'e'.repeat(32),
    errors = []
  const scope = { user_id: ' alpha ', agent_id: '', session_id: 'old-session' }
  const source = (id) => ({
    ...sourceVersion(id),
    scope,
    projection_sha256: 'b'.repeat(64),
  })
  const targets = [entry, 'f'.repeat(32)].map((entry_id, index) => {
    const content = index
      ? 'Separate recommendation remains unselected. 另一条建议保持未选中。'
      : 'Saved preference: send a short written briefing before meetings. 现有偏好：会议前先发简短书面提要。\n<script>window.untrustedTargetExecuted=true</script>'
    return {
      entry_id,
      revision: '2',
      message_id: String(9007199254741003n + BigInt(index)),
      generation: '3',
      content_sha256: createHash('sha256').update(content).digest('hex'),
      content,
      scope,
      source_versions: [source(dependency)],
      projection_sha256: 'd'.repeat(64),
      reasons: [
        { kind: 'semantic_rank', rank: index + 1 },
        { kind: 'lexical_overlap', score: 0.4 },
      ],
    }
  })
  const confirmation = {
    inputs: [source(input)],
    targets: targets.map(({ content: _, reasons: __, ...rest }) => rest),
    model_binding: {
      tenant_model_id: 'b'.repeat(32),
      model_reference: 'controlled-embedding@fixture',
      dimension: 8,
      config_reference: 'f'.repeat(64),
    },
  }
  const calls = { recommend: [], preview: [], create: [], run: 0, publish: 0 },
    jobs = []
  let stale = false
  await context.route('**/api/v1/memories/owned-memory/**', async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname
    if (
      !/\/capabilities$|\/maintenance-targets\/|\/maintenance-jobs|\/maintenance-discoveries\/preview$/.test(
        path,
      )
    ) {
      await route.fallback()
      return
    }
    try {
      const body = request.method() === 'POST' ? request.postDataJSON() : null
      let data,
        status = 200
      if (path.endsWith('/capabilities')) data = capabilities
      else if (path.endsWith('/recommendations')) {
        calls.recommend.push(body)
        assert.deepEqual(body.source_ids, [input])
        assert.equal(body.user_id, ' alpha ')
        assert.equal(body.agent_id, '')
        data = {
          targets,
          confirmation,
          retrieval: {
            mode: body.retrieval_mode,
            embedding_calls: body.retrieval_mode === 'lexical' ? 0 : 1,
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
            budget_tokens: body.budget_tokens,
            estimated_tokens: 980,
            token_count_is_estimate: true,
          },
          truncated: true,
          omitted: {
            not_ready: 1,
            source_unavailable: 0,
            scope_mismatch: 1,
            closure_limit: 0,
            budget: 1,
          },
        }
      } else if (path.endsWith('/preview')) {
        calls.preview.push(body)
        if (stale && body.target_preconditions) {
          status = 409
          data = { error_code: 'target_preconditions_changed' }
        } else {
          const profile = makeProfile(body)
          profile.entries =
            body.target_preconditions?.targets.map((target) => ({
              entry_id: target.entry_id,
              revision: target.revision,
              message_id: target.message_id,
              generation: target.generation,
              content_sha256: target.content_sha256,
            })) ?? []
          profile.context_sources = body.target_preconditions
            ? [source(dependency)]
            : []
          data = {
            preview_sha256: fingerprint(body),
            profile_sha256: fingerprint(profile),
            profile,
            counts: {
              active: 2,
              covered: 0,
              inflight: 0,
              blocked: 0,
              eligible: 1,
              selected_primary: 1,
              context: body.entry_ids.length,
            },
            batches: [
              {
                ordinal: 1,
                primary_sources: [sourceVersion(input)],
                context_sources: profile.context_sources,
                entry_ids: body.entry_ids,
              },
            ],
            has_more: false,
            registered_active_only: true,
            token_fit: 'not_checked',
            ...(body.target_preconditions
              ? { target_preconditions: body.target_preconditions }
              : {}),
          }
        }
      } else if (
        path.endsWith('/maintenance-jobs') &&
        request.method() === 'POST'
      ) {
        calls.create.push(body)
        assert.deepEqual(body.entry_ids, [entry])
        assert.deepEqual(body.source_ids, [input, dependency])
        assert.equal(body.target_preconditions.targets.length, 1)
        data = {
          job_id: 'a'.repeat(32),
          operation_id: body.operation_id,
          state: 'pending',
          generation: 1,
          estimated_input_tokens: 1000,
          coverage: {
            selected: body.source_ids.length,
            included: body.source_ids.length,
            analyzed: 0,
            deferred: 0,
          },
          usage: {},
          error_code: null,
          model_reference: null,
          updated_at: '2026-11-16T05:10:00Z',
          policy: body.policy,
          input_budget_tokens: body.input_budget_tokens,
          output_budget_tokens: body.output_budget_tokens,
          analysis_operation_id: null,
          created_at: '2026-11-16T05:10:00Z',
          execution: null,
          receipt: {},
          entries: body.target_preconditions.targets,
          inputs: body.source_ids.map((source_id, index) => ({
            input_id: `source-${index}`,
            source_id,
            source_revision: 1,
            source_generation: 2,
            content_sha256: 'a'.repeat(64),
            scope,
            coverage: 'included',
            defer_reason: null,
          })),
          target_preconditions: body.target_preconditions,
        }
        jobs.push(data)
      } else if (path.endsWith('/maintenance-jobs')) data = { jobs }
      else if (path.endsWith('/runs')) {
        calls.run++
        throw new Error(
          'No model analysis is allowed in target recommendation browser acceptance',
        )
      } else if (path.endsWith('/publications')) {
        calls.publish++
        throw new Error('No publication is allowed')
      } else if (path.endsWith('/candidates')) data = { candidates: [] }
      else data = jobs.find((job) => path.includes(job.job_id))
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: status === 200 ? 0 : status,
          retmsg: status === 409 ? 'Controlled stale snapshot' : '',
          data,
        }),
      })
    } catch (error) {
      errors.push(error.message)
      onError?.(error.message)
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: 500,
          retmsg: 'Controlled target fixture failed',
          data: null,
        }),
      })
    }
  })
  return {
    calls,
    errors,
    input,
    dependency,
    entry,
    targets,
    makeStale: () => {
      stale = true
    },
  }
}

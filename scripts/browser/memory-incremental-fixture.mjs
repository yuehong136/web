import assert from 'node:assert/strict'
import {
  childCandidate,
  childJob,
  execution,
  fingerprint,
  incrementalSourceIds,
  initialCounts,
  makeBatch,
  makePlan,
  makeProfile,
} from './memory-incremental-data.mjs'

/** GETs never advance jobs. Only commands and the independent fixture driver do. */
export async function installMemoryIncrementalFixture(
  context,
  onError = () => {},
) {
  const errors = []
  let plan,
    lastSelection,
    creationVisible = false,
    mixed = false
  const commands = {
    preview: [],
    create: [],
    runs: [],
    cancel: [],
    review: 0,
    publish: 0,
  }
  const runs = new Map()
  const bank = {
    id: 'owned-memory',
    name: 'Owned memory',
    memory_type: ['raw', 'semantic'],
    storage_type: 'table',
    permissions: 'me',
    create_time: 1794700000000,
    owner_name: 'Fixture',
    forgetting_policy: 'FIFO',
  }
  const capabilities = {
    revisions: {
      supported: true,
      managed: true,
      activation_scope: 'memory_bank',
      ordinary_writes_after_activation: true,
      managed_delete_supported: true,
      max_content_bytes: 65535,
      max_content_tokens: 8192,
    },
    maintenance: {
      supported: true,
      modes: ['dream'],
      candidate_review_required: true,
      actions: ['add', 'patch', 'noop'],
      requires_registered_sources: true,
      automatic_publication: false,
      max_sources: 32,
      max_candidates: 32,
      max_publication_candidates: 16,
      execution: 'persistent_background',
      discoveries: {
        supported: true,
        registered_active_only: true,
        max_sources: 256,
        max_batch_sources: 32,
        max_runs_per_request: 8,
        expected_preview_hash_required: true,
        token_fit: 'not_checked',
      },
    },
  }
  const preview = (selection) => {
    const profile = makeProfile(selection)
    const counts = mixed
      ? {
          active: 5,
          covered: 2,
          inflight: 0,
          blocked: 2,
          eligible: 1,
          selected_primary: 1,
          context: 0,
        }
      : plan
        ? {
            active: 5,
            covered: 1,
            inflight: 3,
            blocked: 1,
            eligible: 0,
            selected_primary: 0,
            context: 0,
          }
        : initialCounts()
    const batches = mixed
      ? [makeBatch(2)]
      : plan
        ? []
        : [0, 1, 2].map(makeBatch)
    const value = {
      profile_sha256: fingerprint(profile),
      profile,
      counts,
      batches: batches.map(
        ({ ordinal, primary_sources, context_sources, entry_ids }) => ({
          ordinal,
          primary_sources,
          context_sources,
          entry_ids,
        }),
      ),
      has_more: false,
      registered_active_only: true,
      token_fit: 'not_checked',
    }
    return { ...value, preview_sha256: fingerprint({ selection, ...value }) }
  }
  const progress = () => {
    plan.progress = {
      planned: 3,
      created: plan.batches.filter((b) => b.job_state !== null).length,
      submitted: plan.batches.filter((b) => b.job_state !== null).length,
      running: plan.batches.filter((b) =>
        ['queued', 'claimed', 'running'].includes(b.execution?.state),
      ).length,
      analyzed: plan.batches.filter((b) => b.state === 'analyzed').length,
      failed: plan.batches.filter((b) => b.state === 'failed').length,
      canceled: plan.batches.filter((b) => b.state === 'canceled').length,
      blocked: plan.batches.filter((b) => b.state === 'blocked').length,
      pending: plan.batches.filter((b) =>
        ['planned', 'created', 'unknown'].includes(b.state),
      ).length,
    }
  }
  const setMixed = () => {
    assert.ok(plan.batches[0].job_state && plan.batches[2].job_state)
    plan.batches[0] = {
      ...plan.batches[0],
      state: 'analyzed',
      job_state: 'ready',
      execution: execution('succeeded'),
    }
    plan.batches[2] = {
      ...plan.batches[2],
      state: 'failed',
      job_state: 'failed',
      error_code: 'fixture_analysis_failed',
      execution: execution('failed'),
    }
    plan.state = 'settled'
    mixed = true
    progress()
  }
  const primeMixed = () => {
    lastSelection = {
      scope: { user_id: '', agent_id: ' agent ', session_id: null },
      policy: 'general',
      entry_ids: [],
      batch_size: 1,
      max_sources: 3,
      input_budget_tokens: 16384,
      output_budget_tokens: 4096,
    }
    plan = makePlan(
      lastSelection,
      'original-creation',
      preview(lastSelection).preview_sha256,
    )
    plan.batches[0].job_state = 'pending'
    plan.batches[2].job_state = 'pending'
    plan.batches[1] = {
      ...plan.batches[1],
      state: 'blocked',
      error_code: 'maintenance_input_budget_exceeded',
    }
    creationVisible = true
    setMixed()
  }
  await context.route('**/api/v1/memories/owned-memory**', async (route) => {
    try {
      const request = route.request(),
        url = new URL(request.url()),
        path = url.pathname
      const body = request.method() === 'GET' ? null : request.postDataJSON()
      let data,
        status = 200
      if (path.endsWith('/capabilities')) data = capabilities
      else if (
        path === '/api/v1/memories/owned-memory' ||
        path.endsWith('/config')
      )
        data = bank
      else if (path.endsWith('/maintenance-discoveries/preview')) {
        commands.preview.push(body)
        lastSelection = body
        data = preview(body)
      } else if (
        path.endsWith('/maintenance-discoveries') &&
        request.method() === 'POST'
      ) {
        commands.create.push(body)
        assert.equal(
          commands.create.length,
          1,
          'Unknown creation must be discovered, not resent with another operation',
        )
        const { operation_id, expected_preview_sha256, ...selection } = body
        assert.equal(expected_preview_sha256, preview(selection).preview_sha256)
        plan = makePlan(selection, operation_id, expected_preview_sha256)
        data = { operation_id }
        status = 503
      } else if (path.endsWith('/maintenance-discoveries')) {
        data = {
          discoveries:
            plan &&
            creationVisible &&
            (!url.searchParams.get('operation_id') ||
              url.searchParams.get('operation_id') === plan.operation_id)
              ? [plan]
              : [],
        }
      } else if (
        path.includes('/maintenance-discoveries/') &&
        path.endsWith('/runs')
      ) {
        commands.runs.push(body)
        const prior = runs.get(body.operation_id)
        if (prior) {
          assert.deepEqual(prior, body)
          plan.batches[0] = { ...plan.batches[0], state: 'submitted' }
          progress()
          data = plan
        } else {
          runs.set(body.operation_id, body)
          const remaining = plan.batches
            .filter((batch) => batch.state === 'planned')
            .slice(0, body.limit)
          for (const batch of remaining) {
            if (batch.ordinal === 2) {
              batch.state = 'blocked'
              batch.error_code = 'maintenance_input_budget_exceeded'
            } else {
              batch.state = 'submitted'
              batch.job_state = 'pending'
              batch.execution = execution('queued')
            }
          }
          plan.state = 'partial'
          progress()
          data = plan
          if (runs.size === 1) {
            plan.batches[0].state = 'unknown'
            status = 503
            data = { operation_id: body.operation_id }
            progress()
          }
        }
      } else if (
        path.includes('/maintenance-discoveries/') &&
        path.endsWith('/cancellations')
      ) {
        commands.cancel.push(body)
        data = plan
      } else if (path.includes('/maintenance-discoveries/')) data = plan
      else if (path.endsWith('/operations'))
        data = {
          operations: [],
          next_cursor: null,
          limit: 20,
          view: url.searchParams.get('view') ?? 'pending',
          memory_state: 'active',
        }
      else if (path.includes('/operations/')) {
        const batch = plan.batches.find((item) =>
          path.endsWith(`/${item.analysis_operation_id}`),
        )
        assert.ok(batch)
        data = {
          operation_id: batch.analysis_operation_id,
          kind: 'dream_analyze',
          job_id: batch.job_id,
          status: batch.state === 'analyzed' ? 'ready' : 'failed',
          index_sync_status: batch.state === 'analyzed' ? 'ready' : 'unknown',
          retryable: false,
          can_reconcile: false,
          writer_busy: false,
          execution: batch.execution,
          needs_operator_reconciliation: false,
        }
      } else if (path.endsWith('/maintenance-jobs'))
        data = {
          jobs: plan
            ? plan.batches
                .filter((b) => b.job_state)
                .map((b) => childJob(plan, b))
            : [],
        }
      else if (path.includes('/maintenance-jobs/')) {
        assert.equal(
          request.method(),
          'GET',
          'Only human review may call mutations; this scenario never approves or publishes',
        )
        const batch = plan.batches.find((b) => path.includes(`/${b.job_id}`))
        assert.ok(
          batch?.job_state,
          'A reserved job ID is not readable before creation',
        )
        data = path.endsWith('/candidates')
          ? {
              candidates:
                batch.state === 'analyzed' ? [childCandidate(batch)] : [],
            }
          : childJob(plan, batch)
      } else
        throw new Error(
          `Unexpected controlled memory route ${request.method()} ${path}`,
        )
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: status >= 400 ? status : 0,
          retmsg: status >= 400 ? 'Controlled unconfirmed acknowledgement' : '',
          data,
        }),
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'fixture_route_failed'
      errors.push(message)
      onError(message)
      try {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            retcode: 500,
            retmsg: 'Controlled fixture route failed',
            data: null,
          }),
        })
      } catch {
        errors.push('fixture_error_response_failed')
      }
    }
  })
  return {
    errors,
    commands,
    sourceIds: incrementalSourceIds,
    discoveryId: 'd'.repeat(32),
    revealPlan: () => {
      creationVisible = true
    },
    setMixed,
    primeMixed,
    get plan() {
      return plan
    },
    get distinctRunCommands() {
      return runs.size
    },
  }
}

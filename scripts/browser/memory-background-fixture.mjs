import assert from 'node:assert/strict'

/** Controlled HTTP state; only explicit driver/command actions advance execution. */
export async function installMemoryBackgroundFixture(context) {
  const sourceId = '9007199254740993',
    jobId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  const counts = {
    create: 0,
    submit: 0,
    review: 0,
    publish: 0,
    reconcile: 0,
    config: 0,
    capabilities: 0,
  }
  let job,
    candidate,
    analysisId = '',
    publicationId = '',
    publicationState = 'unknown'
  const execution = (state) => ({
    state,
    attempt: state === 'queued' ? 0 : 1,
    queued_at: '2026-11-15T10:00:00Z',
    heartbeat_at: null,
    finished_at: state === 'succeeded' ? '2026-11-15T10:01:00Z' : null,
    error_code:
      state === 'needs_reconciliation' ? 'actual_attempt_unconfirmed' : null,
    needs_operator_reconciliation: state === 'needs_reconciliation',
  })
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
  const analysis = () => ({
    operation_id: analysisId,
    kind: 'dream_analyze',
    job_id: jobId,
    status:
      job?.execution?.state === 'succeeded'
        ? 'ready'
        : job?.execution?.state === 'needs_reconciliation'
          ? 'persistence_unknown'
          : 'accepted',
    index_sync_status:
      job?.execution?.state === 'succeeded'
        ? 'ready'
        : job?.execution?.state === 'needs_reconciliation'
          ? 'unknown'
          : 'pending',
    retryable: job?.execution?.state !== 'succeeded',
    can_reconcile: false,
    execution: job.execution,
    needs_operator_reconciliation:
      job.execution?.needs_operator_reconciliation ?? false,
    writer_busy: ['running', 'needs_reconciliation'].includes(
      job.execution?.state,
    ),
    queue_state: null,
    created_at: '2026-11-15T10:00:00Z',
    updated_at: job.updated_at,
  })
  const publication = () => ({
    operation_id: publicationId,
    kind: 'dream_publish',
    job_id: jobId,
    status: publicationState === 'ready' ? 'ready' : 'persistence_unknown',
    index_sync_status: publicationState === 'ready' ? 'ready' : 'unknown',
    retryable: publicationState !== 'ready',
    can_reconcile: publicationState !== 'ready',
    execution: null,
    needs_operator_reconciliation: false,
    writer_busy: false,
    queue_state: null,
    created_at: '2026-11-15T10:02:00Z',
    updated_at:
      publicationState === 'ready'
        ? '2026-11-15T10:03:00Z'
        : '2026-11-15T10:02:00Z',
  })
  const deletion = {
    operation_id: 'deletion-original',
    kind: 'delete_memory',
    status: 'ready',
    index_sync_status: 'ready',
    retryable: false,
    can_reconcile: false,
    job_id: null,
    execution: null,
    writer_busy: false,
    needs_operator_reconciliation: false,
    lifecycle: 'deleted',
    tracked_cleanup_confirmed: true,
    physical_cleanup_complete: false,
    untraceable_copies: true,
    stop_supply: 'stopped',
    created_at: '2026-11-15T10:04:00Z',
    updated_at: '2026-11-15T10:05:00Z',
  }
  const setExecution = (state) => {
    assert.ok(job && analysisId)
    job.execution = execution(state)
    job.state =
      state === 'succeeded'
        ? 'ready'
        : state === 'needs_reconciliation'
          ? 'failed'
          : state === 'running'
            ? 'running'
            : 'pending'
    job.updated_at =
      state === 'running'
        ? '2026-11-15T10:00:30Z'
        : state === 'succeeded'
          ? '2026-11-15T10:01:00Z'
          : '2026-11-15T10:00:45Z'
    if (state === 'succeeded') {
      job.coverage.analyzed = 1
      candidate = {
        candidate_id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        revision: 1,
        state: 'pending',
        action: 'add',
        target_entry_id: null,
        expected_revision: null,
        message_type: 'semantic',
        content: 'Controlled hypothesis: the user prefers tea.',
        base_content: null,
        patch: null,
        diff: {
          old_text: '',
          new_text: 'Controlled hypothesis: the user prefers tea.',
        },
        reason: 'Review this selected source before adopting the preference.',
        sources: [
          {
            input_id: 'source-9007199254740993',
            source_id: sourceId,
            source_revision: 1,
            source_generation: 1,
            content_sha256: 'a'.repeat(64),
          },
        ],
        assessment: { kind: 'hypothesis', verification_status: 'unverified' },
        review_actor_id: null,
        reviewed_at: null,
        publication_operation_id: null,
        redacted: false,
      }
    }
  }
  await context.route('**/api/v1/memories**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname,
      body = request.method() === 'POST' ? request.postDataJSON() : null
    const deletedBank = path.includes('/deleted-memory')
    let data,
      code = 200
    if (path.endsWith('/operations')) {
      const view = url.searchParams.get('view') || 'pending'
      let rows = deletedBank
        ? [deletion]
        : [
            ...(publicationId ? [publication()] : []),
            ...(analysisId ? [analysis()] : []),
          ]
      if (view === 'pending')
        rows = rows.filter((value) => value.status !== 'ready')
      data = {
        operations: rows,
        next_cursor: null,
        limit: 20,
        view,
        memory_state: deletedBank ? 'deleted' : 'active',
      }
    } else if (
      path.includes('/operations/') &&
      !path.endsWith('/reconciliations')
    ) {
      const id = decodeURIComponent(path.split('/operations/')[1])
      if (deletedBank && id === deletion.operation_id) data = deletion
      else if (!deletedBank && analysisId && id === analysisId)
        data = analysis()
      else if (!deletedBank && publicationId && id === publicationId)
        data = publication()
      else {
        data = null
        code = 404
      }
    } else if (deletedBank)
      throw new Error(
        'Deleted-bank recovery must not request configuration or content',
      )
    else if (path.endsWith('/config')) {
      counts.config++
      data = bank
    } else if (path.endsWith('/capabilities')) {
      counts.capabilities++
      data = {
        revisions: {
          supported: true,
          managed: true,
          activation_scope: 'memory_bank',
          ordinary_writes_after_activation: true,
          managed_delete_supported: true,
          max_content_bytes: 65535,
          max_content_tokens: 8192,
        },
        source_withdrawals: { supported: true, permanent: true },
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
        },
      }
    } else if (
      path.endsWith('/maintenance-jobs') &&
      request.method() === 'POST'
    ) {
      counts.create++
      assert.deepEqual(body.source_ids, [sourceId])
      job = {
        job_id: jobId,
        operation_id: body.operation_id,
        state: 'pending',
        generation: 1,
        policy: body.policy,
        input_budget_tokens: body.input_budget_tokens,
        output_budget_tokens: body.output_budget_tokens,
        estimated_input_tokens: 50,
        coverage: { selected: 1, included: 1, analyzed: 0, deferred: 0 },
        inputs: [
          {
            input_id: `source-${sourceId}`,
            source_id: sourceId,
            source_revision: 1,
            source_generation: 1,
            content_sha256: 'a'.repeat(64),
            scope: {
              user_id: 'fixture',
              agent_id: 'fixture',
              session_id: 'owned-session',
            },
            coverage: 'included',
            defer_reason: null,
          },
        ],
        execution: null,
        analysis_operation_id: null,
        error_code: null,
        model_reference: null,
        usage: {},
        created_at: '2026-11-15T10:00:00Z',
        updated_at: '2026-11-15T10:00:00Z',
      }
      data = job
      code = 202
    } else if (path.endsWith('/maintenance-jobs'))
      data = { jobs: job ? [job] : [] }
    else if (path.endsWith('/runs')) {
      counts.submit++
      assert.equal(
        counts.submit,
        1,
        'No automatic model resubmission on read/reload',
      )
      analysisId = body.operation_id
      job.analysis_operation_id = analysisId
      setExecution('queued')
      data = job
      code = 202
    } else if (path.endsWith('/candidates'))
      data = { candidates: candidate ? [candidate] : [] }
    else if (path.endsWith('/reviews')) {
      counts.review++
      assert.equal(body.expected_revision, 1)
      assert.equal(body.decision, 'approve')
      candidate = {
        ...candidate,
        state: 'approved',
        revision: 2,
        review_actor_id: 'fixture',
        reviewed_at: '2026-11-15T10:02:00Z',
      }
      data = candidate
    } else if (path.endsWith('/publications')) {
      counts.publish++
      assert.equal(counts.publish, 1)
      assert.deepEqual(body.candidates, [
        { candidate_id: candidate.candidate_id, expected_revision: 2 },
      ])
      publicationId = body.operation_id
      candidate = {
        ...candidate,
        state: 'publishing',
        publication_operation_id: publicationId,
      }
      data = { operation_id: publicationId }
      code = 503
    } else if (path.endsWith('/reconciliations')) {
      counts.reconcile++
      assert.ok(path.includes(encodeURIComponent(publicationId)))
      publicationState = 'ready'
      candidate.state = 'published'
      data = publication()
    } else if (path.endsWith(`/${jobId}`)) data = job
    else
      throw new Error(
        `Unexpected memory fixture route ${request.method()} ${path}`,
      )
    await route.fulfill({
      status: code,
      contentType: 'application/json',
      body: JSON.stringify({
        retcode: code >= 400 ? code : 0,
        retmsg: code >= 400 ? 'Controlled unconfirmed operation' : '',
        data,
      }),
    })
  })
  return {
    counts,
    sourceId,
    jobId,
    setExecution,
    get analysisId() {
      return analysisId
    },
    get publicationId() {
      return publicationId
    },
  }
}

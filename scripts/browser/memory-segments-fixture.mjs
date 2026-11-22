import assert from 'node:assert/strict'
import { installMemoryIncrementalFixture } from './memory-incremental-fixture.mjs'
import {
  childCandidate,
  childJob,
  execution,
  fingerprint,
  makeProfile,
  sourceVersion,
  incrementalSourceIds,
} from './memory-incremental-data.mjs'

export const segmentCapability = {
  supported: true,
  default_mode: 'whole',
  splitter_version: 'unicode-boundary-v1',
  fragment_token_limit: { min: 256, max: 8192, default: 2048 },
  max_parts_per_source: { min: 1, max: 64, default: 32 },
  max_total_fragments: 256,
  context_codepoints: 64,
  offset_unit: 'unicode_codepoint',
}
const fragment = (index) => ({
  fragment_id: fingerprint({ part: index }),
  part_index: index,
  part_count: 3,
  offset_unit: 'unicode_codepoint',
  core_start: index * 400,
  core_end: (index + 1) * 400,
  read_start: Math.max(0, index * 400 - 64),
  read_end: Math.min(1200, (index + 1) * 400 + 64),
  core_sha256: fingerprint({ core: index }),
  read_sha256: fingerprint({ read: index }),
  splitter_version: 'unicode-boundary-v1',
})
const segmentedProfile = (selection) => ({
  ...makeProfile(selection),
  segmentation: {
    ...selection.segmentation,
    splitter_version: 'unicode-boundary-v1',
  },
})
const sources = () =>
  [0, 1, 2].map((index) => ({
    ...sourceVersion(incrementalSourceIds[0]),
    fragment: fragment(index),
  }))

/** Worker state transitions come only from explicit commands or this independent fixture driver. */
export async function installMemorySegmentsFixture(
  context,
  onError = () => {},
) {
  const base = await installMemoryIncrementalFixture(context, onError)
  const capabilities = structuredClone(base.capabilities)
  capabilities.maintenance.discoveries.segmentation = segmentCapability
  const errors = []
  const calls = {
    preview: [],
    create: [],
    runs: [],
    cancel: [],
    reviews: 0,
    publications: 0,
  }
  let plan, commandHash
  const commands = new Map()
  const counts = () => ({
    active: 2,
    covered: plan?.batches.every((batch) => batch.state === 'analyzed') ? 1 : 0,
    inflight:
      plan &&
      plan.batches.some((batch) =>
        ['submitted', 'running'].includes(batch.state),
      )
        ? 1
        : 0,
    blocked: 1,
    eligible: plan ? 0 : 1,
    selected_primary: plan ? 0 : 1,
    context: 0,
    selected_fragments: plan ? 0 : 3,
  })
  const coverage = () => {
    const analyzed =
      plan?.batches.filter(
        (batch) =>
          batch.state === 'analyzed' && batch.execution?.state === 'succeeded',
      ).length ?? 0
    return {
      unit: 'sources',
      selected: 2,
      covered: analyzed === 3 ? 1 : 0,
      partial: analyzed > 0 && analyzed < 3 ? 1 : 0,
      blocked: 1,
      total_parts: 3,
      analyzed_parts: analyzed,
    }
  }
  const blocked = () => [
    {
      ...sourceVersion(incrementalSourceIds[1]),
      error_code: 'segment_parts_limit',
    },
  ]
  function preview(selection) {
    if (selection.segmentation?.mode !== 'segmented') {
      const value = {
        profile_sha256: fingerprint(makeProfile(selection)),
        profile: makeProfile(selection),
        counts: {
          active: 2,
          covered: 0,
          inflight: 0,
          blocked: 0,
          eligible: 2,
          selected_primary: 2,
          context: 0,
        },
        batches: [0, 1].map((index) => ({
          ordinal: index + 1,
          primary_sources: [sourceVersion(incrementalSourceIds[index])],
          context_sources: [],
          entry_ids: [],
        })),
        has_more: false,
        registered_active_only: true,
        token_fit: 'not_checked',
      }
      return { ...value, preview_sha256: fingerprint({ selection, ...value }) }
    }
    const value = {
      profile_sha256: fingerprint(segmentedProfile(selection)),
      profile: segmentedProfile(selection),
      counts: counts(),
      source_coverage: coverage(),
      blocked_sources: blocked(),
      batches: plan
        ? []
        : sources().map((source, index) => ({
            ordinal: index + 1,
            primary_sources: [source],
            context_sources: [],
            entry_ids: [],
          })),
      has_more: false,
      registered_active_only: true,
      token_fit: 'checked_at_preview',
    }
    return { ...value, preview_sha256: fingerprint({ selection, ...value }) }
  }
  function progress() {
    plan.progress = {
      planned: plan.batches.length,
      created: plan.batches.filter((batch) => batch.job_state !== null).length,
      submitted: plan.batches.filter((batch) => batch.job_state !== null)
        .length,
      running: plan.batches.filter((batch) =>
        ['queued', 'claimed', 'running'].includes(batch.execution?.state),
      ).length,
      analyzed: plan.batches.filter((batch) => batch.state === 'analyzed')
        .length,
      failed: 0,
      canceled: 0,
      blocked: 0,
      pending: plan.batches.filter((batch) =>
        ['planned', 'unknown'].includes(batch.state),
      ).length,
    }
    plan.source_coverage = coverage()
    plan.state =
      plan.progress.analyzed === plan.batches.length
        ? 'settled'
        : plan.progress.running
          ? 'running'
          : 'planned'
  }
  function makePlan(selection, operationId) {
    const value = preview(selection)
    plan = {
      ...value,
      discovery_id: 'e'.repeat(32),
      operation_id: operationId,
      state: 'planned',
      created_at: '2026-11-16T03:00:00Z',
      updated_at: '2026-11-16T03:00:00Z',
      batches: value.batches.map((batch, index) => ({
        ...batch,
        batch_id: String(index + 1).repeat(32),
        job_id: String(index + 4).repeat(32),
        create_operation_id: `fragment-${index}-create`,
        analysis_operation_id: `fragment-${index}-analyze`,
        state: 'planned',
        job_state: null,
        execution: null,
        error_code: null,
      })),
    }
    progress()
    return plan
  }
  function finish(index) {
    assert.ok(plan.batches[index].job_state)
    plan.batches[index].state = 'analyzed'
    plan.batches[index].job_state = 'ready'
    plan.batches[index].execution = execution('succeeded')
    progress()
  }
  await context.route('**/api/v1/memories/owned-memory/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname
    const handled =
      path.endsWith('/capabilities') ||
      path.includes('/maintenance-discoveries') ||
      path.includes('/maintenance-jobs') ||
      path.includes('/operations')
    if (!handled) {
      await route.fallback()
      return
    }
    try {
      const body = request.method() === 'GET' ? null : request.postDataJSON()
      let data,
        status = 200
      if (path.endsWith('/capabilities')) data = capabilities
      else if (path.endsWith('/operations'))
        data = {
          operations: [],
          next_cursor: null,
          limit: 20,
          view: 'pending',
          memory_state: 'active',
        }
      else if (path.includes('/operations/')) {
        const operationId = path.split('/operations/')[1]
        const batch = plan?.batches.find(
          (item) => item.analysis_operation_id === operationId,
        )
        assert.ok(batch)
        data = {
          operation_id: operationId,
          kind: 'dream_analyze',
          status: batch.state === 'analyzed' ? 'ready' : 'accepted',
          index_sync_status: batch.state === 'analyzed' ? 'ready' : 'pending',
          retryable: false,
          job_id: batch.job_id,
          execution: batch.execution,
          can_reconcile: false,
          writer_busy: false,
        }
      } else if (path.endsWith('/maintenance-discoveries/preview')) {
        calls.preview.push(body)
        data = preview(body)
      } else if (
        path.endsWith('/maintenance-discoveries') &&
        request.method() === 'POST'
      ) {
        calls.create.push(body)
        if (plan) {
          if (fingerprint(body) !== commandHash) status = 409
          data = plan
        } else {
          commandHash = fingerprint(body)
          data = makePlan(body, body.operation_id)
        }
      } else if (path.endsWith('/maintenance-discoveries'))
        data = {
          discoveries:
            plan &&
            (!url.searchParams.get('operation_id') ||
              url.searchParams.get('operation_id') === plan.operation_id)
              ? [plan]
              : [],
        }
      else if (path.endsWith('/runs')) {
        calls.runs.push(body)
        if (commands.has(body.operation_id))
          assert.deepEqual(commands.get(body.operation_id).body, body)
        else {
          const selected = plan.batches
            .filter((batch) => batch.state === 'planned')
            .slice(0, body.limit)
          commands.set(body.operation_id, {
            body,
            selected: selected.map((batch) => batch.batch_id),
          })
          for (const batch of selected) {
            batch.state = 'submitted'
            batch.job_state = 'pending'
            batch.execution = execution('queued')
          }
        }
        progress()
        data = plan
      } else if (path.includes('/maintenance-discoveries/')) data = plan
      else if (path.endsWith('/maintenance-jobs'))
        data = {
          jobs:
            plan?.batches
              .filter((batch) => batch.job_state)
              .map((batch) => childJob(plan, batch)) ?? [],
        }
      else if (path.endsWith('/reviews')) {
        calls.reviews++
        throw new Error('Browser fixture must not approve candidates')
      } else if (path.endsWith('/publications')) {
        calls.publications++
        throw new Error('Browser fixture must not publish')
      } else {
        const id = path.split('/maintenance-jobs/')[1]?.split('/')[0]
        const batch = plan?.batches.find((item) => item.job_id === id)
        assert.ok(
          batch?.job_state,
          'Reserved fragment job IDs are not readable',
        )
        if (path.endsWith('/candidates'))
          data = {
            candidates: [
              {
                ...childCandidate(batch),
                sources: [
                  {
                    input_id: `fragment-${batch.primary_sources[0].fragment.fragment_id}`,
                    source_id: incrementalSourceIds[0],
                    source_revision: 1,
                    source_generation: 2,
                    content_sha256: 'a'.repeat(64),
                    fragment: batch.primary_sources[0].fragment,
                  },
                ],
              },
            ],
          }
        else {
          data = childJob(plan, batch)
          data.inputs = [
            {
              input_id: `fragment-${batch.primary_sources[0].fragment.fragment_id}`,
              source_id: incrementalSourceIds[0],
              source_revision: 1,
              source_generation: 2,
              content_sha256: 'a'.repeat(64),
              fragment: batch.primary_sources[0].fragment,
              scope: plan.profile.scope,
              coverage: batch.state === 'analyzed' ? 'analyzed' : 'included',
              defer_reason: null,
            },
          ]
        }
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: status >= 400 ? status : 0,
          retmsg: status >= 400 ? 'Controlled conflict' : '',
          data,
        }),
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'segment_fixture_failed'
      errors.push(message)
      onError(message)
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: 500,
          retmsg: 'Controlled fragment fixture failed',
          data: null,
        }),
      })
    }
  })
  return {
    calls,
    errors,
    discoveryId: 'e'.repeat(32),
    finish,
    get plan() {
      return plan
    },
    primePartial() {
      makePlan(
        {
          scope: { user_id: '', agent_id: ' agent ', session_id: null },
          policy: 'general',
          entry_ids: [],
          batch_size: 1,
          max_sources: 2,
          input_budget_tokens: 8192,
          output_budget_tokens: 512,
          segmentation: {
            mode: 'segmented',
            fragment_token_limit: 256,
            max_parts_per_source: 32,
          },
        },
        'original-segment-plan',
      )
      plan.batches[0].job_state = 'ready'
      finish(0)
    },
  }
}

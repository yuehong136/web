import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { APIClient, APIError } from '../../src/api/client'
import {
  createMemoryDreamingAPI,
  createMemoryIncrementalAPI,
  createMemoryRevisionAPI,
} from '../../src/api/memory'
import type {
  MemoryDiscovery,
  MemoryDiscoveryScope,
} from '../../src/types/memory-incremental'

export interface MemoryIncrementalConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  expectedSourceIds: string[]
  scope?: MemoryDiscoveryScope
  ownedScratchConfirmed: true
  resultFile?: string
}

/** Caller owns a clean managed bank, registered small sources and a controlled worker. */
export async function runMemoryIncrementalConsumer(
  config: MemoryIncrementalConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.ok(
    config.expectedSourceIds.length >= 2 &&
      config.expectedSourceIds.length <= 256,
  )
  for (const id of config.expectedSourceIds) {
    assert.match(id, /^[1-9][0-9]*$/)
    assert.ok(BigInt(id) <= 9223372036854775807n)
  }
  const first = new APIClient(config.baseURL)
  first.setAuthToken(config.token)
  const api = createMemoryIncrementalAPI(config.baseURL, first)
  const jobs = createMemoryDreamingAPI(config.baseURL, first)
  const selection = {
    scope: config.scope ?? { user_id: null, agent_id: null, session_id: null },
    policy: 'general' as const,
    entry_ids: [],
    batch_size: 1,
    max_sources: config.expectedSourceIds.length,
    input_budget_tokens: 16384,
    output_budget_tokens: 2048,
  }
  let plan: MemoryDiscovery
  const creationId = `web-discovery-${randomUUID()}`
  try {
    const capabilities = await createMemoryRevisionAPI(
      config.baseURL,
      first,
    ).capabilities(config.memoryId)
    assert.equal(capabilities.maintenance?.discoveries?.supported, true)
    assert.equal(capabilities.revisions?.managed, true)
    assert.equal((await api.list(config.memoryId)).discoveries.length, 0)
    assert.equal((await jobs.list(config.memoryId)).jobs.length, 0)
    const preview = await api.preview(config.memoryId, selection)
    assert.equal(preview.registered_active_only, true)
    assert.equal(preview.token_fit, 'not_checked')
    assert.equal(preview.counts.covered, 0)
    assert.deepEqual(
      preview.batches
        .flatMap((batch) =>
          batch.primary_sources.map((source) => source.source_id),
        )
        .sort(),
      [...config.expectedSourceIds].sort(),
    )
    assert.equal((await api.list(config.memoryId)).discoveries.length, 0)
    assert.equal((await jobs.list(config.memoryId)).jobs.length, 0)
    const command = {
      ...selection,
      operation_id: creationId,
      expected_preview_sha256: preview.preview_sha256,
    }
    plan = await api.create(config.memoryId, command)
    assert.equal(plan.batches.length, config.expectedSourceIds.length)
    assert.ok(
      plan.batches.every(
        (batch) => batch.job_state === null && batch.state === 'planned',
      ),
    )
    const replay = await api.create(config.memoryId, command)
    assert.equal(replay.discovery_id, plan.discovery_id)
    assert.deepEqual(
      replay.batches.map((batch) => [
        batch.batch_id,
        batch.job_id,
        batch.create_operation_id,
        batch.analysis_operation_id,
      ]),
      plan.batches.map((batch) => [
        batch.batch_id,
        batch.job_id,
        batch.create_operation_id,
        batch.analysis_operation_id,
      ]),
    )
    await assert.rejects(
      api.create(config.memoryId, { ...command, policy: 'preferences' }),
      (error: unknown) => error instanceof APIError && error.status === 409,
    )
  } finally {
    first.setAuthToken(null)
  }
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const recovered = createMemoryIncrementalAPI(config.baseURL, client)
  const children = createMemoryDreamingAPI(config.baseURL, client)
  try {
    const found = await recovered.list(config.memoryId, creationId)
    assert.equal(found.discoveries.length, 1)
    assert.equal(found.discoveries[0].discovery_id, plan.discovery_id)
    const fixed = plan.batches.map((batch) => [
      batch.batch_id,
      batch.job_id,
      batch.create_operation_id,
      batch.analysis_operation_id,
    ])
    let current = await recovered.discovery(config.memoryId, plan.discovery_id)
    let explicitSubmissions = 0
    // Each test-owned command deliberately queues at most one child. Polling below never POSTs.
    for (let index = 0; index < plan.batches.length; index++) {
      const before = current.batches.filter(
        (batch) => batch.job_state !== null,
      ).length
      const command = {
        operation_id: `web-discovery-run-${randomUUID()}`,
        limit: 1,
      }
      current = await recovered.run(config.memoryId, plan.discovery_id, command)
      explicitSubmissions++
      assert.ok(
        current.batches.filter((batch) => batch.job_state !== null).length <=
          before + 1,
      )
      const replay = await recovered.run(
        config.memoryId,
        plan.discovery_id,
        command,
      )
      assert.deepEqual(
        replay.batches.map((batch) => [
          batch.batch_id,
          batch.job_id,
          batch.create_operation_id,
          batch.analysis_operation_id,
        ]),
        fixed,
      )
      current = replay
    }
    const deadline = Date.now() + 30000
    while (
      Date.now() < deadline &&
      !current.batches.every(
        (batch) =>
          batch.state === 'analyzed' && batch.execution?.state === 'succeeded',
      )
    ) {
      assert.ok(
        !current.batches.some((batch) =>
          ['failed', 'blocked', 'stale', 'canceled'].includes(batch.state),
        ),
        'Controlled small sources must remain analyzable',
      )
      await delay(100)
      current = await recovered.discovery(config.memoryId, plan.discovery_id)
    }
    assert.ok(
      current.batches.every(
        (batch) =>
          batch.state === 'analyzed' &&
          batch.job_state === 'ready' &&
          batch.execution?.state === 'succeeded',
      ),
    )
    assert.deepEqual(
      current.batches.map((batch) => [
        batch.batch_id,
        batch.job_id,
        batch.create_operation_id,
        batch.analysis_operation_id,
      ]),
      fixed,
    )
    for (const batch of current.batches) {
      const candidates = await children.candidates(
        config.memoryId,
        batch.job_id,
      )
      assert.ok(
        candidates.candidates.every(
          (candidate) =>
            candidate.state === 'pending' &&
            candidate.assessment.verification_status === 'unverified' &&
            candidate.review_actor_id === null &&
            candidate.publication_operation_id === null,
        ),
      )
      for (const source of [
        ...batch.primary_sources,
        ...batch.context_sources,
      ]) {
        for (const key of [
          'source_id',
          'source_revision',
          'source_generation',
        ] as const)
          assert.match(source[key], /^[1-9][0-9]*$/)
      }
    }
    const coverage = await recovered.preview(config.memoryId, selection)
    assert.equal(coverage.profile_sha256, plan.profile_sha256)
    assert.equal(coverage.counts.covered, config.expectedSourceIds.length)
    assert.equal(coverage.counts.selected_primary, 0)
    assert.equal(coverage.batches.length, 0)
    return {
      passed: true,
      discoveryId: plan.discovery_id,
      creationOperationId: creationId,
      fixedChildHandles: fixed,
      explicitSubmissions,
      sourceVersionsAnalyzed: coverage.counts.covered,
      previewCreatedNoJobs: true,
      newClientServerRecovery: true,
      pollingOnlyRead: true,
      automaticReviewOrPublication: false,
      coverageIsAccuracy: false,
    }
  } finally {
    client.setAuthToken(null)
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config = JSON.parse(
    readFileSync(process.argv[2], 'utf8'),
  ) as MemoryIncrementalConsumerConfig
  const result = await runMemoryIncrementalConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}

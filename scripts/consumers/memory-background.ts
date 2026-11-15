import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import {
  createMemoryDreamingAPI,
  createMemoryRevisionAPI,
} from '../../src/api/memory'
import type { MemoryMaintenanceJob } from '../../src/types/memory-dreaming'

export interface MemoryBackgroundConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  sourceIds: string[]
  entryIds?: string[]
  ownedScratchConfirmed: true
  resultFile?: string
}

/** The caller owns a managed scratch bank and a separately running controlled worker. */
export async function runMemoryBackgroundConsumer(
  config: MemoryBackgroundConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.ok(config.sourceIds.length && config.sourceIds.length <= 32)
  for (const sourceId of config.sourceIds)
    assert.match(sourceId, /^[1-9][0-9]*$/)
  const firstClient = new APIClient(config.baseURL)
  firstClient.setAuthToken(config.token)
  const firstJobs = createMemoryDreamingAPI(config.baseURL, firstClient)
  const runId = `web-background-${randomUUID()}`
  let job: MemoryMaintenanceJob
  try {
    job = await firstJobs.create(config.memoryId, {
      operation_id: `web-snapshot-${randomUUID()}`,
      source_ids: config.sourceIds,
      entry_ids: config.entryIds ?? [],
      policy: 'general',
      input_budget_tokens: 16384,
      output_budget_tokens: 4096,
    })
    assert.equal(job.state, 'pending')
    assert.equal(job.analysis_operation_id, null)
    const submitted = await firstJobs.run(config.memoryId, job.job_id, runId)
    assert.equal(submitted.analysis_operation_id, runId)
    assert.ok(
      submitted.execution,
      'Background submission returns durable execution metadata',
    )
  } finally {
    firstClient.setAuthToken(null)
  }
  // A new client has no Query cache, mutation state or locally retained command payload.
  const secondClient = new APIClient(config.baseURL)
  secondClient.setAuthToken(config.token)
  const jobs = createMemoryDreamingAPI(config.baseURL, secondClient)
  const operations = createMemoryRevisionAPI(config.baseURL, secondClient)
  try {
    const discovered = await operations.operations(config.memoryId, {
      view: 'all',
      limit: 20,
    })
    const original = discovered.operations.find(
      (operation) => operation.operation_id === runId,
    )
    assert.ok(
      original,
      'A new client discovers the original analysis operation from the server',
    )
    assert.equal(original.job_id, job.job_id)
    assert.ok(original.execution)
    assert.ok(!('content' in original) && !('prompt' in original))
    if (['queued', 'claimed', 'running'].includes(original.execution.state))
      assert.equal(original.can_reconcile, false)
    let current = await jobs.job(config.memoryId, job.job_id)
    const deadline = Date.now() + 30000
    while (current.state !== 'ready' && Date.now() < deadline) {
      assert.ok(
        !['failed', 'canceled', 'stale', 'redacted'].includes(current.state),
        `Analysis reached terminal state ${current.state}`,
      )
      assert.equal(current.execution?.needs_operator_reconciliation, false)
      await delay(100)
      current = await jobs.job(config.memoryId, job.job_id)
    }
    assert.equal(
      current.state,
      'ready',
      'The separately owned worker must finish within the fixture window',
    )
    assert.equal(current.analysis_operation_id, runId)
    assert.equal(current.execution?.state, 'succeeded')
    const candidates = await jobs.candidates(config.memoryId, job.job_id)
    assert.ok(
      candidates.candidates.length > 0,
      'Controlled fixture must emit candidates',
    )
    assert.ok(
      candidates.candidates.every(
        (candidate) =>
          candidate.state === 'pending' &&
          candidate.assessment.verification_status === 'unverified' &&
          candidate.publication_operation_id === null,
      ),
    )
    const operation = await operations.operation(config.memoryId, runId)
    assert.equal(operation.kind, 'dream_analyze')
    assert.equal(operation.execution?.state, 'succeeded')
    assert.equal(operation.can_reconcile, false)
    return {
      passed: true,
      jobId: job.job_id,
      analysisOperationId: runId,
      newClientServerDiscovery: true,
      executionState: current.execution?.state,
      candidateIds: candidates.candidates.map(
        (candidate) => candidate.candidate_id,
      ),
      onlyReadPolling: true,
      reviewOrPublicationRequests: 0,
    }
  } finally {
    secondClient.setAuthToken(null)
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config = JSON.parse(
    readFileSync(process.argv[2], 'utf8'),
  ) as MemoryBackgroundConsumerConfig
  const result = await runMemoryBackgroundConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}

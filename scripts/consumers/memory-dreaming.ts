import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { APIClient, APIError } from '../../src/api/client'
import {
  createMemoryDreamingAPI,
  createMemoryRevisionAPI,
} from '../../src/api/memory'

export interface MemoryDreamingConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  sourceIds: string[]
  entryIds?: string[]
  ownedScratchConfirmed: true
  resultFile?: string
}

/** The fixture provides a disposable managed bank, registered sources and a controlled analyzer. */
export async function runMemoryDreamingConsumer(
  config: MemoryDreamingConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.ok(config.sourceIds.length > 0 && config.sourceIds.length <= 32)
  for (const sourceId of config.sourceIds) {
    assert.match(sourceId, /^[1-9][0-9]*$/)
    assert.ok(BigInt(sourceId) <= 9223372036854775807n)
  }
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemoryDreamingAPI(config.baseURL, client)
  const revision = createMemoryRevisionAPI(config.baseURL, client)
  try {
    const capabilities = await revision.capabilities(config.memoryId)
    assert.equal(capabilities.maintenance?.supported, true)
    assert.equal(capabilities.maintenance.automatic_publication, false)
    const create = {
      operation_id: `web-dream-create-${randomUUID()}`,
      source_ids: config.sourceIds,
      entry_ids: config.entryIds ?? [],
      policy: 'general' as const,
      input_budget_tokens: 16384,
      output_budget_tokens: 4096,
    }
    const job = await api.create(config.memoryId, create)
    assert.equal(job.state, 'pending')
    assert.deepEqual(
      job.inputs.map((input) => input.source_id).sort(),
      [...config.sourceIds].sort(),
    )
    const replay = await api.create(config.memoryId, create)
    assert.equal(replay.job_id, job.job_id)
    await assert.rejects(
      api.create(config.memoryId, { ...create, output_budget_tokens: 4095 }),
      (error: unknown) => error instanceof APIError && error.status === 409,
    )
    const read = await api.job(config.memoryId, job.job_id)
    assert.equal(read.state, 'pending', 'GET must not start model analysis')
    assert.equal(read.analysis_operation_id, null)
    const runId = `web-dream-run-${randomUUID()}`
    let analyzed = await api.run(config.memoryId, job.job_id, runId)
    const deadline = Date.now() + 30000
    while (analyzed.state !== 'ready' && Date.now() < deadline) {
      assert.ok(
        !['failed', 'canceled', 'stale', 'redacted'].includes(analyzed.state),
      )
      assert.notEqual(analyzed.execution?.needs_operator_reconciliation, true)
      await delay(100)
      analyzed = await api.job(config.memoryId, job.job_id)
    }
    assert.equal(
      analyzed.state,
      'ready',
      'The owned worker or inline fixture must finish in the controlled window',
    )
    assert.equal(analyzed.analysis_operation_id, runId)
    const first = await api.candidates(config.memoryId, job.job_id)
    const candidate = first.candidates.find((value) => value.action !== 'noop')
    assert.ok(
      candidate,
      'Controlled fixture must provide at least one publishable proposal',
    )
    assert.equal(candidate.state, 'pending')
    assert.deepEqual(candidate.assessment, {
      kind: 'hypothesis',
      verification_status: 'unverified',
    })
    for (const source of candidate.sources) {
      assert.equal(typeof source.source_id, 'string')
      assert.ok(config.sourceIds.includes(source.source_id))
    }
    await api.run(config.memoryId, job.job_id, runId)
    assert.deepEqual(
      (await api.candidates(config.memoryId, job.job_id)).candidates.map(
        (value) => value.candidate_id,
      ),
      first.candidates.map((value) => value.candidate_id),
      'Same analysis operation must preserve candidate identities',
    )
    const review = {
      operation_id: `web-dream-review-${randomUUID()}`,
      expected_revision: candidate.revision,
      decision: 'approve' as const,
    }
    const approved = await api.review(
      config.memoryId,
      job.job_id,
      candidate.candidate_id,
      review,
    )
    assert.equal(approved.state, 'approved')
    assert.equal(approved.revision, candidate.revision + 1)
    assert.deepEqual(approved.assessment, candidate.assessment)
    assert.equal(
      (
        await api.review(
          config.memoryId,
          job.job_id,
          candidate.candidate_id,
          review,
        )
      ).revision,
      approved.revision,
    )
    const publish = {
      operation_id: `web-dream-publish-${randomUUID()}`,
      candidates: [
        {
          candidate_id: approved.candidate_id,
          expected_revision: approved.revision,
        },
      ],
    }
    const receipt = await api.publish(config.memoryId, job.job_id, publish)
    assert.equal(receipt.operation_id, publish.operation_id)
    assert.equal(receipt.kind, 'dream_publish')
    assert.equal(receipt.status, 'ready')
    assert.equal(receipt.index_sync_status, 'ready')
    assert.deepEqual(receipt.candidate_ids, [approved.candidate_id])
    assert.equal(receipt.entries.length, 1)
    for (const entry of receipt.entries) {
      assert.equal(typeof entry.message_id, 'string')
      assert.match(entry.message_id, /^[1-9][0-9]*$/)
      const current = await revision.getEntry(config.memoryId, entry.entry_id)
      assert.equal(current.current_revision, entry.new_revision)
      assert.equal(current.current_message_id, entry.message_id)
    }
    const repeated = await api.publish(config.memoryId, job.job_id, publish)
    assert.deepEqual(repeated.entries, receipt.entries)
    const operation = await revision.operation(
      config.memoryId,
      publish.operation_id,
    )
    assert.equal(operation.status, 'ready')
    assert.equal(operation.index_sync_status, 'ready')
    return {
      passed: true,
      jobId: job.job_id,
      analysisOperationId: runId,
      publicationOperationId: publish.operation_id,
      candidateIds: receipt.candidate_ids,
      messageIds: receipt.entries.map((entry) => entry.message_id),
      sourceIds: config.sourceIds,
      createReplayStable: true,
      differentBody409: true,
      getDidNotRunAnalysis: true,
      analysisReplayStable: true,
      reviewReplayStable: true,
      approvalRemainsUnverified: true,
      publicationReadBack: true,
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
  ) as MemoryDreamingConsumerConfig
  const result = await runMemoryDreamingConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}

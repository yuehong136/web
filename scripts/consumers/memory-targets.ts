import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import {
  createMemoryDreamingAPI,
  createMemoryIncrementalAPI,
  createMemoryRevisionAPI,
} from '../../src/api/memory'
import {
  selectedMemoryTargets,
  targetSourceIds,
} from '../../src/lib/memory-targets'
import type { MemoryTargetRecommendationRequest } from '../../src/types/memory-targets'

export interface MemoryTargetsConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  sourceIds: string[]
  userId: string
  agentId: string
  expectedTargetEntryId: string
  query?: string
  excludedEntryIds?: string[]
  ownedScratchConfirmed: true
  resultFile?: string
}

/** Caller owns a managed scratch bank, selected RAW inputs and an existing target entry. */
export async function runMemoryTargetsConsumer(
  config: MemoryTargetsConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.ok(config.sourceIds.length > 0 && config.sourceIds.length <= 8)
  assert.equal(new Set(config.sourceIds).size, config.sourceIds.length)
  for (const id of config.sourceIds) {
    assert.equal(typeof id, 'string')
    assert.match(id, /^[1-9][0-9]*$/)
    assert.ok(BigInt(id) <= 9223372036854775807n)
  }
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const jobs = createMemoryDreamingAPI(config.baseURL, client)
  const revisions = createMemoryRevisionAPI(config.baseURL, client)
  const discoveries = createMemoryIncrementalAPI(config.baseURL, client)
  try {
    const capabilities = await revisions.capabilities(config.memoryId)
    const capability = capabilities.maintenance?.target_recommendations
    assert.equal(capability?.supported, true)
    assert.equal(capability?.mutates_memory, false)
    assert.equal(capability?.automatic_selection, false)
    const before = await revisions.getEntry(
      config.memoryId,
      config.expectedTargetEntryId,
    )
    const beforeJobs = await jobs.list(config.memoryId)
    const request: MemoryTargetRecommendationRequest = {
      source_ids: config.sourceIds,
      user_id: config.userId,
      agent_id: config.agentId,
      query: config.query ?? null,
      retrieval_mode: 'hybrid',
      limit: Math.min(5, capability!.max_targets),
      budget_tokens: Math.min(4096, capability!.max_budget_tokens),
      query_budget_tokens: Math.min(2048, capability!.max_query_budget_tokens),
    }
    const suggested = await jobs.recommendTargets(config.memoryId, request)
    assert.equal(suggested.retrieval.mode, 'hybrid')
    assert.ok(
      suggested.retrieval.embedding_calls >= 0 &&
        suggested.retrieval.embedding_calls <= 1,
    )
    assert.ok(suggested.targets.length <= request.limit)
    assert.equal(suggested.budget.token_count_is_estimate, true)
    assert.ok(
      suggested.budget.estimated_tokens <= suggested.budget.budget_tokens,
    )
    const target = suggested.targets.find(
      (item) => item.entry_id === config.expectedTargetEntryId,
    )
    assert.ok(target, 'The controlled matching target must be shown')
    for (const excluded of config.excludedEntryIds ?? [])
      assert.ok(
        !suggested.targets.some((item) => item.entry_id === excluded),
        'Excluded scoped target must not be shown',
      )
    for (const item of suggested.targets) {
      assert.equal(item.scope.user_id, config.userId)
      assert.equal(item.scope.agent_id, config.agentId)
      assert.equal(
        createHash('sha256').update(item.content).digest('hex'),
        item.content_sha256,
        'The shown current entry must be complete, not a silent excerpt',
      )
      for (const value of [item.revision, item.message_id, item.generation]) {
        assert.equal(typeof value, 'string')
        assert.match(value, /^[1-9][0-9]*$/)
      }
      assert.ok(
        item.source_versions.length > 0 &&
          item.source_versions.length <= capability!.max_closure_sources,
      )
      for (const source of item.source_versions) {
        assert.equal(source.scope.user_id, config.userId)
        assert.equal(source.scope.agent_id, config.agentId)
        for (const value of [
          source.source_id,
          source.source_revision,
          source.source_generation,
        ]) {
          assert.equal(typeof value, 'string')
          assert.match(value, /^[1-9][0-9]*$/)
        }
        assert.match(source.projection_sha256, /^[0-9a-f]{64}$/)
      }
    }
    const lexical = await jobs.recommendTargets(config.memoryId, {
      ...request,
      retrieval_mode: 'lexical',
    })
    assert.equal(lexical.retrieval.mode, 'lexical')
    assert.equal(lexical.retrieval.embedding_calls, 0)
    assert.equal(
      (await jobs.list(config.memoryId)).jobs.length,
      beforeJobs.jobs.length,
    )
    assert.ok(
      JSON.stringify(
        await revisions.getEntry(config.memoryId, config.expectedTargetEntryId),
      ) === JSON.stringify(before),
      'Recommendations must not change the current entry',
    )
    const confirmation = selectedMemoryTargets(suggested, [
      config.expectedTargetEntryId,
    ])
    assert.equal(confirmation.targets.length, 1)
    assert.equal(confirmation.targets[0].entry_id, config.expectedTargetEntryId)
    assert.equal(confirmation.targets[0].revision, target.revision)
    assert.ok(
      !('content' in confirmation.targets[0]),
      'The confirmation must contain metadata, not the entry body',
    )
    const selection = {
      scope: {
        user_id: config.userId,
        agent_id: config.agentId,
        session_id: null,
      },
      policy: 'general' as const,
      entry_ids: [config.expectedTargetEntryId],
      batch_size: 32,
      max_sources: 8,
      input_budget_tokens: 16384,
      output_budget_tokens: 4096,
      target_preconditions: confirmation,
    }
    const preview = await discoveries.preview(config.memoryId, selection)
    assert.deepEqual(preview.target_preconditions, confirmation)
    assert.equal(
      (await jobs.list(config.memoryId)).jobs.length,
      beforeJobs.jobs.length,
    )
    const command = {
      operation_id: `web-targets-${randomUUID()}`,
      source_ids: targetSourceIds(confirmation),
      entry_ids: [config.expectedTargetEntryId],
      policy: 'general' as const,
      input_budget_tokens: 16384,
      output_budget_tokens: 4096,
      target_preconditions: confirmation,
    }
    const accepted = await jobs.create(config.memoryId, command)
    assert.equal(accepted.state, 'pending')
    assert.deepEqual(accepted.target_preconditions, confirmation)
    assert.equal(
      (await jobs.create(config.memoryId, command)).job_id,
      accepted.job_id,
    )
    const read = await jobs.job(config.memoryId, accepted.job_id)
    assert.equal(read.state, 'pending')
    assert.deepEqual(read.target_preconditions, confirmation)
    assert.equal(read.analysis_operation_id, null)
    assert.ok(
      JSON.stringify(
        await revisions.getEntry(config.memoryId, config.expectedTargetEntryId),
      ) === JSON.stringify(before),
      'Metadata-only snapshot creation must not publish a correction',
    )
    return {
      passed: true,
      targetEntryId: target.entry_id,
      targetRevision: target.revision,
      shownTargets: suggested.targets.length,
      explicitlySelectedTargets: 1,
      hybridEmbeddingCalls: suggested.retrieval.embedding_calls,
      lexicalEmbeddingCalls: lexical.retrieval.embedding_calls,
      metadataJobId: accepted.job_id,
      boundedRecommendation: true,
      fullCurrentTextHashVerified: true,
      selectedConfirmationPreserved: true,
      noAnalysisReviewOrPublication: true,
      recommendationIsVerification: false,
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
  ) as MemoryTargetsConsumerConfig
  const result = await runMemoryTargetsConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}

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
import type { MemorySegmentedSelection } from '../../src/types/memory-segments'
import type {
  MemoryDiscovery,
  MemoryDiscoveryPreview,
  MemoryDiscoveryScope,
  MemoryDiscoverySelection,
} from '../../src/types/memory-incremental'

export interface MemorySegmentsConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  expectedSourceId: string
  scope?: MemoryDiscoveryScope
  fragmentTokenLimit?: number
  maxPartsPerSource?: number
  inputBudgetTokens?: number
  outputBudgetTokens?: number
  expectedMinParts?: number
  expectedCodepoints?: number
  requireCandidateProvenance?: boolean
  ownedScratchConfirmed: true
  resultFile?: string
}

const fixedHandles = (value: MemoryDiscovery) =>
  value.batches.map((batch) => [
    batch.batch_id,
    batch.job_id,
    batch.create_operation_id,
    batch.analysis_operation_id,
  ])
const primary = (value: MemoryDiscoveryPreview) =>
  value.batches.flatMap((batch) => batch.primary_sources)

/** Caller owns one registered long source, a clean managed bank and a controlled worker. */
export async function runMemorySegmentsConsumer(
  config: MemorySegmentsConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.match(config.expectedSourceId, /^[1-9][0-9]*$/)
  assert.ok(BigInt(config.expectedSourceId) <= 9223372036854775807n)
  const segmentation: MemorySegmentedSelection = {
    mode: 'segmented',
    fragment_token_limit: config.fragmentTokenLimit ?? 256,
    max_parts_per_source: config.maxPartsPerSource ?? 32,
  }
  const selection: MemoryDiscoverySelection = {
    scope: config.scope ?? { user_id: null, agent_id: null, session_id: null },
    policy: 'general',
    entry_ids: [],
    batch_size: 1,
    max_sources: 1,
    input_budget_tokens: config.inputBudgetTokens ?? 8192,
    output_budget_tokens: config.outputBudgetTokens ?? 512,
    segmentation,
  }
  const first = new APIClient(config.baseURL)
  first.setAuthToken(config.token)
  const api = createMemoryIncrementalAPI(config.baseURL, first)
  const jobs = createMemoryDreamingAPI(config.baseURL, first)
  const creationId = `web-segments-${randomUUID()}`
  let plan: MemoryDiscovery
  try {
    const cap = await createMemoryRevisionAPI(
      config.baseURL,
      first,
    ).capabilities(config.memoryId)
    assert.equal(cap.revisions?.managed, true)
    assert.equal(cap.maintenance?.discoveries?.segmentation?.supported, true)
    assert.equal((await api.list(config.memoryId)).discoveries.length, 0)
    assert.equal((await jobs.list(config.memoryId)).jobs.length, 0)
    const wholeSelection = { ...selection }
    delete wholeSelection.segmentation
    const whole = await api.preview(config.memoryId, wholeSelection)
    assert.equal(whole.token_fit, 'not_checked')
    assert.equal(whole.profile.segmentation, undefined)
    const preview = await api.preview(config.memoryId, selection)
    assert.equal(preview.token_fit, 'checked_at_preview')
    assert.equal(preview.source_coverage?.unit, 'sources')
    const sources = primary(preview)
    assert.ok(sources.length >= (config.expectedMinParts ?? 3))
    assert.equal(preview.counts.selected_primary, 1)
    assert.equal(preview.counts.selected_fragments, sources.length)
    assert.equal(
      new Set(sources.map((source) => source.fragment?.fragment_id)).size,
      sources.length,
    )
    assert.equal(preview.source_coverage?.total_parts, sources.length)
    let end = 0
    for (const [index, source] of sources.entries()) {
      assert.equal(source.source_id, config.expectedSourceId)
      for (const key of [
        'source_id',
        'source_revision',
        'source_generation',
      ] as const)
        assert.match(source[key], /^[1-9][0-9]*$/)
      assert.match(source.content_sha256, /^[0-9a-f]{64}$/)
      assert.equal(source.content_sha256, sources[0].content_sha256)
      const fragment = source.fragment!
      assert.ok(fragment)
      assert.equal(fragment.part_index, index)
      assert.equal(fragment.part_count, sources.length)
      assert.equal(fragment.offset_unit, 'unicode_codepoint')
      assert.equal(fragment.core_start, end)
      assert.ok(fragment.core_end > fragment.core_start)
      assert.ok(fragment.read_start >= 0)
      assert.ok(
        fragment.read_start <= fragment.core_start &&
          fragment.core_start - fragment.read_start <= 64,
      )
      assert.ok(
        fragment.read_end >= fragment.core_end &&
          fragment.read_end - fragment.core_end <= 64,
      )
      for (const value of [
        fragment.fragment_id,
        fragment.core_sha256,
        fragment.read_sha256,
      ])
        assert.match(value, /^[0-9a-f]{64}$/)
      end = fragment.core_end
    }
    assert.ok(sources.every((source) => source.fragment!.read_end <= end))
    if (config.expectedCodepoints !== undefined)
      assert.equal(end, config.expectedCodepoints)
    assert.equal((await api.list(config.memoryId)).discoveries.length, 0)
    assert.equal((await jobs.list(config.memoryId)).jobs.length, 0)
    const command = {
      ...selection,
      operation_id: creationId,
      expected_preview_sha256: preview.preview_sha256,
    }
    plan = await api.create(config.memoryId, command)
    assert.deepEqual(primary(plan), sources)
    assert.ok(
      plan.batches.every(
        (batch) => batch.state === 'planned' && batch.job_state === null,
      ),
    )
    assert.deepEqual(
      fixedHandles(await api.create(config.memoryId, command)),
      fixedHandles(plan),
    )
    await assert.rejects(
      api.create(config.memoryId, {
        ...command,
        segmentation: {
          ...segmentation,
          mode: 'segmented',
          fragment_token_limit: (config.fragmentTokenLimit ?? 256) + 1,
        },
      }),
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
    assert.equal(found.discoveries[0].discovery_id, plan.discovery_id)
    const handles = fixedHandles(plan)
    const frozenCounts = structuredClone(plan.counts)
    let current = await recovered.discovery(config.memoryId, plan.discovery_id)
    let observedCandidates = 0
    for (let index = 0; index < plan.batches.length; index++) {
      const command = {
        operation_id: `web-fragment-run-${randomUUID()}`,
        limit: 1,
      }
      current = await recovered.run(config.memoryId, plan.discovery_id, command)
      assert.ok(
        current.batches.filter((batch) => batch.job_state !== null).length <=
          index + 1,
      )
      current = await recovered.run(config.memoryId, plan.discovery_id, command)
      assert.deepEqual(fixedHandles(current), handles)
      const deadline = Date.now() + 30000
      while (
        Date.now() < deadline &&
        !(
          current.batches[index].state === 'analyzed' &&
          current.batches[index].execution?.state === 'succeeded' &&
          current.source_coverage?.analyzed_parts === index + 1
        )
      ) {
        assert.ok(
          !current.batches.some((batch) =>
            ['failed', 'blocked', 'stale', 'canceled'].includes(batch.state),
          ),
          'The owned controlled fragment fixture must remain analyzable',
        )
        await delay(100)
        current = await recovered.discovery(config.memoryId, plan.discovery_id)
      }
      assert.equal(current.batches[index].state, 'analyzed')
      assert.equal(current.batches[index].execution?.state, 'succeeded')
      assert.equal(current.source_coverage?.analyzed_parts, index + 1)
      assert.deepEqual(current.counts, frozenCounts)
      assert.deepEqual(fixedHandles(current), handles)
      assert.deepEqual(primary(current), primary(plan))
      if (index < plan.batches.length - 1) {
        assert.equal(current.source_coverage?.covered, 0)
        assert.equal(current.source_coverage?.partial, 1)
      }
      const batch = current.batches[index]
      const fragment = batch.primary_sources[0].fragment!
      const candidates = await children.candidates(
        config.memoryId,
        batch.job_id,
      )
      if (config.requireCandidateProvenance !== false)
        assert.ok(
          candidates.candidates.length,
          'Controlled analyzer must provide candidate provenance for this consumer',
        )
      for (const candidate of candidates.candidates) {
        observedCandidates++
        assert.equal(candidate.state, 'pending')
        assert.equal(candidate.assessment.verification_status, 'unverified')
        assert.equal(candidate.review_actor_id, null)
        assert.equal(candidate.publication_operation_id, null)
        assert.ok(candidate.sources.length)
        for (const source of candidate.sources) {
          assert.equal(source.source_id, config.expectedSourceId)
          assert.equal(
            source.content_sha256,
            batch.primary_sources[0].content_sha256,
          )
          assert.deepEqual(source.fragment, fragment)
        }
      }
    }
    assert.equal(current.source_coverage?.covered, 1)
    assert.equal(current.source_coverage?.partial, 0)
    const coverage = await recovered.preview(config.memoryId, selection)
    assert.equal(coverage.profile_sha256, plan.profile_sha256)
    assert.equal(coverage.counts.covered, 1)
    assert.equal(coverage.counts.selected_fragments, 0)
    assert.equal(coverage.batches.length, 0)
    return {
      passed: true,
      discoveryId: plan.discovery_id,
      creationOperationId: creationId,
      fixedChildHandles: handles,
      sourceVersionsAnalyzed: 1,
      fragmentsAnalyzed: plan.batches.length,
      observedCandidates,
      contiguousUnicodeRanges: true,
      partialIsNotWholeCoverage: true,
      freshClientRecovery: true,
      explicitBoundedSubmissions: plan.batches.length,
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
  ) as MemorySegmentsConsumerConfig
  const result = await runMemorySegmentsConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import { createMemoryStartupAPI } from '../../src/api/memory-startup'
import { createMemoryRevisionAPI } from '../../src/api/memory'
import { boundSourceRange } from '../../src/lib/memory-source-excerpt'
import type {
  MemoryStartupOmission,
  MemoryStartupRequest,
} from '../../src/types/memory-startup'
export interface MemoryStartupConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  userId: string
  agentId: string
  entryId: string
  ownedScratchConfirmed: true
  resultFile?: string
  phaseLabel?: string
  entryIds?: string[] | null
  expectedIncluded?: string[]
  expectedOmitted?: { entryId: string; reason: MemoryStartupOmission }[]
  budgetTokens?: number
  maxItems?: number
  inventoryLimit?: number
}
/** The caller owns this live scratch bank. This consumer never records verification, analyzes or publishes. */
export async function runMemoryStartupConsumer(
  config: MemoryStartupConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const expectedIncluded = config.expectedIncluded ?? [config.entryId],
    expectedOmitted = config.expectedOmitted ?? [],
    request: MemoryStartupRequest = {
      user_id: config.userId,
      agent_id: config.agentId,
      session_id: null,
      entry_ids:
        config.entryIds === undefined ? [config.entryId] : config.entryIds,
      budget_tokens: config.budgetTokens ?? 16384,
      max_items: config.maxItems ?? 8,
      inventory_limit: config.inventoryLimit ?? 64,
    }
  const uniqueIds = (ids: string[]) => {
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(ids.every((id) => /^[0-9a-f]{32}$/.test(id)))
  }
  uniqueIds(expectedIncluded)
  uniqueIds(expectedOmitted.map((row) => row.entryId))
  assert.ok(
    expectedOmitted.every((row) => !expectedIncluded.includes(row.entryId)),
  )
  if (request.entry_ids !== null) {
    uniqueIds(request.entry_ids)
    assert.ok(request.entry_ids.length >= 1 && request.entry_ids.length <= 32)
    assert.ok(
      [...expectedIncluded, ...expectedOmitted.map((row) => row.entryId)].every(
        (id) => request.entry_ids!.includes(id),
      ),
    )
  }
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemoryStartupAPI(config.baseURL, client),
    revisions = createMemoryRevisionAPI(config.baseURL, client)
  const canonical = (value: string) => {
    assert.equal(typeof value, 'string')
    assert.match(value, /^[1-9][0-9]*$/)
    assert.ok(BigInt(value) <= 9223372036854775807n)
  }
  try {
    assert.equal(
      (await revisions.capabilities(config.memoryId)).startup_context
        ?.supported,
      true,
    )
    const value = await api.preview(config.memoryId, request)
    assert.equal(value.memory_id, config.memoryId)
    assert.deepEqual(value.scope, {
      user_id: config.userId,
      agent_id: config.agentId,
      session_id: null,
    })
    assert.deepEqual(
      value.items.map((item) => item.entry_id).sort(),
      [...expectedIncluded].sort(),
      'Included entries must match this explicitly declared phase',
    )
    for (const item of value.items) {
      canonical(item.revision)
      canonical(item.message_id)
      canonical(item.generation)
      assert.equal(item.scope.user_id, config.userId)
      assert.equal(item.scope.agent_id, config.agentId)
      assert.equal(
        createHash('sha256').update(item.content).digest('hex'),
        item.content_sha256,
      )
      assert.equal(item.verification.result, 'human_confirmed')
      assert.equal(
        typeof item.verification.checked_at_is_user_reported,
        'boolean',
      )
      assert.ok(value.startup_text.includes(item.content))
      assert.ok(value.startup_text.includes(item.verification.applicability))
      assert.ok(item.sources.length)
      for (const source of item.sources) {
        canonical(source.source_id)
        canonical(source.source_revision)
        canonical(source.source_generation)
        assert.equal(source.scope.user_id, config.userId)
        assert.equal(source.scope.agent_id, config.agentId)
      }
    }
    if (!value.items.length)
      assert.equal(
        value.startup_text,
        '',
        'An explicitly empty phase must not retain startup text',
      )
    for (const expected of expectedOmitted) {
      assert.ok(!value.items.some((item) => item.entry_id === expected.entryId))
      assert.ok(
        value.omitted.entries.some(
          (row) =>
            row.entry_id === expected.entryId && row.reason === expected.reason,
        ),
        'An omission needs its explicit reason detail; a truncated detail list is not proof',
      )
      assert.ok(
        (value.omitted.counts[expected.reason] ?? 0) >=
          expectedOmitted.filter((row) => row.reason === expected.reason)
            .length,
      )
    }
    assert.equal(value.model_calls, false)
    assert.equal(value.mutates_memory, false)
    assert.equal(value.snapshot_only, true)
    assert.equal(value.usage.includes, 'entire_json_with_startup_text')
    assert.ok(value.usage.estimated_tokens <= value.usage.budget_tokens)
    const source = value.items[0]?.sources[0]
    let fragments = 0,
      range: ReturnType<typeof boundSourceRange> | null = null
    if (source) {
      canonical(source.source_id)
      canonical(source.source_revision)
      canonical(source.source_generation)
      const first = await api.source(config.memoryId, source, 0, 8)
      range = boundSourceRange(first, source, config.memoryId, 0, 8)
      fragments++
      if (first.next_offset !== null) {
        const next = await api.source(
          config.memoryId,
          source,
          first.next_offset,
          8,
        )
        boundSourceRange(next, source, config.memoryId, first.next_offset, 8)
        fragments++
      }
    }
    const after = await api.preview(config.memoryId, request)
    assert.deepEqual(after.items, value.items)
    assert.equal(after.startup_text, value.startup_text)
    assert.deepEqual(after.omitted, value.omitted)
    const result = {
      passed: true,
      items: value.items.length,
      sourceFragments: fragments,
      firstRange: range,
      packageSha256: value.package_sha256,
      assessmentPreserved: value.items[0]?.assessment ?? null,
      phaseLabel: config.phaseLabel ?? null,
      included: value.items.map((item) => ({
        entryId: item.entry_id,
        revision: item.revision,
        messageId: item.message_id,
        generation: item.generation,
        contentSha256: item.content_sha256,
        verificationId: item.verification.verification_id,
        verificationHead: item.verification.head_version,
        applicabilitySha256: createHash('sha256')
          .update(item.verification.applicability)
          .digest('hex'),
        assessment: item.assessment,
        sources: item.sources.map((source) => ({
          sourceId: source.source_id,
          revision: source.source_revision,
          generation: source.source_generation,
          contentSha256: source.content_sha256,
        })),
      })),
      omitted: value.omitted,
      usage: value.usage,
      selection: value.selection,
      startupTextSha256: createHash('sha256')
        .update(value.startup_text)
        .digest('hex'),
      readOnly: true,
      modelCalls: false,
    }
    if (config.resultFile)
      writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
        flag: 'wx',
      })
    return result
  } finally {
    client.setAuthToken(null)
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const path = process.argv[2]
  assert.ok(path, 'Provide a private JSON config')
  const result = await runMemoryStartupConsumer(
    JSON.parse(readFileSync(path, 'utf8')),
  )
  console.log(JSON.stringify(result))
}

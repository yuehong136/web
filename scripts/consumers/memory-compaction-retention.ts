import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import { createMemoryCompactionAPI } from '../../src/api/memory-compaction'
import { createMemoryStartupAPI } from '../../src/api/memory-startup'
import {
  compactionConsumptionReference,
  compactionReaderSource,
  validateCompactionResult,
} from '../../src/lib/memory-compaction'
import {
  retentionCanConfirm,
  validateCompactionInventory,
  validateRetirementResult,
  validateRetentionPreview,
} from '../../src/lib/memory-compaction-retention'
import { boundSourceRange } from '../../src/lib/memory-source-excerpt'

export interface MemoryCompactionRetentionConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  operationId: string
  artifactId: string
  mode: 'retire' | 'read'
  ownedScratchConfirmed: true
  resultFile?: string
}

export async function runMemoryCompactionRetentionConsumer(
  config: MemoryCompactionRetentionConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.ok(config.mode === 'retire' || config.mode === 'read')
  const { baseURL, memoryId, operationId, artifactId } = config
  const client = new APIClient(baseURL)
  client.setAuthToken(config.token.replace(/^Bearer\s+/i, ''))
  const api = createMemoryCompactionAPI(baseURL, client)
  const reader = createMemoryStartupAPI(baseURL, client)
  try {
    const initial = await api.operation(memoryId, operationId)
    validateCompactionResult(initial, memoryId, operationId)
    assert.equal(initial.artifact.artifact_id, artifactId)
    const before = await api.inventory(memoryId)
    validateCompactionInventory(before, memoryId)
    let retirementRequests = 0
    if (config.mode === 'retire') {
      const reference = compactionConsumptionReference(
        initial,
        memoryId,
        operationId,
      )
      const ticket = await api.retentionPreview(memoryId, artifactId)
      validateRetentionPreview(ticket, initial)
      assert.ok(retentionCanConfirm(ticket, initial))
      assert.deepEqual(ticket.affected.consumption_reference, reference)
      assert.deepEqual(
        ticket.affected.source_ids,
        initial.artifact.sources.map((source) => source.source_id),
      )
      const source = compactionReaderSource(initial.artifact.sources[0]!)
      const rawBefore = await reader.source(memoryId, source, 0, 512)
      boundSourceRange(rawBefore, source, memoryId, 0, 512)
      const receipt = await api.retire(
        memoryId,
        artifactId,
        ticket.preview_sha256,
      )
      retirementRequests++
      validateRetirementResult(receipt, ticket)
      const replay = await api.retire(
        memoryId,
        artifactId,
        ticket.preview_sha256,
      )
      retirementRequests++
      validateRetirementResult(replay, ticket)
      assert.deepEqual(replay, receipt)
      const rawAfter = await reader.source(memoryId, source, 0, 512)
      boundSourceRange(rawAfter, source, memoryId, 0, 512)
      assert.ok(
        rawBefore.excerpt === rawAfter.excerpt &&
          rawBefore.total_chars === rawAfter.total_chars,
        'RAW source must remain unchanged',
      )
    }
    const reopened = await api.operation(memoryId, operationId)
    validateCompactionResult(reopened, memoryId, operationId)
    assert.equal(reopened.artifact.artifact_id, artifactId)
    const retirement = reopened.artifact.retirement
    assert.ok(retirement)
    const preview = await api.retentionPreview(memoryId, artifactId)
    validateRetentionPreview(preview, reopened)
    assert.equal(preview.eligible, false)
    assert.ok(preview.blockers.includes('already_retired'))
    assert.equal(preview.affected.releases_slots, 0)
    assert.equal(preview.affected.clears_package, false)
    assert.equal(preview.affected.source_count, 0)
    const originalTicket = {
      ...preview,
      preview_sha256: retirement.preview_sha256,
    }
    validateRetirementResult(reopened, originalTicket)
    assert.deepEqual(await api.artifact(memoryId, artifactId), reopened)
    assert.throws(() =>
      compactionConsumptionReference(reopened, memoryId, operationId),
    )
    const item = (await api.list(memoryId)).items.find(
      (item) => item.artifact_id === artifactId,
    )
    assert.ok(item)
    assert.equal(item.operation_id, operationId)
    assert.equal(item.retired_at, reopened.artifact.retired_at)
    assert.equal(item.package, null)
    const after = await api.inventory(memoryId)
    validateCompactionInventory(after, memoryId)
    const slots = config.mode === 'retire' ? 1 : 0
    assert.equal(after.retained_count, before.retained_count - slots)
    assert.equal(after.retired_count, before.retired_count + slots)
    assert.equal(after.available_slots, before.available_slots + slots)
    return {
      passed: true,
      operationId,
      artifactId,
      retiredAt: retirement.retired_at,
      retainedBefore: before.retained_count,
      retainedAfter: after.retained_count,
      retirementRequests,
      generationRequests: 0,
      applicationRequests: 0,
      readOnlyRecovery: true,
    }
  } finally {
    client.setAuthToken(null)
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config: MemoryCompactionRetentionConsumerConfig = JSON.parse(
    readFileSync(process.argv[2]!, 'utf8'),
  )
  const result = await runMemoryCompactionRetentionConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
      mode: 0o600,
    })
  else console.log(JSON.stringify(result))
}

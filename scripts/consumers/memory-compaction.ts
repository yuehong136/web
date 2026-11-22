import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import { createMemoryCompactionAPI } from '../../src/api/memory-compaction'
import { createMemoryStartupAPI } from '../../src/api/memory-startup'
import {
  compactionBodyReady,
  compactionConsumptionReference,
  compactionReaderSource,
  validateCompactionResult,
} from '../../src/lib/memory-compaction'
import { boundSourceRange } from '../../src/lib/memory-source-excerpt'
import { parseMemorySourceIds } from '../../src/lib/memory-source-ids'
import type { MemoryCompactionState } from '../../src/types/memory-compaction'

export interface MemoryCompactionConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  sourceIds: string[]
  prefixCount: number
  operationId: string
  inputBudgetTokens?: number
  outputBudgetTokens?: number
  budgetTokens?: number
  mode?: 'generate' | 'read'
  expectedState?: MemoryCompactionState
  ownedScratchConfirmed: true
  resultFile?: string
  exportReference?: boolean
}
/** One explicit generation at most. Every recovery/list/source request is read-only. */
export async function runMemoryCompactionConsumer(
  config: MemoryCompactionConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.deepEqual(
    parseMemorySourceIds(config.sourceIds.join('\n'), 32),
    config.sourceIds,
  )
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token.replace(/^Bearer\s+/i, ''))
  const api = createMemoryCompactionAPI(config.baseURL, client),
    reader = createMemoryStartupAPI(config.baseURL, client)
  try {
    if (config.mode !== 'read') {
      const generated = await api.create(config.memoryId, {
        operation_id: config.operationId,
        source_ids: config.sourceIds,
        prefix_count: config.prefixCount,
        input_budget_tokens: config.inputBudgetTokens ?? 16384,
        output_budget_tokens: config.outputBudgetTokens ?? 1024,
        budget_tokens: config.budgetTokens ?? 4096,
      })
      validateCompactionResult(generated, config.memoryId, config.operationId)
    }
    const initial = await api.operation(config.memoryId, config.operationId)
    const fresh = await api.operation(config.memoryId, config.operationId)
    validateCompactionResult(initial, config.memoryId, config.operationId)
    validateCompactionResult(fresh, config.memoryId, config.operationId)
    assert.equal(fresh.operation.status, config.expectedState ?? 'generated')
    const artifact = await api.artifact(
      config.memoryId,
      fresh.artifact.artifact_id,
    )
    validateCompactionResult(artifact, config.memoryId, config.operationId)
    assert.equal(artifact.artifact.artifact_id, fresh.artifact.artifact_id)
    assert.deepEqual(
      fresh.artifact.sources.map((s) => s.source_id),
      config.sourceIds,
    )
    const list = await api.list(config.memoryId)
    assert.ok(
      list.items.some((item) => item.operation_id === config.operationId),
    )
    assert.ok(
      list.items.every(
        (item) =>
          item.package === null &&
          item.validity_checked === false &&
          item.valid_for_current === null,
      ),
    )
    if (fresh.operation.status === 'generated') {
      assert.ok(compactionBodyReady(fresh))
      const body = fresh.artifact.package!
      assert.deepEqual(
        body.covered.map((s) => s.source_id),
        config.sourceIds.slice(0, config.prefixCount),
      )
      assert.deepEqual(
        body.retained.map((s) => s.source_id),
        config.sourceIds.slice(config.prefixCount),
      )
      assert.ok(
        fresh.artifact.usage.estimated_after_tokens !== null &&
          fresh.artifact.usage.estimated_after_tokens <=
            fresh.artifact.usage.budget_tokens,
      )
      assert.ok(
        fresh.artifact.usage.estimated_before_tokens !== null &&
          fresh.artifact.usage.estimated_after_tokens <
            fresh.artifact.usage.estimated_before_tokens,
      )
      const source = compactionReaderSource(fresh.artifact.sources[0]!)
      const page = await reader.source(config.memoryId, source, 0, 512)
      boundSourceRange(page, source, config.memoryId, 0, 512)
      if (page.next_offset !== null) {
        const next = await reader.source(
          config.memoryId,
          source,
          page.next_offset,
          512,
        )
        boundSourceRange(next, source, config.memoryId, page.next_offset, 512)
      }
    } else {
      assert.equal(fresh.artifact.package, null)
      assert.equal(fresh.artifact.valid_for_current, false)
    }
    const reference = config.exportReference
      ? compactionConsumptionReference(
          await api.operation(config.memoryId, config.operationId),
          config.memoryId,
          config.operationId,
        )
      : undefined
    return {
      passed: true,
      ...(reference ? { reference } : {}),
      operationId: config.operationId,
      artifactId: fresh.artifact.artifact_id,
      state: fresh.operation.status,
      sourceIds: config.sourceIds,
      operationHref: `/memory/${encodeURIComponent(config.memoryId)}/compaction?${new URLSearchParams({ compaction_operation: config.operationId })}`,
      readOnlyRecovery: true,
      generationRequests: config.mode === 'read' ? 0 : 1,
      applicationRequests: 0,
    }
  } finally {
    client.setAuthToken(null)
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config: MemoryCompactionConsumerConfig = JSON.parse(
    readFileSync(process.argv[2]!, 'utf8'),
  )
  const result = await runMemoryCompactionConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
      mode: 0o600,
    })
  else console.log(JSON.stringify(result))
}

import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import { createMemoryRevisionAPI } from '../../src/api/memory'
import {
  adaptAgentTraceItems,
  buildTraceSpansFromTraceItems,
} from '../../src/pages/agent/adapters/trace'
import { collectTraceSpans } from '../../src/pages/agent/adapters/trace-utils'
import {
  messageMemoryOperationHref,
  parseMessageMemoryOutput,
} from '../../src/pages/agent/adapters/message-memory-operations'

export interface MemoryMessageRecoveryConsumerConfig {
  baseURL: string
  token: string
  output: unknown
  traceItem: unknown
  expected: { memoryId: string; operationId: string }[]
  ownedScratchConfirmed: true
  resultFile?: string
}

/** The caller supplies actual Message outputs from its owned authenticated execution. Never advances a write. */
export async function runMemoryMessageRecoveryConsumer(
  config: MemoryMessageRecoveryConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const spans = collectTraceSpans(
    buildTraceSpansFromTraceItems(adaptAgentTraceItems([config.traceItem])),
  )
  const messages = spans.filter(
    (span) =>
      span.componentType === 'Message' &&
      span.componentId === spans[0]?.componentId &&
      span.output !== undefined,
  )
  assert.equal(
    messages.length,
    1,
    'The actual trace must identify one Message node by canonical type',
  )
  const message = messages[0]!
  assert.deepEqual(message.output, config.output)
  const parsed = parseMessageMemoryOutput(message.output, message.componentType)
  assert.ok(parsed)
  assert.ok(!parsed.invalidMetadata)
  assert.ok(config.expected.length > 0)
  assert.deepEqual(
    parsed.operations.map(({ memoryId, operationId }) => ({
      memoryId,
      operationId,
    })),
    config.expected,
  )
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token.replace(/^Bearer\s+/i, ''))
  const api = createMemoryRevisionAPI(config.baseURL, client)
  const operations = []
  try {
    for (const operation of parsed.operations) {
      const href = messageMemoryOperationHref(operation)
      const url = new URL(href, config.baseURL)
      assert.equal(url.origin, new URL(config.baseURL).origin)
      assert.equal(url.searchParams.get('operation'), operation.operationId)
      // A fresh second GET models opening/refreshing the original handle without replaying a command.
      const first = await api.operation(
        operation.memoryId,
        operation.operationId,
      )
      const fresh = await api.operation(
        operation.memoryId,
        operation.operationId,
      )
      assert.equal(first.operation_id, operation.operationId)
      assert.equal(fresh.operation_id, operation.operationId)
      operations.push({
        memoryId: operation.memoryId,
        operationId: operation.operationId,
        href,
        status: fresh.status,
        indexSyncStatus: fresh.index_sync_status,
      })
    }
    return { passed: true, readOnly: true, operations }
  } finally {
    client.setAuthToken(null)
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config: MemoryMessageRecoveryConsumerConfig = JSON.parse(
    readFileSync(process.argv[2]!, 'utf8'),
  )
  const result = await runMemoryMessageRecoveryConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
      mode: 0o600,
    })
  else console.log(JSON.stringify(result))
}

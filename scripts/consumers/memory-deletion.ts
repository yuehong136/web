import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import { createMemoryRevisionAPI } from '../../src/api/memory'
import { confirmedMemoryDeletion } from '../../src/lib/memory-operation'

export interface MemoryDeletionConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  ownedScratchConfirmed: true
  resultFile?: string
}

/** Delete only an explicitly owned bank; the caller owns its resource journal. */
export async function runMemoryDeletionConsumer(
  config: MemoryDeletionConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemoryRevisionAPI(config.baseURL, client)
  const operationId = `web-delete-${randomUUID()}`
  try {
    const capability = await api.capabilities(config.memoryId)
    assert.equal(capability.revisions?.managed, true)
    assert.equal(capability.revisions.managed_delete_supported, true)
    assert.equal(capability.deletions?.supported, true)
    const accepted = await api.deleteBank(config.memoryId, operationId)
    assert.equal(accepted.operation_id, operationId)
    let status = await api.operation(config.memoryId, operationId)
    const repeatRead = await api.operation(config.memoryId, operationId)
    assert.equal(
      repeatRead.lifecycle,
      status.lifecycle,
      'GET must not advance deletion',
    )
    if (!confirmedMemoryDeletion(status)) {
      assert.equal(status.needs_operator_reconciliation, false)
      status = await api.reconcile(config.memoryId, operationId)
    }
    assert.ok(
      confirmedMemoryDeletion(status),
      'Only a drained scratch bank can finish',
    )
    assert.equal(status.stop_supply, 'stopped')
    assert.equal(status.physical_cleanup_complete, false)
    assert.equal(status.untraceable_copies, true)
    const afterDelete = await api.operation(config.memoryId, operationId)
    assert.ok(
      confirmedMemoryDeletion(afterDelete),
      'ACL receipt remains readable after Memory deletion',
    )
    return {
      passed: true,
      operationId,
      lifecycle: afterDelete.lifecycle,
      trackedCleanupConfirmed: true,
      physicalCleanupComplete: false,
      receiptReadableAfterDelete: true,
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
  ) as MemoryDeletionConsumerConfig
  const result = await runMemoryDeletionConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient, APIError } from '../../src/api/client'
import { createMemoryRevisionAPI } from '../../src/api/memory'
import type { MemoryOperation } from '../../src/types/memory-revisions'

export interface MemoryWritesConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  ownedScratchConfirmed: true
  resultFile?: string
}

const physicalId = (value: unknown): string => {
  assert.equal(typeof value, 'string')
  assert.match(value as string, /^[1-9][0-9]*$/)
  assert.ok(BigInt(value as string) <= 9223372036854775807n)
  return value as string
}
function rawOnlyPublication(operation: MemoryOperation) {
  assert.equal(operation.kind, 'append_raw')
  assert.equal(operation.index_sync_status, 'ready')
  assert.equal(
    operation.queue_state,
    'not_required',
    'Use an owned RAW-only bank',
  )
  assert.equal(operation.extraction_task_id, null)
  const sourceId = physicalId(operation.raw_source_id)
  assert.deepEqual(operation.message_ids, [sourceId])
  for (const source of operation.evicted_sources ?? [])
    physicalId(source.source_id)
  return sourceId
}

/** Append only to the caller's disposable RAW-only bank; the fixture owns cleanup. */
export async function runMemoryWritesConsumer(
  config: MemoryWritesConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemoryRevisionAPI(config.baseURL, client)
  const command = {
    operation_id: `web-append-${randomUUID()}`,
    user_input: 'Controlled Web append input',
    agent_response: 'Controlled Web append response',
    agent_id: 'web-owned-agent',
    session_id: `web-owned-session-${randomUUID()}`,
    user_id: 'web-owned-user',
  }
  try {
    const before = await api.capabilities(config.memoryId)
    assert.equal(before.writes?.supported, true)
    assert.equal(before.writes.append, true)
    const accepted = await api.append(config.memoryId, command)
    assert.equal(accepted.operation_id, command.operation_id)
    const sourceId = rawOnlyPublication(accepted)
    const replay = await api.append(config.memoryId, command)
    assert.equal(replay.operation_id, command.operation_id)
    assert.equal(rawOnlyPublication(replay), sourceId)
    assert.deepEqual(replay.message_ids, accepted.message_ids)
    await assert.rejects(
      api.append(config.memoryId, {
        ...command,
        user_input: 'Different request with the same identity',
      }),
      (error: unknown) => error instanceof APIError && error.status === 409,
    )
    const firstRead = await api.operation(config.memoryId, command.operation_id)
    const secondRead = await api.operation(
      config.memoryId,
      command.operation_id,
    )
    assert.equal(rawOnlyPublication(firstRead), sourceId)
    assert.equal(rawOnlyPublication(secondRead), sourceId)
    assert.equal(firstRead.operation_id, command.operation_id)
    assert.equal(
      secondRead.queue_state,
      firstRead.queue_state,
      'GET does not advance queue state',
    )
    const after = await api.capabilities(config.memoryId)
    assert.equal(
      after.revisions?.managed,
      before.revisions?.managed,
      'Ordinary append does not activate managed mode',
    )
    return {
      passed: true,
      operationId: command.operation_id,
      rawSourceId: sourceId,
      messageIds: accepted.message_ids,
      replayStable: true,
      differentBody409: true,
      decimalStringIds: true,
      readOnlyOperation: true,
      queueState: accepted.queue_state,
      extractionRequired: false,
      managedModeUnchanged: true,
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
  ) as MemoryWritesConsumerConfig
  const result = await runMemoryWritesConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}

import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient, APIError } from '../../src/api/client'
import { createMemorySourcesAPI } from '../../src/api/memory-sources'
import { createMemoryRevisionAPI } from '../../src/api/memory'
import { validateSourceProvenance } from '../../src/lib/memory-source-provenance'
import type { MemorySourceSegment } from '../../src/types/memory-sources'
export interface MemorySourceEntryConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  operationId: string
  userId: string
  agentId: string
  sessionId: string
  segments: MemorySourceSegment[]
  eventTime: string | null
  ownedScratchConfirmed: true
  resultFile?: string
}
export async function runMemorySourceEntryConsumer(
  config: MemorySourceEntryConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemorySourcesAPI(config.baseURL, client),
    revision = createMemoryRevisionAPI(config.baseURL, client)
  const body = {
    operation_id: config.operationId,
    user_id: 'untrusted-request-subject',
    agent_id: config.agentId,
    session_id: config.sessionId,
    segments: config.segments,
    event_time: config.eventTime,
  }
  try {
    const first = await api.create(config.memoryId, body)
    assert.equal(first.operation_id, config.operationId)
    assert.equal(first.kind, 'append_raw')
    assert.equal(first.index_sync_status, 'ready')
    assert.equal(first.queue_state, 'not_required')
    assert.equal(first.extraction_task_id, null)
    const sourceId = first.raw_source_id!
    assert.match(sourceId, /^[1-9][0-9]*$/)
    assert.ok(BigInt(sourceId) <= 9223372036854775807n)
    const replay = await api.create(config.memoryId, body)
    assert.equal(replay.raw_source_id, sourceId)
    await assert.rejects(
      api.create(config.memoryId, {
        ...body,
        segments: body.segments.map((segment, index) =>
          index === 0
            ? { ...segment, role: segment.role === 'user' ? 'tool' : 'user' }
            : segment,
        ),
      }),
      (failure) => failure instanceof APIError && failure.status === 409,
    )
    const operation = await revision.operation(
      config.memoryId,
      config.operationId,
    )
    assert.equal(operation.raw_source_id, sourceId)
    assert.equal(operation.extraction_task_id, null)
    assert.equal(operation.queue_state, 'not_required')
    const metadata = await api.provenance(config.memoryId, sourceId)
    validateSourceProvenance(metadata, config.memoryId, sourceId)
    assert.equal(metadata.format, 'structured')
    assert.deepEqual(metadata.scope, {
      user_id: config.userId,
      agent_id: config.agentId,
      session_id: config.sessionId,
    })
    assert.equal(metadata.segments, null)
    assert.equal(metadata.segment_count, config.segments.length)
    return {
      passed: true,
      operationId: config.operationId,
      sourceId,
      replayStable: true,
      noAutomaticTask:
        operation.extraction_task_id === null &&
        operation.queue_state === 'not_required',
      provenanceSha256: metadata.provenance_sha256,
    }
  } finally {
    client.setAuthToken(null)
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config: MemorySourceEntryConsumerConfig = JSON.parse(
    readFileSync(process.argv[2], 'utf8'),
  )
  const result = await runMemorySourceEntryConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
      flag: 'wx',
      mode: 0o600,
    })
  else console.log(JSON.stringify(result))
}

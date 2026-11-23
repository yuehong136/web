import assert from 'node:assert/strict'
import test from 'node:test'
import { runMemorySourceEntryConsumer } from '../../../scripts/consumers/memory-source-entry'
import { APIError } from '../client'
import { sourceEntryInputRejected } from '../../lib/memory-source-entry'
import { sourceProvenance } from '../../components/memory/__tests__/memory-source-fixture'
const config = {
  baseURL: 'https://fixture.invalid',
  token: 'owned-token',
  memoryId: 'bank',
  operationId: 'source-owned',
  userId: 'actor',
  agentId: ' agent ',
  sessionId: '',
  segments: [{ role: 'user' as const, content: 'Owned source text 🧭' }],
  eventTime: null,
  ownedScratchConfirmed: true as const,
}
test('source producer consumer replays the same preregistered ID, rejects changed body and only reads lean metadata', async (t) => {
  const requests: {
    method: string
    url: URL
    body: Record<string, unknown> | undefined
  }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url)),
        body = init?.body ? JSON.parse(String(init.body)) : undefined,
        method = init?.method ?? 'GET'
      requests.push({ method, url: parsed, body })
      if (
        method === 'POST' &&
        requests.filter((r) => r.method === 'POST').length === 3
      )
        return new Response(
          JSON.stringify({
            retcode: 409,
            retmsg: 'different body',
            data: { error_code: 'operation_body_mismatch' },
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        )
      const metadata = sourceProvenance()
      metadata.scope = {
        user_id: config.userId,
        agent_id: config.agentId,
        session_id: config.sessionId,
      }
      metadata.segment_count = 1
      const operation = {
        operation_id: config.operationId,
        kind: 'append_raw',
        status: 'ready',
        index_sync_status: 'ready',
        retryable: false,
        raw_source_id: '9007199254740993',
        message_ids: ['9007199254740993'],
        extraction_task_id: null,
        queue_state: 'not_required',
        evicted_sources: [],
      }
      return new Response(
        JSON.stringify({
          retcode: 0,
          data: parsed.pathname.endsWith('/provenance') ? metadata : operation,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    },
  )
  const result = await runMemorySourceEntryConsumer(config)
  assert.equal(result.sourceId, '9007199254740993')
  assert.equal(result.operationId, config.operationId)
  assert.equal(result.noAutomaticTask, true)
  assert.equal(requests.length, 5)
  assert.deepEqual(
    requests.slice(0, 2).map((r) => r.body?.operation_id),
    [config.operationId, config.operationId],
  )
  assert.deepEqual(requests[0].body, requests[1].body)
  assert.equal(requests[0].body?.user_id, 'untrusted-request-subject')
  assert.equal(requests[4].url.searchParams.get('include_segments'), 'false')
  assert.ok(!JSON.stringify(result).includes(config.segments[0].content))
})
test('only proven pre-handler422 failures allow correcting text with a new operation', () => {
  for (const code of [
    'append_content_tokens_exceeded',
    'structured_source_bytes_exceeded',
  ])
    assert.equal(
      sourceEntryInputRejected(
        new APIError(422, '422', 'private', { error_code: code }),
      ),
      true,
    )
  assert.equal(
    sourceEntryInputRejected(
      new APIError(422, 'HTTP_ERROR', 'private', {
        detail: [
          { loc: ['body', 'event_time'], type: 'value_error', msg: 'private' },
        ],
      }),
    ),
    true,
  )
  for (const error of [
    new APIError(422, '422', 'private', { error_code: 'unknown' }),
    new APIError(422, 'HTTP_ERROR', 'private', { detail: [] }),
    new APIError(422, 'HTTP_ERROR', 'private', {
      detail: [{ loc: ['query'], type: 'value_error' }],
    }),
    new APIError(503, '503', 'private'),
    new Error('private'),
  ])
    assert.equal(sourceEntryInputRejected(error), false)
})

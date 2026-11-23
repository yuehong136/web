import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError } from '../client'
import { createMemoryVerificationAPI } from '../memory'
import {
  verificationRecord,
  verificationSnapshot,
} from '../../components/memory/__tests__/memory-verification-fixture'

test('verification transports exact frozen binding and head strings with read-only history, queue and operation recovery', async (t) => {
  const client = new APIClient('https://fixture.invalid'),
    api = createMemoryVerificationAPI('https://fixture.invalid', client),
    calls: { url: string; method: string; body: unknown }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        url: String(url),
        method: init?.method ?? 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : null,
      })
      return new Response(
        JSON.stringify({
          retcode: 0,
          data:
            calls.length === 1
              ? verificationSnapshot()
              : { status: 'ready', record: verificationRecord() },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    },
  )
  const snapshot = await api.snapshot('bank/a', 'entry/a')
  assert.equal(snapshot.binding.sources[0].source_id, '9007199254740993')
  assert.equal(snapshot.head_version, '0')
  const command = {
    operation_id: 'original',
    expected_head_version: '0',
    expected_binding_sha256: snapshot.binding_sha256,
    result: 'human_confirmed' as const,
    method: 'source_comparison' as const,
    applicability: 'Exact scope',
    notes: 'Human statement, not an automatic guarantee',
    evidence: [
      {
        description: 'Inspection',
        reference: 'javascript:untrustedReference()',
      },
    ],
    checked_at: '2026-11-16T07:00:00+08:00',
  }
  await api.record('bank/a', 'entry/a', command)
  await api.history('bank/a', 'entry/a', 'cursor/+?=')
  await api.todos('bank/a', 'todo/+?=')
  await api.operation('bank/a', 'original/+?=')
  await api.revoke('bank/a', 'record/a', {
    operation_id: 'revoke',
    expected_head_version: '9007199254740993',
    reason: 'Scoped withdrawal of assessment',
  })
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'POST', 'GET', 'GET', 'GET', 'POST'],
  )
  assert.deepEqual(calls[1].body, command)
  assert.equal(new URL(calls[2].url).searchParams.get('cursor'), 'cursor/+?=')
  assert.equal(new URL(calls[3].url).searchParams.get('cursor'), 'todo/+?=')
  assert.ok(
    calls[4].url.endsWith('/verification-operations/original%2F%2B%3F%3D'),
  )
  assert.ok(
    calls.every((call) =>
      call.url.startsWith('https://fixture.invalid/api/v1/memories/bank%2Fa/'),
    ),
  )
  assert.equal(
    (calls[5].body as { expected_head_version: string }).expected_head_version,
    '9007199254740993',
  )
})
test('uncertain recording is not automatically retried or converted into a positive verification', async (t) => {
  let count = 0
  const api = createMemoryVerificationAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  t.mock.method(globalThis, 'fetch', async () => {
    count++
    return new Response(
      JSON.stringify({
        retcode: 503,
        retmsg: 'private detail',
        data: { operation_id: 'original' },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  })
  await assert.rejects(
    api.record('bank', 'entry', {
      operation_id: 'original',
      expected_head_version: '0',
      expected_binding_sha256: 'a'.repeat(64),
      result: 'needs_review',
      method: 'other',
      applicability: 'scope',
      notes: '',
      evidence: [],
    }),
    (error: unknown) => error instanceof APIError && error.status === 503,
  )
  assert.equal(count, 1)
})

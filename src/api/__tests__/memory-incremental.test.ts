import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError } from '../client'
import { createMemoryIncrementalAPI } from '../memory'

const selection = {
  scope: { user_id: '', agent_id: ' agent ', session_id: null },
  policy: 'general' as const,
  entry_ids: [],
  batch_size: 2,
  max_sources: 4,
  input_budget_tokens: 16384,
  output_budget_tokens: 2048,
}

test('incremental routes keep exact nullable scope and separate pure preview, plan, reads and commands', async (t) => {
  const api = createMemoryIncrementalAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  const calls: { url: string; method: string; body: unknown }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        url: String(url),
        method: init?.method ?? 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : null,
      })
      return new Response(JSON.stringify({ retcode: 0, data: {} }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )
  await api.preview('bank/a', selection)
  await api.create('bank/a', {
    ...selection,
    operation_id: 'create',
    expected_preview_sha256: 'a'.repeat(64),
  })
  await api.list('bank/a', 'original/+?=')
  await api.discovery('bank/a', 'plan/a')
  await api.run('bank/a', 'plan/a', { operation_id: 'run', limit: 1 })
  await api.cancel('bank/a', 'plan/a', 'cancel')
  assert.deepEqual(
    calls.map((call) => call.method),
    ['POST', 'POST', 'GET', 'GET', 'POST', 'POST'],
  )
  assert.deepEqual(calls[0].body, selection)
  assert.ok(
    calls.every((call) =>
      call.url.startsWith(
        'https://fixture.invalid/api/v1/memories/bank%2Fa/maintenance-discoveries',
      ),
    ),
  )
  const list = new URL(calls[2].url)
  assert.equal(list.searchParams.get('operation_id'), 'original/+?=')
  assert.equal(list.searchParams.get('limit'), '20')
  assert.ok(calls[3].url.endsWith('/plan%2Fa'))
  assert.deepEqual(calls[4].body, { operation_id: 'run', limit: 1 })
  assert.deepEqual(calls[5].body, { operation_id: 'cancel' })
})

test('large source identities and versions remain strings and an unknown submission is not retried', async (t) => {
  const api = createMemoryIncrementalAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  let calls = 0
  const source = {
    source_id: '9007199254740993',
    source_revision: '9007199254740995',
    source_generation: '9007199254740997',
    content_sha256: 'a'.repeat(64),
  }
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(
      JSON.stringify(
        calls === 1
          ? { retcode: 0, data: { batches: [{ primary_sources: [source] }] } }
          : { retcode: 500, data: { operation_id: 'original' } },
      ),
      {
        status: calls === 1 ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  })
  assert.deepEqual(
    (await api.preview('bank', selection)).batches[0].primary_sources[0],
    source,
  )
  await assert.rejects(
    api.run('bank', 'plan', { operation_id: 'original', limit: 2 }),
    (error: unknown) => error instanceof APIError && error.status === 503,
  )
  assert.equal(calls, 2)
})

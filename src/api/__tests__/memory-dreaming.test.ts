import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError } from '../client'
import { createMemoryDreamingAPI } from '../memory'

test('maintenance routes preserve exact physical IDs and distinguish reads from commands', async (t) => {
  const api = createMemoryDreamingAPI(
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
  const command = {
    operation_id: 'create',
    source_ids: ['9007199254740993'],
    entry_ids: ['entry/a'],
    policy: 'decisions' as const,
    input_budget_tokens: 16384,
    output_budget_tokens: 4096,
  }
  await api.create('bank/a', command)
  await api.list('bank/a')
  await api.job('bank/a', 'job/a')
  await api.candidates('bank/a', 'job/a')
  await api.run('bank/a', 'job/a', 'run')
  await api.review('bank/a', 'job/a', 'candidate/a', {
    operation_id: 'review',
    expected_revision: 2,
    decision: 'approve',
  })
  await api.publish('bank/a', 'job/a', {
    operation_id: 'publish',
    candidates: [{ candidate_id: 'candidate/a', expected_revision: 3 }],
  })
  await api.cancel('bank/a', 'job/a', 'cancel')
  assert.ok(
    calls.every((call) =>
      call.url.startsWith(
        'https://fixture.invalid/api/v1/memories/bank%2Fa/maintenance-jobs',
      ),
    ),
  )
  assert.deepEqual(calls[0].body, command)
  assert.deepEqual(
    calls.slice(1, 4).map((call) => call.method),
    ['GET', 'GET', 'GET'],
  )
  assert.ok(calls[5].url.endsWith('/job%2Fa/candidates/candidate%2Fa/reviews'))
  assert.deepEqual(calls[6].body, {
    operation_id: 'publish',
    candidates: [{ candidate_id: 'candidate/a', expected_revision: 3 }],
  })
  assert.deepEqual(calls[7].body, { operation_id: 'cancel' })
})

test('accepted maintenance is not completed and a command uncertainty is not automatically resent', async (t) => {
  const api = createMemoryDreamingAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(
      JSON.stringify(
        calls === 1
          ? {
              retcode: 0,
              data: { state: 'running', analysis_operation_id: 'original' },
            }
          : { retcode: 500, data: { operation_id: 'original' } },
      ),
      {
        status: calls === 1 ? 202 : 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  })
  assert.equal((await api.run('bank', 'job', 'original')).state, 'running')
  await assert.rejects(
    api.run('bank', 'job', 'original'),
    (error: unknown) => error instanceof APIError && error.status === 503,
  )
  assert.equal(calls, 2)
})

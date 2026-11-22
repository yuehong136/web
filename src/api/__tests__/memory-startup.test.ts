import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError } from '../client'
import { createMemoryStartupAPI } from '../memory-startup'
import {
  startupPackage,
  sourceExcerpt,
} from '../../components/memory/__tests__/memory-startup-fixture'
test('startup preview and Unicode continuation preserve exact empty scope, decimal IDs and no-store reads', async (t) => {
  const calls: { url: string; init?: RequestInit }[] = [],
    api = createMemoryStartupAPI(
      'https://fixture.invalid',
      new APIClient('https://fixture.invalid'),
    )
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          retcode: 0,
          data: calls.length === 1 ? startupPackage() : sourceExcerpt(512),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    },
  )
  const body = {
    user_id: ' alpha ',
    agent_id: '',
    session_id: null,
    entry_ids: ['e'.repeat(32)],
    budget_tokens: 4096,
    max_items: 8,
    inventory_limit: 64,
  }
  await api.preview('bank/a', body)
  await api.source('bank/a', startupPackage().items[0].sources[0], 512, 512)
  assert.equal(calls[0].init?.method, 'POST')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), body)
  assert.equal(calls[1].init?.method, 'GET')
  const url = new URL(calls[1].url)
  assert.ok(
    url.pathname.endsWith('/memories/bank%2Fa/sources/9007199254741001'),
  )
  assert.equal(
    url.searchParams.get('expected_source_revision'),
    '9007199254741003',
  )
  assert.equal(url.searchParams.get('expected_source_generation'), '1')
  assert.equal(url.searchParams.get('user_id'), ' alpha ')
  assert.equal(url.searchParams.get('agent_id'), '')
  assert.equal(url.searchParams.get('session_id'), '')
  assert.equal(url.searchParams.get('offset'), '512')
  assert.ok(calls.every((call) => call.init?.cache === 'no-store'))
})
test('bound source409 propagates once without legacy or unbound retry', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(
      JSON.stringify({ retcode: 409, retmsg: 'source changed' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    )
  })
  const api = createMemoryStartupAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  await assert.rejects(
    api.source('bank', startupPackage().items[0].sources[0], 0),
    (error) => error instanceof APIError && error.status === 409,
  )
  assert.equal(calls, 1)
})

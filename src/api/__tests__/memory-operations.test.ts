import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient } from '../client'
import { createMemoryRevisionAPI } from '../memory'

test('operation discovery is a scoped GET with an opaque cursor and no implicit command', async (t) => {
  const api = createMemoryRevisionAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  const calls: { url: URL; method: string }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: new URL(String(url)), method: init?.method ?? 'GET' })
      return new Response(
        JSON.stringify({
          retcode: 0,
          data: {
            operations: [],
            next_cursor: null,
            limit: 20,
            view: 'all',
            memory_state: 'deleted',
          },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    },
  )
  const result = await api.operations('bank/a', {
    view: 'all',
    limit: 20,
    cursor: 'opaque/+?=',
  })
  assert.equal(result.memory_state, 'deleted')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'GET')
  assert.equal(calls[0].url.pathname, '/api/v1/memories/bank%2Fa/operations')
  assert.equal(calls[0].url.searchParams.get('cursor'), 'opaque/+?=')
  assert.equal(calls[0].url.searchParams.get('view'), 'all')
  assert.equal(calls[0].url.searchParams.get('limit'), '20')
})

test('queued background operation remains pending metadata on repeated reads', async (t) => {
  const api = createMemoryRevisionAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  const methods: string[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (_url: string | URL | Request, init?: RequestInit) => {
      methods.push(init?.method ?? 'GET')
      return new Response(
        JSON.stringify({
          retcode: 0,
          data: {
            operation_id: 'original',
            kind: 'dream_analyze',
            status: 'accepted',
            index_sync_status: 'pending',
            can_reconcile: false,
            execution: { state: 'queued' },
          },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    },
  )
  assert.equal(
    (await api.operation('bank', 'original')).execution?.state,
    'queued',
  )
  assert.equal((await api.operation('bank', 'original')).can_reconcile, false)
  assert.deepEqual(methods, ['GET', 'GET'])
})

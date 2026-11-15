import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError } from '../client'
import { createMemoryRevisionAPI } from '../memory'

const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ retcode: 0, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

test('managed memory routes encode resource keys and preserve large decimal physical IDs', async (t) => {
  const client = new APIClient('https://fixture.invalid')
  const api = createMemoryRevisionAPI('https://fixture.invalid', client)
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
      return response({ fixture: true })
    },
  )
  const bank = 'memory/a',
    entry = 'entry:b',
    source = '9007199254740993'
  await api.capabilities(bank)
  await api.findEntry(bank, source)
  await api.adoptEntry(bank, 'adopt', source)
  await api.getEntry(bank, entry)
  await api.history(bank, entry, 'cursor/+?')
  await api.revise(bank, entry, {
    operation_id: 'edit',
    expected_revision: 3,
    patch: { old_text: 'old', new_text: 'new' },
    reason: 'Controlled correction',
    dry_run: true,
  })
  await api.operation(bank, 'operation/x')
  await api.reconcile(bank, 'operation/x')
  await api.source(bank, source)
  await api.adoptSource(bank, source, 'register', 'a'.repeat(64))
  await api.withdraw(bank, source, 'withdraw', 2, 'Access revoked')
  await api.deleteBank(bank, 'delete-bank')
  assert.ok(
    calls.every((call) =>
      call.url.startsWith(
        'https://fixture.invalid/api/v1/memories/memory%2Fa/',
      ),
    ),
  )
  assert.deepEqual(calls[2].body, {
    operation_id: 'adopt',
    legacy_message_id: source,
  })
  assert.ok(calls[4].url.includes('cursor=cursor%2F%2B%3F'))
  assert.deepEqual(calls[5].body, {
    operation_id: 'edit',
    expected_revision: 3,
    patch: { old_text: 'old', new_text: 'new' },
    reason: 'Controlled correction',
    dry_run: true,
  })
  assert.ok(calls[6].url.endsWith('/operations/operation%2Fx'))
  assert.equal(calls[6].method, 'GET')
  assert.equal(calls[7].method, 'POST')
  assert.deepEqual(calls[10].body, {
    operation_id: 'withdraw',
    expected_source_revision: 2,
    reason: 'Access revoked',
  })
  assert.ok(calls[11].url.endsWith('/deletions'))
  assert.equal(calls[11].method, 'POST')
  assert.deepEqual(calls[11].body, { operation_id: 'delete-bank' })
})

test('accepted publication stays pending and a 503 commit uncertainty is never automatically resent', async (t) => {
  const client = new APIClient('https://fixture.invalid')
  const api = createMemoryRevisionAPI('https://fixture.invalid', client)
  let requests = 0
  t.mock.method(globalThis, 'fetch', async () => {
    requests++
    if (requests === 1)
      return response(
        {
          operation_id: 'original',
          status: 'accepted',
          index_sync_status: 'pending',
        },
        202,
      )
    return new Response(
      JSON.stringify({
        retcode: 500,
        retmsg: 'Unconfirmed',
        data: { operation_id: 'original', requires_reconciliation: true },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  })
  const accepted = await api.revise('bank', 'entry', {
    operation_id: 'original',
    expected_revision: 1,
    content: 'new',
    reason: 'correct',
    dry_run: false,
  })
  assert.ok('index_sync_status' in accepted)
  assert.equal(accepted.index_sync_status, 'pending')
  await assert.rejects(
    api.reconcile('bank', 'original'),
    (error: unknown) =>
      error instanceof APIError &&
      error.status === 503 &&
      error.details.operation_id === 'original',
  )
  assert.equal(requests, 2)
})

test('history and state lookups propagate cancellation through shared transport', async (t) => {
  const client = new APIClient('https://fixture.invalid')
  const api = createMemoryRevisionAPI('https://fixture.invalid', client)
  const controller = new AbortController()
  let signal: AbortSignal | undefined
  t.mock.method(
    globalThis,
    'fetch',
    async (_url: unknown, init?: RequestInit) => {
      signal = init?.signal ?? undefined
      controller.abort()
      throw new DOMException('Aborted', 'AbortError')
    },
  )
  await assert.rejects(
    api.source('bank', '123', controller.signal),
    (error: unknown) =>
      error instanceof DOMException && error.name === 'AbortError',
  )
  assert.equal(signal?.aborted, true)
})

test('ordinary append preserves the exact command and decimal IDs while an indexed unknown queue stays unknown', async (t) => {
  const client = new APIClient('https://fixture.invalid')
  const api = createMemoryRevisionAPI('https://fixture.invalid', client)
  const calls: { url: string; body: unknown }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) })
      return response(
        {
          operation_id: 'stable',
          kind: 'append_raw',
          status: 'published',
          index_sync_status: 'ready',
          retryable: true,
          raw_source_id: '9007199254740993',
          message_ids: ['9007199254740993'],
          extraction_task_id: 'stable-task',
          queue_state: 'unknown',
          evicted_sources: [
            {
              source_id: '9223372036854775807',
              operation_id: 'eviction',
              state: 'forgotten',
            },
          ],
        },
        202,
      )
    },
  )
  const command = {
    operation_id: 'stable',
    user_input: 'Controlled input',
    agent_response: 'Controlled response',
    agent_id: 'agent',
    session_id: 'session',
    user_id: '  external user  ',
  }
  const result = await api.append('bank/a', command)
  assert.equal(calls.length, 1)
  assert.equal(
    calls[0].url,
    'https://fixture.invalid/api/v1/memories/bank%2Fa/messages',
  )
  assert.deepEqual(calls[0].body, command)
  assert.equal(result.raw_source_id, '9007199254740993')
  assert.deepEqual(result.message_ids, ['9007199254740993'])
  assert.equal(result.evicted_sources[0].source_id, '9223372036854775807')
  assert.equal(result.queue_state, 'unknown')
  assert.equal(result.index_sync_status, 'ready')
})

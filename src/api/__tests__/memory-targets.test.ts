import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError } from '../client'
import { createMemoryDreamingAPI, createMemoryIncrementalAPI } from '../memory'
import {
  selectedMemoryTargets,
  targetSourceIds,
} from '../../lib/memory-targets'
import {
  targetResult,
  targetEntryId,
  targetInputId,
  targetDependencyId,
} from '../../components/memory/__tests__/memory-target-fixture'

test('recommendations retain exact identities and immutable selected conditions through manual and batch commands', async (t) => {
  const client = new APIClient('https://fixture.invalid'),
    api = createMemoryDreamingAPI('https://fixture.invalid', client),
    batches = createMemoryIncrementalAPI('https://fixture.invalid', client),
    calls: { url: string; method: string; body: unknown }[] = []
  const result = targetResult(),
    selected = selectedMemoryTargets(result, [targetEntryId])
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        url: String(url),
        method: init?.method ?? 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : null,
      })
      return new Response(JSON.stringify({ retcode: 0, data: result }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )
  const request = {
    source_ids: [targetInputId],
    user_id: ' alpha ',
    agent_id: '',
    query: null,
    retrieval_mode: 'lexical' as const,
    limit: 5,
    budget_tokens: 4096,
    query_budget_tokens: 2048,
  }
  assert.deepEqual(await api.recommendTargets('bank/a', request), result)
  assert.equal(
    calls[0].url,
    'https://fixture.invalid/api/v1/memories/bank%2Fa/maintenance-targets/recommendations',
  )
  assert.deepEqual(calls[0].body, request)
  const common = {
    policy: 'general' as const,
    entry_ids: [targetEntryId],
    input_budget_tokens: 16384,
    output_budget_tokens: 4096,
    target_preconditions: selected,
  }
  await api.create('bank/a', {
    ...common,
    source_ids: targetSourceIds(selected),
    operation_id: 'manual',
  })
  const selection = {
    ...common,
    scope: { user_id: ' alpha ', agent_id: '', session_id: null },
    batch_size: 32,
    max_sources: 128,
  }
  await batches.preview('bank/a', selection)
  await batches.create('bank/a', {
    ...selection,
    operation_id: 'batch',
    expected_preview_sha256: 'a'.repeat(64),
  })
  for (const call of calls.slice(1)) {
    const body = call.body as typeof common
    assert.deepEqual(body.target_preconditions, selected)
    assert.deepEqual(body.entry_ids, [targetEntryId])
    assert.equal(body.target_preconditions.targets[0].revision, '2')
    assert.equal('content' in body.target_preconditions.targets[0], false)
  }
  assert.deepEqual(targetSourceIds(selected), [
    targetInputId,
    targetDependencyId,
  ])
  assert.equal(result.confirmation.targets.length, 2)
  selected.targets[0].revision = '999'
  assert.equal(result.confirmation.targets[0].revision, '2')
  for (const ids of [[], [targetEntryId, targetEntryId], ['hidden-entry']])
    assert.throws(() => selectedMemoryTargets(result, ids))
})
test('unknown recommendations are not automatically repeated and never mutate memory through fallback', async (t) => {
  const api = createMemoryDreamingAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  let count = 0
  t.mock.method(globalThis, 'fetch', async () => {
    count++
    return new Response(JSON.stringify({ retcode: 503, retmsg: 'private' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  await assert.rejects(
    api.recommendTargets('bank', {
      source_ids: [targetInputId],
      user_id: '',
      agent_id: '',
      query: null,
      retrieval_mode: 'hybrid',
      limit: 1,
      budget_tokens: 1024,
      query_budget_tokens: 256,
    }),
    (error: unknown) => error instanceof APIError && error.status === 503,
  )
  assert.equal(count, 1)
})

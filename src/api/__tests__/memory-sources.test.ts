import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError } from '../client'
import { createMemorySourcesAPI } from '../memory-sources'
test('structured source commands and lean provenance retain exact IDs, empty scope, no-store and explicit full-segment opt-in', async (t) => {
  const calls: { url: string; init?: RequestInit }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response(JSON.stringify({ retcode: 0, data: {} }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )
  const api = createMemorySourcesAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  const command = {
    operation_id: 'owned-source',
    user_id: ' exact ',
    agent_id: '',
    session_id: '',
    segments: [
      { role: 'tool' as const, content: '<script>not a proof</script>' },
    ],
    event_time: '2026-11-16T08:00:00+08:00',
  }
  await api.create('bank/a', command)
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), command)
  assert.equal(
    calls[0].url,
    'https://fixture.invalid/api/v1/memories/bank%2Fa/sources',
  )
  const binding = {
    source_id: '9007199254740993',
    source_revision: '9223372036854775806',
    source_generation: '9223372036854775807',
    content_sha256: 'a'.repeat(64),
    provenance_sha256: 'b'.repeat(64),
    scope: { user_id: ' exact ', agent_id: '', session_id: '' },
  }
  await api.provenance('bank/a', binding.source_id, { binding })
  const url = new URL(calls[1].url)
  assert.equal(url.searchParams.get('include_segments'), 'false')
  assert.equal(
    url.searchParams.get('expected_source_revision'),
    binding.source_revision,
  )
  assert.equal(
    url.searchParams.get('expected_source_generation'),
    binding.source_generation,
  )
  assert.equal(
    url.searchParams.get('expected_provenance_sha256'),
    binding.provenance_sha256,
  )
  assert.equal(url.searchParams.get('user_id'), ' exact ')
  assert.equal(url.searchParams.get('agent_id'), '')
  assert.equal(url.searchParams.get('session_id'), '')
  assert.equal(calls[1].init?.cache, 'no-store')
  await api.provenance('bank/a', binding.source_id, {
    binding,
    includeSegments: true,
  })
  assert.equal(
    new URL(calls[2].url).searchParams.get('include_segments'),
    'true',
  )
})
test('a provenance conflict is surfaced without retrying or requesting full segments', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(
      JSON.stringify({
        retcode: 409,
        data: { error_code: 'source_provenance_changed' },
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    )
  })
  const api = createMemorySourcesAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  await assert.rejects(
    api.provenance('bank', '9007199254740993'),
    (e) => e instanceof APIError && e.status === 409,
  )
  assert.equal(calls, 1)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { runMemoryStructuredSourceConsumer } from '../../../scripts/consumers/memory-structured-sources'
import {
  sourceBinding,
  sourceProvenance,
} from '../../components/memory/__tests__/memory-source-fixture'
const config = {
  baseURL: 'https://fixture.invalid',
  token: 'owned-token',
  memoryId: 'bank',
  sourceId: sourceBinding.source_id,
  expected: {
    segments: [
      { role: 'user' as const, content: 'Only this declared preference.' },
      { role: 'assistant' as const, content: 'I claim this was verified.' },
      {
        role: 'tool' as const,
        content: '<script>not actual tool proof</script>',
      },
    ],
    eventTime: '2026-11-12T08:00:00+08:00',
    submittedBy: 'authenticated-only',
    scope: sourceBinding.scope,
  },
  ownedScratchConfirmed: true as const,
}
test('the source consumer makes only explicit lean/full/lean GETs and reports no fact verification', async (t) => {
  const requests: { url: URL; method: string }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url))
      requests.push({ url: parsed, method: init?.method ?? 'GET' })
      const value = sourceProvenance()
      if (parsed.searchParams.get('include_segments') === 'true') {
        value.segments_included = true
        value.segments = config.expected.segments
      }
      return new Response(JSON.stringify({ retcode: 0, data: value }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )
  const result = await runMemoryStructuredSourceConsumer(config)
  assert.equal(requests.length, 3)
  assert.ok(
    requests.every(
      (request) =>
        request.method === 'GET' &&
        request.url.pathname.endsWith('/provenance'),
    ),
  )
  assert.deepEqual(
    requests.map((r) => r.url.searchParams.get('include_segments')),
    ['false', 'true', 'false'],
  )
  assert.equal(requests[1].url.searchParams.get('agent_id'), '')
  assert.equal(
    requests[1].url.searchParams.get('expected_provenance_sha256'),
    'b'.repeat(64),
  )
  assert.equal(result.passed, true)
  assert.equal(result.sourceId, '9007199254740993')
  assert.equal(result.authenticatedSubmitter, true)
  assert.equal(result.speakerIdentityVerified, false)
  assert.equal(result.contentVerified, false)
  assert.equal(result.defaultHasSegmentBody, false)
})
test('the consumer rejects a role/body signature mismatch instead of declaring success', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        JSON.stringify({
          retcode: 0,
          data: { ...sourceProvenance(), declared_roles: ['user'] },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
  )
  await assert.rejects(runMemoryStructuredSourceConsumer(config))
})

import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { createHash } from 'node:crypto'
import { APIError } from '../client'
import {
  runMemoryStartupConsumer,
  type MemoryStartupConsumerConfig,
} from '../../../scripts/consumers/memory-startup'
import { startupPackage } from '../../components/memory/__tests__/memory-startup-fixture'
import type {
  MemoryStartupPackage,
  MemoryStartupOmission,
} from '../../types/memory-startup'
const digest = (text: string) => createHash('sha256').update(text).digest('hex')
const base: MemoryStartupConsumerConfig = {
  baseURL: 'https://fixture.invalid',
  token: 'controlled-token',
  memoryId: 'bank',
  userId: ' alpha ',
  agentId: '',
  entryId: 'e'.repeat(32),
  ownedScratchConfirmed: true,
}
function phase(reason?: MemoryStartupOmission) {
  const value = startupPackage(),
    item = value.items[0]
  item.content_sha256 = digest(item.content)
  item.sources[0].content_sha256 = digest('原文🧭含完整适用条件。'.repeat(3))
  value.omitted = { counts: {}, entries: [], details_truncated: false }
  if (reason) {
    value.items = []
    value.startup_text = ''
    value.omitted = {
      counts: { [reason]: 1 },
      entries: [{ entry_id: base.entryId, reason }],
      details_truncated: false,
    }
  }
  return value
}
function install(t: TestContext, value: MemoryStartupPackage) {
  const calls: {
    url: URL
    method: string
    body: unknown
    cache: RequestCache | undefined
  }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      const target = new URL(String(url)),
        path = target.pathname
      calls.push({
        url: target,
        method: init?.method ?? 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : null,
        cache: init?.cache,
      })
      let data: unknown
      if (path.endsWith('/capabilities'))
        data = { startup_context: { supported: true } }
      else if (path.endsWith('/startup-context')) data = structuredClone(value)
      else if (path.includes('/sources/')) {
        const source = value.items[0].sources[0],
          offset = Number(target.searchParams.get('offset')),
          limit = Number(target.searchParams.get('limit')),
          text = [...'原文🧭含完整适用条件。'.repeat(3)],
          excerpt = text.slice(offset, offset + limit).join(''),
          end = offset + [...excerpt].length
        data = {
          state: 'available',
          verification: 'provenance_only',
          snapshot_only: true,
          locator: source.locator,
          content_sha256: source.content_sha256,
          source_revision: source.source_revision,
          source_generation: source.source_generation,
          scope: source.scope,
          offset_unit: 'unicode_codepoint',
          excerpt,
          offset,
          total_chars: text.length,
          truncated: end < text.length,
          next_offset: end < text.length ? end : null,
          continuation_requires_authorization: true,
        }
      } else throw new Error('Consumer must not use a write endpoint')
      return new Response(JSON.stringify({ retcode: 0, data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )
  return calls
}
test('default consumer keeps the one-entry two-fragment read-only contract', async (t) => {
  const calls = install(t, phase()),
    result = await runMemoryStartupConsumer(base)
  assert.equal(result.passed, true)
  assert.equal(result.items, 1)
  assert.equal(result.sourceFragments, 2)
  assert.equal(result.phaseLabel, null)
  assert.equal(result.readOnly, true)
  assert.deepEqual(result.assessmentPreserved, {
    kind: 'hypothesis',
    verification_status: 'unverified',
  })
  assert.equal(result.included[0].revision, '9007199254740993')
  assert.equal(result.included[0].sources[0].sourceId, '9007199254741001')
  assert.equal(result.usage.includes, 'entire_json_with_startup_text')
  assert.deepEqual(
    calls.map((c) => c.method),
    ['GET', 'POST', 'GET', 'GET', 'POST'],
  )
  assert.ok(
    calls
      .filter((c) => c.method === 'POST')
      .every((c) => c.url.pathname.endsWith('/startup-context')),
  )
  assert.ok(
    calls
      .filter((c) => !c.url.pathname.endsWith('/capabilities'))
      .every((c) => c.cache === 'no-store'),
  )
  const reads = calls.filter((c) => c.url.pathname.includes('/sources/'))
  assert.equal(reads[0].url.searchParams.get('agent_id'), '')
  assert.equal(reads[0].url.searchParams.get('session_id'), '')
  assert.equal(reads[1].url.searchParams.get('offset'), '8')
})
for (const reason of [
  'unverified',
  'disputed',
  'verification_stale',
  'source_unavailable',
] as const)
  test(`explicit ${reason} phase observes an empty package without reading a missing source`, async (t) => {
    const calls = install(t, phase(reason)),
      result = await runMemoryStartupConsumer({
        ...base,
        phaseLabel: `phase-${reason}`,
        expectedIncluded: [],
        expectedOmitted: [{ entryId: base.entryId, reason }],
      })
    assert.equal(result.items, 0)
    assert.equal(result.sourceFragments, 0)
    assert.equal(result.firstRange, null)
    assert.equal(result.assessmentPreserved, null)
    assert.deepEqual(result.included, [])
    assert.equal(result.startupTextSha256, digest(''))
    assert.equal(result.omitted.counts[reason], 1)
    assert.equal(result.phaseLabel, `phase-${reason}`)
    assert.deepEqual(
      calls.map((c) => c.method),
      ['GET', 'POST', 'POST'],
    )
  })
test('multiple selected entries and omitted sibling retain explicit bounded phase expectations', async (t) => {
  const value = phase(),
    sibling = structuredClone(value.items[0]),
    omittedId = 'd'.repeat(32)
  sibling.entry_id = 'f'.repeat(32)
  value.items.push(sibling)
  value.omitted = {
    counts: { disputed: 1 },
    entries: [{ entry_id: omittedId, reason: 'disputed' }],
    details_truncated: false,
  }
  const calls = install(t, value)
  const result = await runMemoryStartupConsumer({
    ...base,
    phaseLabel: 'two-current-one-disputed',
    entryIds: [base.entryId, sibling.entry_id, omittedId],
    expectedIncluded: [sibling.entry_id, base.entryId],
    expectedOmitted: [{ entryId: omittedId, reason: 'disputed' }],
    budgetTokens: 24576,
    maxItems: 16,
    inventoryLimit: 128,
  })
  assert.equal(result.items, 2)
  assert.deepEqual(
    result.included.map((row) => row.entryId),
    [base.entryId, sibling.entry_id],
  )
  const body = calls.find((c) => c.method === 'POST')!.body as {
    entry_ids: string[]
    budget_tokens: number
    max_items: number
    inventory_limit: number
  }
  assert.deepEqual(body.entry_ids, [base.entryId, sibling.entry_id, omittedId])
  assert.equal(body.budget_tokens, 24576)
  assert.equal(body.max_items, 16)
  assert.equal(body.inventory_limit, 128)
})
test('an inventory phase preserves null selection rather than coercing to the primary entry', async (t) => {
  const calls = install(t, phase()),
    result = await runMemoryStartupConsumer({ ...base, entryIds: null })
  assert.equal(result.items, 1)
  assert.equal(
    (calls.find((c) => c.method === 'POST')!.body as { entry_ids: null })
      .entry_ids,
    null,
  )
})
test('absent or truncated omission details cannot be counted as expected exclusion proof', async (t) => {
  const value = phase('disputed')
  value.omitted.entries = []
  value.omitted.details_truncated = true
  install(t, value)
  await assert.rejects(
    runMemoryStartupConsumer({
      ...base,
      expectedIncluded: [],
      expectedOmitted: [{ entryId: base.entryId, reason: 'disputed' }],
    }),
    /An omission needs its explicit reason detail/,
  )
})
test('an unexpected included entry fails a declared empty phase', async (t) => {
  install(t, phase())
  await assert.rejects(
    runMemoryStartupConsumer({ ...base, expectedIncluded: [] }),
    /Included entries must match/,
  )
})
test('unknown transport results are not retried or converted to an empty success', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(JSON.stringify({ retcode: 503, retmsg: 'unknown' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  await assert.rejects(
    runMemoryStartupConsumer({ ...base, expectedIncluded: [] }),
    (error) => error instanceof APIError && error.status === 503,
  )
  assert.equal(calls, 1)
})

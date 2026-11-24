import assert from 'node:assert/strict'
import test from 'node:test'
import { runMemoryCompactionConsumer } from '../../../scripts/consumers/memory-compaction'
import {
  compactionResult,
  compactionList,
} from '../../components/memory/__tests__/memory-compaction-fixtures'

test('shared consumer preserves root order and performs only one explicit model command; recovery is GET-only', async () => {
  const previous = globalThis.fetch,
    requests: { method: string; path: string }[] = []
  globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input),
      method = init?.method ?? 'GET'
    requests.push({ method, path: url.pathname })
    assert.equal(
      new Headers(init?.headers).get('authorization'),
      'Bearer owned-token',
    )
    assert.equal(init?.cache, 'no-store')
    let data: unknown = compactionResult()
    if (method === 'POST') {
      const command = JSON.parse(String(init?.body))
      assert.deepEqual(command.source_ids, ['9223372036854775807', '2'])
      assert.equal(command.prefix_count, 1)
      assert.equal(command.operation_id, 'compaction-original')
    } else if (url.pathname.endsWith('/context-compactions'))
      data = compactionList()
    else if (url.pathname.includes('/sources/'))
      data = {
        state: 'available',
        verification: 'provenance_only',
        snapshot_only: true,
        locator: {
          kind: 'memory_message',
          memory_id: 'bank',
          message_id: '9223372036854775807',
        },
        content_sha256: 'a'.repeat(64),
        excerpt: '原文🧭',
        offset: 0,
        next_offset: null,
        total_chars: 3,
        truncated: false,
        continuation_requires_authorization: true,
        source_revision: '1',
        source_generation: '1',
        scope: { user_id: 'subject', agent_id: 'agent', session_id: '' },
        offset_unit: 'unicode_codepoint',
      }
    return Promise.resolve(
      new Response(JSON.stringify({ retcode: 0, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }
  try {
    const result = await runMemoryCompactionConsumer({
      baseURL: 'https://local.example',
      token: 'Bearer owned-token',
      memoryId: 'bank',
      sourceIds: ['9223372036854775807', '2'],
      prefixCount: 1,
      operationId: 'compaction-original',
      ownedScratchConfirmed: true,
    })
    assert.equal(result.applicationRequests, 0)
    assert.equal(requests.filter((r) => r.method === 'POST').length, 1)
    const count = requests.length
    const read = await runMemoryCompactionConsumer({
      baseURL: 'https://local.example',
      token: 'owned-token',
      memoryId: 'bank',
      sourceIds: ['9223372036854775807', '2'],
      prefixCount: 1,
      operationId: 'compaction-original',
      mode: 'read',
      exportReference: true,
      ownedScratchConfirmed: true,
    })
    assert.deepEqual(read.reference, {
      memory_id: 'bank',
      operation_id: 'compaction-original',
      artifact_id: 'artifact-compaction-original',
      input_manifest_sha256: 'b'.repeat(64),
    })
    assert.ok(requests.slice(count).every((r) => r.method === 'GET'))
  } finally {
    globalThis.fetch = previous
  }
})

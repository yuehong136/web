import assert from 'node:assert/strict'
import test from 'node:test'
import { memoryAPI } from '../memory'
import { apiClient } from '../client'
import type { RequestConfig } from '../client-types'

for (const envelope of [false, true]) {
  test(`memory retrieval preserves filters, cancellation and ${envelope ? 'SDK' : 'unwrapped'} results`, async (t) => {
    const rows = [
      { message_id: 17, memory_id: 'memory/a', content: 'remembered fact' },
    ]
    const controller = new AbortController()
    const get = t.mock.method(
      apiClient,
      'get',
      async <T>(endpoint: string, config?: RequestConfig): Promise<T> => {
        const url = new URL(endpoint, 'https://fixture.invalid')
        assert.equal(url.pathname, '/messages/search')
        assert.deepEqual(url.searchParams.getAll('memory_id'), [
          'memory/a',
          'memory-b',
        ])
        assert.equal(url.searchParams.get('query'), 'a & b?')
        assert.equal(url.searchParams.get('similarity_threshold'), '0')
        assert.equal(url.searchParams.get('keywords_similarity_weight'), '0')
        assert.equal(url.searchParams.get('top_n'), '5')
        assert.equal(url.searchParams.get('agent_id'), 'agent/x')
        assert.equal(url.searchParams.get('session_id'), 'session:y')
        assert.equal(config?.signal, controller.signal)
        assert.ok(config?.baseURL?.endsWith('/api'))
        return (envelope ? { retcode: 0, data: rows } : rows) as T
      },
    )
    assert.deepEqual(
      await memoryAPI.message.search(
        {
          memory_id: ['memory/a', 'memory-b'],
          query: 'a & b?',
          similarity_threshold: 0,
          keywords_similarity_weight: 0,
          top_n: 5,
          agent_id: 'agent/x',
          session_id: 'session:y',
        },
        controller.signal,
      ),
      rows,
    )
    assert.equal(get.mock.callCount(), 1)
  })
}

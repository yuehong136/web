import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient } from '../client'
import { createMemoryIncrementalAPI } from '../memory'
import type { MemoryDiscoverySelection } from '@/types/memory-incremental'

test('the shared discovery transport preserves explicit segmentation and Unicode span metadata without rounding source identities', async (t) => {
  const selection: MemoryDiscoverySelection = {
    scope: { user_id: '', agent_id: ' exact ', session_id: null },
    policy: 'general',
    entry_ids: [],
    batch_size: 1,
    max_sources: 1,
    input_budget_tokens: 8192,
    output_budget_tokens: 512,
    segmentation: {
      mode: 'segmented',
      fragment_token_limit: 256,
      max_parts_per_source: 32,
    },
  }
  const fragment = {
    fragment_id: 'f'.repeat(64),
    part_index: 1,
    part_count: 3,
    offset_unit: 'unicode_codepoint',
    core_start: 256,
    core_end: 512,
    read_start: 192,
    read_end: 576,
    core_sha256: 'c'.repeat(64),
    read_sha256: 'd'.repeat(64),
    splitter_version: 'unicode-boundary-v1',
  }
  const source = {
    source_id: '9007199254740993',
    source_revision: '9007199254740995',
    source_generation: '9007199254740997',
    content_sha256: 'a'.repeat(64),
    fragment,
  }
  let received: unknown
  t.mock.method(
    globalThis,
    'fetch',
    async (_url: string | URL | Request, init?: RequestInit) => {
      received = JSON.parse(String(init?.body))
      return new Response(
        JSON.stringify({
          retcode: 0,
          data: {
            token_fit: 'checked_at_preview',
            counts: { selected_fragments: 3 },
            source_coverage: {
              unit: 'sources',
              selected: 1,
              covered: 0,
              partial: 1,
              blocked: 0,
              total_parts: 3,
              analyzed_parts: 1,
            },
            batches: [{ primary_sources: [source] }],
          },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    },
  )
  const api = createMemoryIncrementalAPI(
    'https://fixture.invalid',
    new APIClient('https://fixture.invalid'),
  )
  const result = await api.preview('bank', selection)
  assert.deepEqual(received, selection)
  assert.equal(result.token_fit, 'checked_at_preview')
  assert.equal(result.counts.selected_fragments, 3)
  assert.equal(result.source_coverage!.covered, 0)
  assert.deepEqual(result.batches[0].primary_sources[0], source)
})

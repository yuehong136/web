import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ChunkResult } from '@/types/search'
import { highlightTerms } from '@/components/chat/reference-highlight'
import { toReferenceChunk } from '../search-reference-chunk'

const result = (fields: Partial<ChunkResult>): ChunkResult =>
  ({
    chunk_id: 'c1',
    doc_id: 'd1',
    docnm_kwd: 'harness.pdf',
    kb_id: 'kb1',
    content_with_weight: 'HarnessX 在五个基准上评测',
    ...fields,
  }) as ChunkResult

test('a search result keeps its matched words for the citation cards', () => {
  const chunk = toReferenceChunk(
    result({ highlight: '<em>HarnessX</em> 在五个<em>基准</em>上评测' }),
  )
  assert.equal(chunk.content, 'HarnessX 在五个基准上评测')
  assert.deepEqual(highlightTerms(chunk), ['HarnessX', '基准'])
})

test('a highlight without marked words is left out', () => {
  assert.equal('highlight' in toReferenceChunk(result({})), false)
  assert.equal(
    'highlight' in toReferenceChunk(result({ highlight: '没有命中词' })),
    false,
  )
})

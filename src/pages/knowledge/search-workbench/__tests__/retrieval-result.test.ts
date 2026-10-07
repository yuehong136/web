import assert from 'node:assert/strict'
import test from 'node:test'
import {
  toRetrievalResultView,
  toRetrievalResultViewList,
} from '../adapters/retrieval-result'
import type { RetrievalResult } from '../types'

const base = {
  chunk_id: 'chunk',
  text: 'HarnessX',
  doc_id: 'doc',
  docnm_kwd: 'HarnessX.html',
  kb_id: 'kb',
}

// 线上响应是 JSON：null 与字符串原样到达适配层，NaN 只能来自前端计算
const fromWire = (json: string) =>
  toRetrievalResultView({ ...base, ...JSON.parse(json) } as RetrievalResult)
    .scores

test('valid scores pass through and a real zero stays zero', () => {
  assert.deepEqual(
    fromWire(
      '{"similarity": 0.9, "vector_similarity": 0.824, "term_similarity": 1}',
    ),
    { combined: 0.9, vector: 0.824, term: 1 },
  )
  assert.deepEqual(
    fromWire('{"similarity": 0, "vector_similarity": 0, "term_similarity": 0}'),
    { combined: 0, vector: 0, term: 0 },
  )
})

test('null and missing scores are unavailable instead of 0', () => {
  assert.deepEqual(
    fromWire(
      '{"similarity": 0.61, "vector_similarity": null, "term_similarity": null}',
    ),
    { combined: 0.61, vector: null, term: null },
  )
  assert.deepEqual(fromWire('{}'), {
    combined: null,
    vector: null,
    term: null,
  })
})

test('NaN, strings and out-of-range values are unavailable, not clamped', () => {
  assert.deepEqual(
    toRetrievalResultView({
      ...base,
      similarity: Number.NaN,
      vector_similarity: Number.POSITIVE_INFINITY,
      term_similarity: 0.5,
    }).scores,
    { combined: null, vector: null, term: 0.5 },
  )
  assert.deepEqual(
    fromWire(
      '{"similarity": "0.8", "vector_similarity": 1.5, "term_similarity": -0.1}',
    ),
    { combined: null, vector: null, term: null },
  )
  // 知识库设了 PageRank 时综合分叠加排序加权，超过 1，不能夹成 100%
  assert.equal(fromWire('{"similarity": 10.62}').combined, null)
  assert.equal(fromWire('{"similarity": 1.0000000000000002}').combined, 1)
})

test('the list keeps the retrieval order instead of re-sorting by score', () => {
  const views = toRetrievalResultViewList([
    { ...base, chunk_id: 'first', similarity: 0.3 },
    { ...base, chunk_id: 'second', similarity: null },
    { ...base, chunk_id: 'third', similarity: 0.9 },
  ])
  assert.deepEqual(
    views.map((view) => [view.id, view.scores.combined]),
    [
      ['first', 0.3],
      ['second', null],
      ['third', 0.9],
    ],
  )
})

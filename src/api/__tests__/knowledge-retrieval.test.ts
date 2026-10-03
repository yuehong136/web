import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError } from '../client'
import { knowledgeAPI } from '../knowledge'
import {
  knowledgeGraphAPI,
  knowledgeRetrievalAPI,
} from '../knowledge-retrieval'

const result = {
  total: 71,
  chunks: [{ chunk_id: 'enabled', text: 'page', kb_id: 'a' }],
  doc_aggs: [{ doc_name: 'source', doc_id: 'doc', count: 1 }],
  labels: { tag: 2 },
}

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  })
}

test('both retrieval consumers use one REST query with the complete dataset selection', async (t) => {
  const calls: { url: URL; body: unknown }[] = []
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url: new URL(url), body: JSON.parse(String(init.body)) })
    return response({ code: 0, data: result })
  })
  assert.equal(knowledgeAPI.retrievalTest, knowledgeRetrievalAPI)
  const controls = {
    question: 'question',
    page: 3,
    size: 2,
    top_k: 1024,
    doc_ids: ['doc'],
    similarity_threshold: 0.4,
    vector_similarity_weight: 0.6,
    use_kg: true,
    rerank_id: 'rerank',
    tenant_rerank_id: 42,
    search_id: 'search',
    highlight: true,
    keyword: true,
    cross_languages: ['English'],
    search_mode: {
      type: 'hybrid' as const,
      weight_dense: 0.4,
      weight_sparse: 0.6,
    },
    meta_data_filter: {
      method: 'manual' as const,
      logic: 'and' as const,
      manual: [{ key: 'category', op: '=', value: 'x' }],
    },
  }
  for (const kb_ids of [['a/b'], ['a/b', 'second']]) {
    const data = await knowledgeAPI.retrievalTest.test({ kb_ids, ...controls })
    assert.deepEqual(data, result)
    assert.deepEqual(calls.at(-1)?.body, { ...controls, dataset_ids: kb_ids })
    assert.equal(calls.at(-1)?.url.pathname, '/api/v1/datasets/a%2Fb/search')
  }
  assert.equal(calls.length, 2)
})

test('missing dataset selection fails before transport', async (t) => {
  const http = t.mock.method(globalThis, 'fetch', async () =>
    response({ code: 0 }),
  )
  for (const kb_ids of [[], [''], ['a', ' ']])
    await assert.rejects(
      knowledgeAPI.retrievalTest.test({ kb_ids, question: 'q' }),
      APIError,
    )
  assert.equal(http.mock.callCount(), 0)
})

test('dataset and document graphs use the REST graph endpoint with encoded scope', async (t) => {
  const urls: URL[] = []
  const graph = { graph: { nodes: [], edges: [] }, mind_map: {} }
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    urls.push(new URL(url))
    return response({ code: 0, data: graph })
  })
  assert.deepEqual(
    await knowledgeAPI.knowledgeBase.getKnowledgeGraph('kb/1'),
    graph,
  )
  assert.deepEqual(await knowledgeGraphAPI.get('kb/1', 'doc/1'), graph)
  assert.equal(urls[0]?.pathname, '/api/v1/datasets/kb%2F1/graph')
  assert.equal(urls[0]?.search, '')
  assert.equal(urls[1]?.searchParams.get('doc_id'), 'doc/1')
})

test('business errors and legacy or invalid envelopes cannot acknowledge migrated requests', async (t) => {
  let wire: unknown = { code: 109, message: 'No authorization.' }
  t.mock.method(globalThis, 'fetch', async () => response(wire))
  for (const invalid of [
    wire,
    { retcode: 0, data: result },
    { code: '0', data: result },
    result,
  ]) {
    wire = invalid
    await assert.rejects(
      knowledgeAPI.retrievalTest.test({ kb_ids: ['a'], question: 'q' }),
      APIError,
    )
    await assert.rejects(knowledgeGraphAPI.get('a'), APIError)
  }
})

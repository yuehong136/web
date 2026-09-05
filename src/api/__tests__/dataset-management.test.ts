import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient, type RequestConfig } from '../client'
import { knowledgeAPI } from '../knowledge'

test('index operations share the canonical path and task envelope', async (t) => {
  const calls: unknown[] = []
  t.mock.method(
    apiClient,
    'post',
    async (path: string, body: unknown, config: RequestConfig) => {
      calls.push([path, body, config.baseURL])
      return { task_id: 'task' }
    },
  )
  t.mock.method(apiClient, 'get', async (path: string) => {
    calls.push(path)
    return { id: 'task', progress: 0.5 }
  })
  t.mock.method(apiClient, 'delete', async (path: string) => {
    calls.push(path)
    return {}
  })
  for (const type of ['graph', 'raptor', 'mindmap'] as const) {
    assert.deepEqual(await knowledgeAPI.generate.run('kb/1', type), {
      task_id: 'task',
    })
    assert.equal((await knowledgeAPI.generate.trace('kb/1', type)).id, 'task')
    await knowledgeAPI.generate.delete('kb/1', type)
  }
  assert.deepEqual(
    calls.filter((c) => typeof c === 'string'),
    ['graph', 'raptor', 'mindmap'].flatMap((type) =>
      Array(2).fill(`/v1/datasets/kb%2F1/index?type=${type}`),
    ),
  )
  for (const call of calls.filter(Array.isArray)) {
    assert.equal(call[1], undefined)
    assert.ok(call[2].endsWith('/api'))
  }
})

test('detail normalizes counts and preserves editable metadata definitions', async (t) => {
  const metadata = [{ key: 'author', enum: ['Alice'] }]
  t.mock.method(
    apiClient,
    'get',
    async (path: string, config: RequestConfig) => {
      assert.equal(path, '/v1/datasets/kb%2F1')
      assert.ok(config.baseURL?.endsWith('/api'))
      return {
        id: 'kb/1',
        document_count: 4,
        chunk_count: 8,
        chunk_method: 'naive',
        embedding_model: 'emb',
        parser_config: { metadata },
      }
    },
  )
  const result = await knowledgeAPI.knowledgeBase.get('kb/1')
  assert.equal(result.doc_num, 4)
  assert.equal(result.chunk_num, 8)
  assert.equal(result.embd_id, 'emb')
  assert.deepEqual(result.metadata_settings, metadata)
})

test('ingestion list repeats status filters and summary preserves status counts', async (t) => {
  const summary = {
    doc_num: 9,
    chunk_num: 20,
    token_num: 300,
    status: {
      unstart_count: 1,
      running_count: 2,
      cancel_count: 1,
      done_count: 4,
      fail_count: 1,
    },
  }
  t.mock.method(
    apiClient,
    'get',
    async (path: string, config: RequestConfig) => {
      assert.ok(config.baseURL?.endsWith('/api'))
      if (path.endsWith('/summary')) return summary
      const url = new URL(path, 'https://example.test')
      assert.equal(url.pathname, '/v1/datasets/kb%2F1/ingestions')
      assert.deepEqual(url.searchParams.getAll('operation_status'), ['1', '4'])
      assert.equal(url.searchParams.get('page'), '2')
      assert.equal(url.searchParams.get('page_size'), '20')
      assert.equal(url.searchParams.has('kb_id'), false)
      return { logs: [], total: 0 }
    },
  )
  await knowledgeAPI.logs.listDatasetLogs({
    kb_id: 'kb/1',
    page: 2,
    page_size: 20,
    operation_status: ['1', '4'],
  })
  assert.deepEqual(await knowledgeAPI.logs.getSummary('kb/1'), summary)
})

test('tags normalize tuples and scope rename/delete to the dataset', async (t) => {
  const calls: unknown[] = []
  t.mock.method(
    apiClient,
    'get',
    async (path: string, config: RequestConfig) => {
      calls.push([path, config.params])
      return path.endsWith('/tags')
        ? [['alpha', 2]]
        : [{ value: 'alpha', count: 5 }]
    },
  )
  t.mock.method(apiClient, 'put', async (path: string, body: unknown) => {
    calls.push([path, body])
    return {}
  })
  t.mock.method(
    apiClient,
    'delete',
    async (path: string, config: RequestConfig) => {
      calls.push([path, config.data])
      return {}
    },
  )
  assert.deepEqual(await knowledgeAPI.tag.list('kb/1'), [
    { name: 'alpha', count: 2 },
  ])
  assert.deepEqual(await knowledgeAPI.tag.aggregate(['a', 'b']), [
    { value: 'alpha', count: 5 },
  ])
  await knowledgeAPI.tag.rename('kb/1', 'alpha', 'beta')
  await knowledgeAPI.tag.delete('kb/1', ['beta'])
  assert.deepEqual(calls, [
    ['/v1/datasets/kb%2F1/tags', undefined],
    ['/v1/datasets/tags/aggregation', { dataset_ids: 'a,b' }],
    ['/v1/datasets/kb%2F1/tags', { from_tag: 'alpha', to_tag: 'beta' }],
    ['/v1/datasets/kb%2F1/tags', { tags: ['beta'] }],
  ])
})

test('parse/stop deduplicate ids and reject incomplete batch success', async (t) => {
  const calls: unknown[] = []
  let result: unknown = { success_count: 1 }
  t.mock.method(
    apiClient,
    'post',
    async (path: string, body: unknown, config?: RequestConfig) => {
      calls.push([path, body, config?.baseURL])
      return result
    },
  )
  await knowledgeAPI.document.parse('kb/1', ['doc', 'doc'])
  await knowledgeAPI.document.stop('kb/1', ['doc'])
  assert.deepEqual(
    calls.map((call) => (call as unknown[]).slice(0, 2)),
    [
      ['/v1/datasets/kb%2F1/documents/parse', { document_ids: ['doc'] }],
      ['/v1/datasets/kb%2F1/documents/stop', { document_ids: ['doc'] }],
    ],
  )
  result = { success_count: 0, errors: ['already finished'] }
  await assert.rejects(
    knowledgeAPI.document.stop('kb/1', ['doc']),
    (error: unknown) =>
      error instanceof APIError &&
      error.code === 'INCOMPLETE_DOCUMENT_OPERATION',
  )
  await assert.rejects(knowledgeAPI.document.parse('', ['doc']), APIError)
  await assert.rejects(knowledgeAPI.document.parse('kb', []), APIError)
  result = true
  await knowledgeAPI.document.parse('kb/1', ['doc'], true)
  assert.deepEqual((calls.at(-1) as unknown[]).slice(0, 2), [
    '/v1/document/run',
    { doc_ids: ['doc'], run: 1, delete: true },
  ])
})

test('nonzero business errors from parsing are never swallowed or retried on legacy', async (t) => {
  const failure = new APIError(200, '102', 'Partial failure', {
    success_count: 1,
  })
  const mock = t.mock.method(apiClient, 'post', async () => {
    throw failure
  })
  await assert.rejects(
    knowledgeAPI.document.parse('kb', ['valid', 'missing']),
    (error) => error === failure,
  )
  assert.equal(mock.mock.callCount(), 1)
})

test('ingestion detail and metadata reads scope encoded dataset and log ids', async (t) => {
  const calls: unknown[] = []
  t.mock.method(
    apiClient,
    'get',
    async (path: string, config: RequestConfig) => {
      calls.push([path, config.params])
      return {}
    },
  )
  await knowledgeAPI.logs.get('kb/1', 'log/2')
  await knowledgeAPI.metadata.getConfig('kb/1')
  await knowledgeAPI.metadata.getFlattened(['kb/1', 'kb2'])
  assert.deepEqual(calls, [
    ['/v1/datasets/kb%2F1/ingestions/log%2F2', undefined],
    ['/v1/datasets/kb%2F1/metadata/config', undefined],
    ['/v1/datasets/metadata/flattened', { dataset_ids: 'kb/1,kb2' }],
  ])
})

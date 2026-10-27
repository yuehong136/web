import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient, type RequestConfig } from '../client'
import { knowledgeAPI } from '../knowledge'
import { dialogAPI } from '../dialog'
import { searchAPI } from '../search'
import { agentAPI } from '../agent'
import { mcpAPI } from '../mcp'
import { memoryAPI } from '../memory'
import { collectListWindow, isLargeListWindow } from '../list-pagination'

test('large selector windows aggregate REST pages without dropping filters or later options', async (t) => {
  const calls: URL[] = []
  t.mock.method(
    apiClient,
    'get',
    async (path: string, config?: RequestConfig) => {
      const url = new URL(path, 'http://fixture.test')
      for (const [key, value] of Object.entries(config?.params ?? {}))
        if (value !== undefined) url.searchParams.set(key, String(value))
      calls.push(url)
      const page = Number(url.searchParams.get('page'))
      assert.equal(url.searchParams.get('page_size'), '100')
      assert.equal(url.searchParams.get('keywords'), 'filtered')
      const items = Array.from(
        { length: Math.min(100, 250 - (page - 1) * 100) },
        (_, index) => ({ id: String((page - 1) * 100 + index) }),
      )
      if (url.pathname === '/v1/datasets') return { data: items, total: 250 }
      if (url.pathname === '/memories')
        return { memory_list: items, total_count: 250 }
      const key = (
        {
          '/chats': 'chats',
          '/searches': 'search_apps',
          '/agents': 'canvas',
          '/mcp/servers': 'mcp_servers',
          '/agents/demo/sessions': 'sessions',
        } as Record<string, string>
      )[url.pathname]
      assert.ok(key)
      return { [key]: items, total: 250 }
    },
  )
  const params = { page: 2, page_size: 150, keywords: 'filtered' }
  const results: Array<Array<{ id: string }>> = [
    (await knowledgeAPI.knowledgeBase.list(params)).kbs,
    (await dialogAPI.listChats(params)).chats,
    (await searchAPI.list(params)).search_apps,
    (await agentAPI.listAgents(params)).canvas,
    (await mcpAPI.listServers({}, params)).mcp_servers,
    (await memoryAPI.memory.list(params)).memory_list,
  ]
  const sessions = await agentAPI.fetchSessions('demo', params)
  assert.ok(!Array.isArray(sessions))
  results.push(sessions.sessions)
  for (const items of results) {
    assert.equal(items.length, 100)
    assert.equal(items[0].id, '150')
    assert.equal(items.at(-1)?.id, '249')
  }
  assert.equal(calls.length, 14)
  assert.deepEqual(
    calls.map((url) => url.searchParams.get('page')),
    Array.from({ length: 7 }, () => ['2', '3']).flat(),
  )
})

test('pagination preserves legal zero and rejects partial pages or subsequent failures', async () => {
  assert.equal(isLargeListWindow({ page: 0, page_size: 0 }), false)
  assert.equal(isLargeListWindow({ page: 1, page_size: 0 }), false)
  assert.equal(isLargeListWindow({ page_size: 100.5 }), false)
  await assert.rejects(
    () =>
      collectListWindow(
        { page_size: 200 },
        async () => ({ total: 0, items: [{ id: 'one' }] }),
        'items',
      ),
    (error: unknown) =>
      error instanceof APIError && error.code === 'INVALID_LIST_RESPONSE',
  )
  await assert.rejects(
    () =>
      collectListWindow(
        { page_size: 200 },
        async () => ({ total: 250, items: [{ id: 'one' }] }),
        'items',
      ),
    (error: unknown) =>
      error instanceof APIError && error.code === 'INCOMPLETE_LIST_RESPONSE',
  )
  let requests = 0
  await assert.rejects(
    () =>
      collectListWindow(
        { page_size: 200 },
        async () => {
          if (++requests === 2) throw new APIError(403, '109', 'denied')
          return {
            total: 250,
            items: Array.from({ length: 100 }, (_, id) => ({ id: String(id) })),
          }
        },
        'items',
      ),
    (error: unknown) => error instanceof APIError && error.code === '109',
  )
})

test('dataset selector follows total_datasets through the shared HTTP client beyond page two', async () => {
  const originalFetch = globalThis.fetch
  const requests: URL[] = []
  globalThis.fetch = (async (input) => {
    const url = new URL(String(input))
    requests.push(url)
    const offset = (Number(url.searchParams.get('page')) - 1) * 100
    return Response.json({
      retcode: 0,
      total_datasets: 205,
      data: Array.from({ length: Math.min(100, 205 - offset) }, (_, index) => ({
        id: String(offset + index),
        name: `Dataset ${offset + index}`,
      })),
    })
  }) as typeof fetch
  try {
    const result = await knowledgeAPI.knowledgeBase.list({
      page_size: 1000,
      owner_ids: ['one', 'two'],
      keywords: 'filtered',
    })
    assert.equal(result.total, 205)
    assert.equal(result.kbs.length, 205)
    assert.equal(result.kbs.at(-1)?.id, '204')
    assert.equal(requests.length, 3)
    for (const url of requests) {
      assert.equal(url.searchParams.get('page_size'), '100')
      assert.equal(url.searchParams.get('keywords'), 'filtered')
      assert.deepEqual(url.searchParams.getAll('owner_ids'), ['one', 'two'])
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('aggregate list ownership rejects identity rotation before requesting another page', async () => {
  for (const restorePreviousToken of [false, true]) {
    apiClient.setAuthToken('initial-owner')
    let calls = 0
    try {
      await assert.rejects(
        () =>
          collectListWindow(
            { page_size: 200 },
            async () => {
              calls += 1
              apiClient.setAuthToken('next-owner')
              if (restorePreviousToken) apiClient.setAuthToken('initial-owner')
              return {
                total: 200,
                items: Array.from({ length: 100 }, (_, id) => ({ id })),
              }
            },
            'items',
          ),
        (error: unknown) =>
          error instanceof DOMException && error.name === 'AbortError',
      )
      assert.equal(calls, 1)
    } finally {
      apiClient.setAuthToken(null)
    }
  }
})

test('aggregate lists reject repeated pages, overlaps, changed totals and missing identities', async () => {
  const page = (start: number): unknown[] =>
    Array.from({ length: 100 }, (_, id) => ({ id: String(start + id) }))
  for (const [name, second, total] of [
    ['repeated page', page(0), 205],
    ['partial overlap', page(50), 205],
    ['total drift', page(100), 204],
    ['null entity', [null, ...page(101).slice(1)], 205],
    ['missing ID', [{ name: 'invalid' }, ...page(101).slice(1)], 205],
    ['empty ID', [{ id: '' }, ...page(101).slice(1)], 205],
    ['numeric ID', [{ id: 100 }, ...page(101).slice(1)], 205],
  ] as const) {
    let calls = 0
    await assert.rejects(
      () =>
        collectListWindow(
          { page_size: 1000 },
          async () => ({
            total: ++calls === 1 ? 205 : total,
            items: calls === 1 ? page(0) : second,
          }),
          'items',
        ),
      (error: unknown) =>
        error instanceof APIError && error.code === 'INVALID_LIST_RESPONSE',
      name,
    )
    assert.equal(calls, 2, name)
  }
  for (const items of [
    [null],
    [{}],
    [{ id: ' ' }],
    [{ id: 'same' }, { id: 'same' }],
  ]) {
    await assert.rejects(
      () =>
        collectListWindow(
          { page_size: 200 },
          async () => ({ total: items.length, items }),
          'items',
        ),
      (error: unknown) =>
        error instanceof APIError && error.code === 'INVALID_LIST_RESPONSE',
    )
  }
})

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
      assert.equal(url.searchParams.get('keywords'), '报告')
      assert.ok(['file', 'dataset'].includes(url.searchParams.get('log_type')!))
      assert.deepEqual(url.searchParams.getAll('types'), ['txt', 'pdf'])
      assert.deepEqual(url.searchParams.getAll('suffix'), ['txt'])
      assert.equal(url.searchParams.get('desc'), 'false')
      assert.equal(
        url.searchParams.get('create_date_from'),
        '2025-01-04T08:00:00+08:00',
      )
      return { logs: [], total: 0 }
    },
  )
  const params = {
    kb_id: 'kb/1',
    page: 2,
    page_size: 20,
    operation_status: ['1', '4'],
    keywords: '报告',
    types: ['txt', 'pdf'],
    suffix: ['txt'],
    desc: false,
    create_date_from: '2025-01-04T08:00:00+08:00',
  }
  await knowledgeAPI.logs.listDatasetLogs(params)
  await knowledgeAPI.logs.listFileLogs(params)
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
      return { retcode: 0, data: result }
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

test('dataset updates send pipeline switches through ext and leave unedited associations omitted', async (t) => {
  const bodies: Record<string, unknown>[] = []
  t.mock.method(
    apiClient,
    'put',
    async (_path: string, body: Record<string, unknown>) => {
      bodies.push(body)
      return {
        id: 'kb',
        name: body.name,
        pipeline_id: (body.ext as { pipeline_id?: string } | undefined)
          ?.pipeline_id,
      }
    },
  )
  const selected = await knowledgeAPI.knowledgeBase.update({
    kb_id: 'kb',
    name: '中文库',
    pipeline_id: 'a'.repeat(32),
    parser_id: null,
  })
  assert.equal(selected.pipeline_id, 'a'.repeat(32))
  assert.deepEqual(bodies[0], {
    name: '中文库',
    ext: { pipeline_id: 'a'.repeat(32) },
  })
  await knowledgeAPI.knowledgeBase.update({
    kb_id: 'kb',
    name: '中文库',
    pipeline_id: '',
    parser_id: 'naive',
  })
  assert.deepEqual(bodies[1], {
    name: '中文库',
    chunk_method: 'naive',
    ext: { pipeline_id: '' },
  })
  await knowledgeAPI.knowledgeBase.update({ kb_id: 'kb', name: 'New name' })
  assert.deepEqual(bodies[2], { name: 'New name' })
})

test('pause opts into preserved artifacts while explicit deletion keeps wipe default', async (t) => {
  const calls: string[] = []
  t.mock.method(apiClient, 'delete', async (path: string) => {
    calls.push(path)
    return {}
  })
  await knowledgeAPI.generate.delete('kb/1', 'graph', {
    wipe: false,
    taskId: 'task/1',
  })
  await knowledgeAPI.generate.delete('kb/1', 'graph')
  assert.deepEqual(calls, [
    '/v1/datasets/kb%2F1/index?type=graph&wipe=false&task_id=task%2F1',
    '/v1/datasets/kb%2F1/index?type=graph',
  ])
})

test('explicit zero dataset counters survive detail normalization', async (t) => {
  t.mock.method(apiClient, 'get', async () => ({
    id: 'empty',
    document_count: 0,
    chunk_count: 0,
    chunk_method: 'naive',
    embedding_model: 'emb',
    parser_config: {},
  }))
  const result = await knowledgeAPI.knowledgeBase.get('empty')
  assert.equal(result.doc_num, 0)
  assert.equal(result.chunk_num, 0)
})

for (const wire of [
  [
    ['zero', 0],
    ['two', 2],
    ['', 4],
  ],
  [{ value: 'zero', count: 0 }, { value: 'two', count: 2 }, { count: 4 }],
]) {
  test(`both tag endpoints normalize ${JSON.stringify(wire)} without losing zero`, async (t) => {
    t.mock.method(apiClient, 'get', async () => wire)
    assert.deepEqual(await knowledgeAPI.tag.list('kb'), [
      { name: 'zero', count: 0 },
      { name: 'two', count: 2 },
    ])
    assert.deepEqual(await knowledgeAPI.tag.aggregate(['kb']), [
      { value: 'zero', count: 0 },
      { value: 'two', count: 2 },
    ])
  })
}

test('tags default missing counts to zero and reject malformed counts', async (t) => {
  let wire: unknown = [{ value: 'missing' }]
  t.mock.method(apiClient, 'get', async () => wire)
  assert.deepEqual(await knowledgeAPI.tag.aggregate(['kb']), [
    { value: 'missing', count: 0 },
  ])
  for (const count of [-1, NaN, Infinity, '2']) {
    wire = [{ value: 'bad', count }]
    await assert.rejects(knowledgeAPI.tag.aggregate(['kb']))
  }
})

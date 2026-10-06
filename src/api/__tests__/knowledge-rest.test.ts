import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient, type RequestConfig } from '../client'
import { knowledgeAPI } from '../knowledge'
import { knowledgeDocumentAPI } from '../knowledge-documents'
import {
  createEmptyDatasetDocument,
  createWebDatasetDocument,
  deleteDatasetDocuments,
  listDatasetDocuments,
  normalizeDatasetDocument,
  uploadDatasetDocuments,
  type DatasetDocumentDTO,
} from '../knowledge-rest'

test('knowledge facade exposes the domain document client', () => {
  assert.equal(knowledgeAPI.document, knowledgeDocumentAPI)
})

test('chunk management uses canonical RESTful routes and preserves the UI model', async () => {
  const originalGet = apiClient.get
  const originalPost = apiClient.post
  const originalPatch = apiClient.patch
  const originalDelete = apiClient.delete
  const calls: Array<{
    method: string
    endpoint: string
    data?: unknown
    config?: RequestConfig
  }> = []

  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'GET', endpoint, config })
    return {
      total: 1,
      chunks: [
        {
          id: 'chunk-1',
          content: 'hello',
          document_id: 'doc-1',
          important_keywords: ['important'],
          questions: ['question'],
          available: false,
        },
      ],
      doc: {
        id: 'doc-1',
        dataset_id: 'kb-1',
        chunk_method: 'naive',
        chunk_count: 1,
        token_count: 2,
      },
    }
  }) as typeof apiClient.get
  apiClient.post = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'POST', endpoint, data, config })
    return {}
  }) as typeof apiClient.post
  apiClient.patch = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'PATCH', endpoint, data, config })
    return {}
  }) as typeof apiClient.patch
  apiClient.delete = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'DELETE', endpoint, config })
    return {}
  }) as typeof apiClient.delete

  try {
    const listed = await knowledgeDocumentAPI.listChunks({
      kb_id: 'kb-1',
      doc_id: 'doc-1',
      page: 2,
      size: 20,
      available_int: 0,
    })
    assert.equal(listed.chunks[0]?.chunk_id, 'chunk-1')
    assert.equal(listed.chunks[0]?.content_with_weight, 'hello')
    assert.equal(listed.chunks[0]?.available_int, 0)
    assert.equal(listed.doc.kb_id, 'kb-1')
    assert.equal(listed.doc.parser_id, 'naive')

    await knowledgeDocumentAPI.createChunk({
      kb_id: 'kb-1',
      doc_id: 'doc-1',
      content_with_weight: 'new chunk',
    })
    await knowledgeDocumentAPI.setChunk({
      kb_id: 'kb-1',
      doc_id: 'doc-1',
      chunk_id: 'chunk-1',
      content_with_weight: 'updated chunk',
    })
    await knowledgeDocumentAPI.switchChunks({
      kb_id: 'kb-1',
      doc_id: 'doc-1',
      chunk_ids: ['chunk-1'],
      available_int: 1,
    })
    await knowledgeDocumentAPI.deleteChunks({
      kb_id: 'kb-1',
      doc_id: 'doc-1',
      chunk_ids: ['chunk-1'],
    })
  } finally {
    apiClient.get = originalGet
    apiClient.post = originalPost
    apiClient.patch = originalPatch
    apiClient.delete = originalDelete
  }

  const collection = '/datasets/kb-1/documents/doc-1/chunks'
  assert.deepEqual(
    calls.map((call) => [call.method, call.endpoint]),
    [
      ['GET', collection],
      ['POST', collection],
      ['PATCH', `${collection}/chunk-1`],
      ['PATCH', collection],
      ['DELETE', collection],
    ],
  )
  assert.equal(
    calls.every((call) => call.config?.baseURL?.endsWith('/api')),
    true,
  )
  assert.deepEqual(calls[0]?.config?.params, {
    page: 2,
    page_size: 20,
    keywords: undefined,
    available: false,
  })
  assert.deepEqual(calls[4]?.config?.data, { chunk_ids: ['chunk-1'] })
})

test('chunk image replacement serializes only the PATCH mode and propagates business failure', async () => {
  const originalFetch = globalThis.fetch
  const bodies: Record<string, unknown>[] = []
  let code = 0
  globalThis.fetch = (async (_url, init) => {
    bodies.push(JSON.parse(init?.body as string))
    return new Response(
      JSON.stringify({ code, message: 'Private failure', data: {} }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }) as typeof fetch
  const params = {
    kb_id: 'kb',
    doc_id: 'doc',
    chunk_id: 'chunk',
    content_with_weight: 'text',
  }
  try {
    await knowledgeDocumentAPI.setChunk(params)
    assert.equal('image_update_mode' in bodies[0], false)
    assert.equal('image_base64' in bodies[0], false)
    await knowledgeDocumentAPI.setChunk({
      ...params,
      image_base64: 'aW1hZ2U=',
      image_update_mode: 'replace',
    })
    assert.equal(bodies[1].image_update_mode, 'replace')
    await knowledgeDocumentAPI.createChunk({
      ...params,
      image_base64: 'aW1hZ2U=',
    })
    assert.equal('image_update_mode' in bodies[2], false)
    code = 102
    await assert.rejects(
      knowledgeDocumentAPI.setChunk({
        ...params,
        image_base64: 'aW1hZ2U=',
        image_update_mode: 'replace',
      }),
      APIError,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

const dto: DatasetDocumentDTO = {
  id: 'doc-1',
  name: 'report.pdf',
  type: 'pdf',
  size: 42,
  dataset_id: 'kb-1',
  location: 'report.pdf',
  status: '1',
  run: 'DONE',
  chunk_count: 3,
  token_count: 12,
  created_by: 'user-1',
  create_date: '2026-07-20',
  update_date: '2026-07-20',
  create_time: 1,
  update_time: 2,
  chunk_method: 'naive',
  source_type: 'local',
  progress: 1,
  progress_msg: '',
  process_begin_at: '2026-07-20',
  process_duration: 1,
  meta_fields: {},
  suffix: 'pdf',
}

test('normalizeDatasetDocument keeps the frontend document model stable', () => {
  const document = normalizeDatasetDocument(dto)

  assert.equal(document.kb_id, 'kb-1')
  assert.equal(document.chunk_num, 3)
  assert.equal(document.token_num, 12)
  assert.equal(document.parser_id, 'naive')
  assert.equal(document.run, '3')
})

test('listDatasetDocuments uses the unified RESTful GET route and repeated filters', async () => {
  const originalGet = apiClient.get
  const calls: Array<{ endpoint: string; config?: RequestConfig }> = []
  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ endpoint, config })
    return { total: 1, docs: [dto] }
  }) as typeof apiClient.get

  try {
    const result = await listDatasetDocuments({
      kb_id: 'kb/1',
      page: 2,
      page_size: 20,
      keywords: 'quarterly report',
      orderby: 'name',
      desc: false,
      filter_params: {
        run_status: ['1', '3'],
        types: ['pdf'],
        suffix: ['pdf', 'txt'],
        metadata: { author: ['alice'] },
        return_empty_metadata: true,
      },
    })

    assert.equal(result.docs[0]?.run, '3')
  } finally {
    apiClient.get = originalGet
  }

  assert.equal(calls.length, 1)
  const endpoint = calls[0]?.endpoint ?? ''
  const url = new URL(endpoint, 'http://multirag.local')
  assert.equal(url.pathname, '/v1/datasets/kb%2F1/documents')
  assert.equal(url.searchParams.get('page'), '2')
  assert.equal(url.searchParams.get('page_size'), '20')
  assert.equal(url.searchParams.get('keywords'), 'quarterly report')
  assert.equal(url.searchParams.get('orderby'), 'name')
  assert.equal(url.searchParams.get('desc'), 'false')
  assert.deepEqual(url.searchParams.getAll('run_status'), ['1', '3'])
  assert.deepEqual(url.searchParams.getAll('types'), ['pdf'])
  assert.deepEqual(url.searchParams.getAll('suffix'), ['pdf', 'txt'])
  assert.deepEqual(JSON.parse(url.searchParams.get('metadata') ?? ''), {
    author: ['alice'],
  })
  assert.equal(url.searchParams.get('return_empty_metadata'), 'true')
  assert.equal(calls[0]?.config?.baseURL?.endsWith('/api'), true)
})

type DeleteCall = { endpoint: string; config?: RequestConfig }
type LegacyCall = { endpoint: string; data: unknown }

const withDeleteStubs = async (
  restful: (endpoint: string, config?: RequestConfig) => Promise<unknown>,
  run: (calls: {
    deletes: DeleteCall[]
    legacy: LegacyCall[]
  }) => Promise<void>,
) => {
  const originalDelete = apiClient.delete
  const originalPost = apiClient.post
  const deletes: DeleteCall[] = []
  const legacy: LegacyCall[] = []

  apiClient.delete = (async (endpoint: string, config?: RequestConfig) => {
    deletes.push({ endpoint, config })
    return restful(endpoint, config)
  }) as typeof apiClient.delete
  apiClient.post = (async (endpoint: string, data: unknown) => {
    legacy.push({ endpoint, data })
    return undefined
  }) as typeof apiClient.post

  try {
    await run({ deletes, legacy })
  } finally {
    apiClient.delete = originalDelete
    apiClient.post = originalPost
  }
}

test('deleteDatasetDocuments calls the RESTful route with the id list in the body', async () => {
  await withDeleteStubs(
    async () => ({ deleted: 2 }),
    async ({ deletes, legacy }) => {
      await deleteDatasetDocuments('kb/1', ['doc-1', 'doc-2'])

      assert.equal(deletes.length, 1)
      assert.equal(deletes[0]?.endpoint, '/v1/datasets/kb%2F1/documents')
      assert.deepEqual(deletes[0]?.config?.data, { ids: ['doc-1', 'doc-2'] })
      assert.equal(deletes[0]?.config?.baseURL?.endsWith('/api'), true)
      assert.equal(legacy.length, 0, '新路由可用时不得再打旧端点')
    },
  )
})

test('deleteDatasetDocuments falls back to the legacy route on 404/405', async () => {
  for (const status of [404, 405]) {
    await withDeleteStubs(
      async () => {
        throw new APIError(status, 'HTTP_ERROR', `HTTP ${status}`)
      },
      async ({ legacy }) => {
        await deleteDatasetDocuments('kb-1', ['doc-1'])

        assert.equal(legacy.length, 1)
        assert.equal(legacy[0]?.endpoint, '/v1/document/rm')
        assert.deepEqual(legacy[0]?.data, { doc_id: ['doc-1'] })
      },
    )
  }
})

test('deleteDatasetDocuments falls back when the client silently returns FastAPI 404 body', async () => {
  // apiClient 对非信封格式的错误响应不抛错，而是把 {"detail": "Not Found"} 原样透出
  await withDeleteStubs(
    async () => ({ detail: 'Not Found' }),
    async ({ legacy }) => {
      await deleteDatasetDocuments('kb-1', ['doc-1'])

      assert.equal(legacy.length, 1)
      assert.equal(legacy[0]?.endpoint, '/v1/document/rm')
    },
  )
})

test('deleteDatasetDocuments surfaces real failures instead of retrying the legacy route', async () => {
  await withDeleteStubs(
    async () => {
      throw new APIError(200, '102', "You don't own the dataset kb-1.")
    },
    async ({ legacy }) => {
      await assert.rejects(
        () => deleteDatasetDocuments('kb-1', ['doc-1']),
        /You don't own the dataset/,
      )
      assert.equal(legacy.length, 0, '业务错误不得退回旧端点重删一次')
    },
  )
})

test('document create modes use the REST contract and created documents read back', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ url: URL; init?: RequestInit }> = []
  const storedDocs: DatasetDocumentDTO[] = []
  const respond = (data: unknown, code = 0) =>
    new Response(
      JSON.stringify({ code, message: code ? 'Rejected' : '', data }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    )

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    calls.push({ url, init })
    if (init?.method === 'GET') {
      return respond({ total: storedDocs.length, docs: storedDocs })
    }
    if (url.searchParams.get('type') === 'local') {
      const form = init?.body as FormData
      assert.ok(form instanceof FormData)
      assert.equal(form.getAll('files').length, 1)
      const file = form.get('files') as File
      assert.equal(file.name, 'notes.txt')
      const stored = {
        ...dto,
        id: 'doc-local',
        name: file.name,
        dataset_id: 'kb/1',
        run: 'UNSTART',
      }
      storedDocs.push(stored)
      return respond([stored])
    }

    const mode = url.searchParams.get('type')
    const name =
      mode === 'web'
        ? (init?.body as FormData).get('name')
        : JSON.parse(String(init?.body)).name
    const id = mode === 'web' ? 'doc-web' : 'doc-empty'
    const stored = {
      ...dto,
      id,
      name: mode === 'web' ? `${name}.pdf` : name,
      dataset_id: 'kb/1',
      run: 'UNSTART',
    }
    storedDocs.push(stored)
    return respond(stored)
  }) as typeof fetch

  try {
    const local = await uploadDatasetDocuments('kb/1', [
      new File(['hello'], 'notes.txt', { type: 'text/plain' }),
    ])
    assert.equal(local[0]?.id, 'doc-local')

    const web = await createWebDatasetDocument(
      'kb/1',
      'Article',
      'https://example.com/article',
    )
    const empty = await createEmptyDatasetDocument('kb/1', 'Draft.txt')
    assert.equal(web.id, 'doc-web')
    assert.equal(empty.id, 'doc-empty')

    const readback = await listDatasetDocuments({
      kb_id: 'kb/1',
      filter_params: {},
    })
    assert.deepEqual(
      readback.docs.map((document) => [
        document.id,
        document.name,
        document.run,
      ]),
      [
        ['doc-local', 'notes.txt', '0'],
        ['doc-web', 'Article.pdf', '0'],
        ['doc-empty', 'Draft.txt', '0'],
      ],
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  for (const call of calls) {
    assert.equal(call.url.pathname, '/api/v1/datasets/kb%2F1/documents')
  }
  assert.deepEqual(
    calls.map((call) => [call.init?.method, call.url.searchParams.get('type')]),
    [
      ['POST', 'local'],
      ['POST', 'web'],
      ['POST', 'empty'],
      ['GET', null],
    ],
  )
  const webForm = calls[1]?.init?.body as FormData
  assert.ok(webForm instanceof FormData)
  assert.equal(webForm.get('name'), 'Article')
  assert.equal(webForm.get('url'), 'https://example.com/article')
  assert.equal(
    (calls[1]?.init?.headers as Record<string, string>)['Content-Type'],
    undefined,
  )
  assert.deepEqual(JSON.parse(String(calls[2]?.init?.body)), {
    name: 'Draft.txt',
  })
  assert.equal(
    (calls[2]?.init?.headers as Record<string, string>)['Content-Type'],
    'application/json',
  )
})

test('document creation surfaces business errors without reporting success', async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = (async () => {
    calls += 1
    return new Response(
      JSON.stringify({
        code: 102,
        message: 'Duplicated document name',
        data: null,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }) as typeof fetch

  try {
    for (const create of [
      () => createWebDatasetDocument('kb-1', 'Article', 'https://example.com'),
      () => createEmptyDatasetDocument('kb-1', 'Article'),
    ]) {
      await assert.rejects(create, (error: unknown) => {
        assert.ok(error instanceof APIError)
        assert.equal(error.code, '102')
        return true
      })
    }
    assert.equal(calls, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('document creation rejects an incomplete success payload', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ code: 0, data: { name: 'Draft.txt' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch

  try {
    await assert.rejects(
      () => createEmptyDatasetDocument('kb-1', 'Draft.txt'),
      (error: unknown) => {
        assert.ok(error instanceof APIError)
        assert.equal(error.code, 'INVALID_DOCUMENT_RESPONSE')
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

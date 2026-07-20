import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient, type RequestConfig } from '../client'
import {
  listDatasetDocuments,
  normalizeDatasetDocument,
  type DatasetDocumentDTO,
} from '../knowledge-rest'

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

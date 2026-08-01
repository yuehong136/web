import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient, type RequestConfig } from '../client'
import { knowledgeAPI } from '../knowledge'

type Call = { endpoint: string; data?: unknown; config?: RequestConfig }

const settings = [
  { key: 'author', description: '作者', enum: ['alice'] },
] as never

test('updateDocumentSettings puts the settings array on the RESTful config route', async () => {
  const calls: Call[] = []
  const originalPut = apiClient.put
  apiClient.put = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ endpoint, data, config })
  }) as typeof apiClient.put

  try {
    await knowledgeAPI.metadata.updateDocumentSettings({
      kb_id: 'kb/1',
      doc_id: 'doc-1',
      metadata: settings,
    })
  } finally {
    apiClient.put = originalPut
  }

  assert.equal(
    calls[0]?.endpoint,
    '/v1/datasets/kb%2F1/documents/doc-1/metadata/config',
  )
  // 后端收的是 {metadata}，doc_id/kb_id 只走路径
  assert.deepEqual(calls[0]?.data, { metadata: settings })
  assert.ok(calls[0]?.config?.baseURL?.endsWith('/api'))
})

test('updateDocumentSettings falls back to the legacy web route when the RESTful one is missing', async () => {
  const putCalls: Call[] = []
  const postCalls: Call[] = []
  const originalPut = apiClient.put
  const originalPost = apiClient.post
  apiClient.put = (async (endpoint: string) => {
    putCalls.push({ endpoint })
    throw new APIError(404, 'NOT_FOUND', 'Not Found')
  }) as typeof apiClient.put
  apiClient.post = (async (endpoint: string, data?: unknown) => {
    postCalls.push({ endpoint, data })
  }) as typeof apiClient.post

  try {
    await knowledgeAPI.metadata.updateDocumentSettings({
      kb_id: 'kb-1',
      doc_id: 'doc-1',
      metadata: settings,
    })
  } finally {
    apiClient.put = originalPut
    apiClient.post = originalPost
  }

  assert.equal(putCalls.length, 1)
  assert.equal(postCalls[0]?.endpoint, '/v1/document/update_metadata_setting')
  assert.deepEqual(postCalls[0]?.data, {
    doc_id: 'doc-1',
    metadata: settings,
  })
})

test('business errors are not swallowed by the legacy fallback', async () => {
  const putCalls: Call[] = []
  const originalPut = apiClient.put
  const originalPost = apiClient.post
  let postCalled = false
  apiClient.put = (async (endpoint: string) => {
    putCalls.push({ endpoint })
    throw new APIError(200, '102', "You don't own the dataset kb-1.")
  }) as typeof apiClient.put
  apiClient.post = (async () => {
    postCalled = true
  }) as typeof apiClient.post

  try {
    await assert.rejects(
      () =>
        knowledgeAPI.metadata.updateDocumentSettings({
          kb_id: 'kb-1',
          doc_id: 'doc-1',
          metadata: settings,
        }),
      APIError,
    )
  } finally {
    apiClient.put = originalPut
    apiClient.post = originalPost
  }

  assert.equal(putCalls.length, 1)
  assert.equal(postCalled, false)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { systemAPI } from '../system'
import { apiClient, type RequestConfig } from '../client'

test('system status API uses RESTful /api/v1/system/status endpoint', async () => {
  const originalGet = apiClient.get
  const calls: Array<{ endpoint: string; config?: RequestConfig }> = []

  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ endpoint, config })
    return {}
  }) as typeof apiClient.get

  try {
    await systemAPI.getStatus()
  } finally {
    apiClient.get = originalGet
  }

  assert.deepEqual(
    calls.map((call) => call.endpoint),
    ['/system/status'],
  )
  assert.equal(calls[0]?.config?.baseURL, 'http://localhost:8000/api')
})

test('system token API uses RESTful /api/v1/system/tokens endpoints', async () => {
  const originalGet = apiClient.get
  const originalPost = apiClient.post
  const originalDelete = apiClient.delete
  const calls: Array<{
    method: string
    endpoint: string
    data?: unknown
    config?: RequestConfig
  }> = []

  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'GET', endpoint, config })
    return []
  }) as typeof apiClient.get

  apiClient.post = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'POST', endpoint, data, config })
    return { token: 'multirag-token' }
  }) as typeof apiClient.post

  apiClient.delete = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'DELETE', endpoint, config })
    return true
  }) as typeof apiClient.delete

  try {
    await systemAPI.getTokenList()
    await systemAPI.createToken({ name: 'Automation' })
    await systemAPI.deleteToken('multirag-token_1')
  } finally {
    apiClient.get = originalGet
    apiClient.post = originalPost
    apiClient.delete = originalDelete
  }

  assert.deepEqual(
    calls.map((call) => [call.method, call.endpoint]),
    [
      ['GET', '/system/tokens'],
      ['POST', '/system/tokens'],
      ['DELETE', '/system/tokens/multirag-token_1'],
    ],
  )
  assert.equal(calls[0]?.config?.baseURL, 'http://localhost:8000/api')
  assert.equal(calls[1]?.config?.baseURL, 'http://localhost:8000/api')
  assert.equal(calls[2]?.config?.baseURL, 'http://localhost:8000/api')
})

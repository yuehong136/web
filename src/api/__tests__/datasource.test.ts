import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient, type RequestConfig } from '../client'
import { datasourceAPI } from '../datasource'

type Call = { endpoint: string; data?: unknown; config?: RequestConfig }

function stub(
  verb: 'get' | 'post' | 'put' | 'patch' | 'delete',
  impl: (...args: never[]) => Promise<unknown>,
) {
  const original = apiClient[verb]
  apiClient[verb] = impl as unknown as typeof original
  return () => {
    apiClient[verb] = original
  }
}

test('list and detail hit the RESTful connectors routes', async () => {
  const calls: Call[] = []
  const restore = stub(
    'get',
    async (endpoint: string, config?: RequestConfig) => {
      calls.push({ endpoint, config })
      return []
    },
  )

  try {
    await datasourceAPI.connector.list()
    await datasourceAPI.connector.get('conn/1')
  } finally {
    restore()
  }

  assert.deepEqual(
    calls.map((call) => call.endpoint),
    ['/v1/connectors', '/v1/connectors/conn%2F1'],
  )
  assert.ok(calls[0]?.config?.baseURL?.endsWith('/api'))
})

test('set creates with POST and updates with PATCH', async () => {
  const posts: Call[] = []
  const patches: Call[] = []
  const restorePost = stub(
    'post',
    async (endpoint: string, data?: unknown, config?: RequestConfig) => {
      posts.push({ endpoint, data, config })
      return { id: 'conn-1' }
    },
  )
  const restorePatch = stub(
    'patch',
    async (endpoint: string, data?: unknown, config?: RequestConfig) => {
      patches.push({ endpoint, data, config })
      return { id: 'conn-1' }
    },
  )

  try {
    await datasourceAPI.connector.set({
      name: 'drive',
      source: 'google_drive' as never,
      config: { token: 'x' },
    })
    await datasourceAPI.connector.set({
      id: 'conn-1',
      name: 'drive',
      source: 'google_drive' as never,
      config: { token: 'y' },
    })
  } finally {
    restorePost()
    restorePatch()
  }

  assert.equal(posts[0]?.endpoint, '/v1/connectors')
  assert.deepEqual(posts[0]?.data, {
    name: 'drive',
    source: 'google_drive',
    config: { token: 'x' },
  })
  // 更新只带后端认的调度字段，id 走路径
  assert.equal(patches[0]?.endpoint, '/v1/connectors/conn-1')
  assert.deepEqual(patches[0]?.data, { config: { token: 'y' } })
})

test('delete uses DELETE and resume/rebuild use POST', async () => {
  const deletes: Call[] = []
  const posts: Call[] = []
  const restoreDelete = stub('delete', async (endpoint: string) => {
    deletes.push({ endpoint })
  })
  const restorePost = stub('post', async (endpoint: string, data?: unknown) => {
    posts.push({ endpoint, data })
  })

  try {
    await datasourceAPI.connector.delete('conn-1')
    await datasourceAPI.connector.resume('conn-1', false)
    await datasourceAPI.connector.rebuild('conn-1', 'kb-1')
  } finally {
    restoreDelete()
    restorePost()
  }

  assert.deepEqual(
    deletes.map((call) => call.endpoint),
    ['/v1/connectors/conn-1'],
  )
  assert.deepEqual(posts, [
    { endpoint: '/v1/connectors/conn-1/resume', data: { resume: false } },
    { endpoint: '/v1/connectors/conn-1/rebuild', data: { kb_id: 'kb-1' } },
  ])
})

test('connector calls fall back to the legacy web routes when the RESTful ones are missing', async () => {
  const calls: Call[] = []
  const restore = stub(
    'get',
    async (endpoint: string, config?: RequestConfig) => {
      calls.push({ endpoint, config })
      if (endpoint.startsWith('/v1/connectors')) {
        throw new APIError(405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed')
      }
      return []
    },
  )

  try {
    await datasourceAPI.connector.list()
  } finally {
    restore()
  }

  assert.deepEqual(
    calls.map((call) => call.endpoint),
    ['/v1/connectors', '/v1/connector/list'],
  )
})

test('authorization errors are not swallowed by the legacy fallback', async () => {
  let legacyCalled = false
  const restore = stub('get', async (endpoint: string) => {
    if (endpoint.startsWith('/v1/connectors')) {
      throw new APIError(200, '109', 'No authorization.')
    }
    legacyCalled = true
    return {}
  })

  try {
    await assert.rejects(() => datasourceAPI.connector.get('conn-1'), APIError)
  } finally {
    restore()
  }

  assert.equal(legacyCalled, false)
})

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

test('dataset link, unlink and auto-parse hit the per-connector dataset routes', async () => {
  const puts: Call[] = []
  const deletes: Call[] = []
  const gets: Call[] = []
  const restorePut = stub(
    'put',
    async (endpoint: string, data?: unknown, config?: RequestConfig) => {
      puts.push({ endpoint, data, config })
    },
  )
  const restoreDelete = stub(
    'delete',
    async (endpoint: string, config?: RequestConfig) => {
      deletes.push({ endpoint, config })
    },
  )
  const restoreGet = stub(
    'get',
    async (endpoint: string, config?: RequestConfig) => {
      gets.push({ endpoint, config })
      return []
    },
  )

  try {
    await datasourceAPI.connector.link('conn-1', 'kb-1')
    await datasourceAPI.connector.updateAutoParse('conn-1', 'kb-1', false)
    await datasourceAPI.connector.unlink('conn-1', 'kb-1')
    await datasourceAPI.connector.listByKb('kb-1')
  } finally {
    restorePut()
    restoreDelete()
    restoreGet()
  }

  // link 与 updateAutoParse 是同一个幂等端点，只有 auto_parse 不同
  assert.deepEqual(puts, [
    {
      endpoint: '/v1/datasets/kb-1/connectors/conn-1',
      data: { auto_parse: true },
      config: puts[0]?.config,
    },
    {
      endpoint: '/v1/datasets/kb-1/connectors/conn-1',
      data: { auto_parse: false },
      config: puts[1]?.config,
    },
  ])
  assert.equal(deletes[0]?.endpoint, '/v1/datasets/kb-1/connectors/conn-1')
  assert.equal(gets[0]?.endpoint, '/v1/datasets/kb-1/connectors')
  assert.ok(gets[0]?.config?.baseURL?.endsWith('/api'))
})

test('oauth start uses the real backend routes and source query', async () => {
  const posts: Call[] = []
  const restore = stub(
    'post',
    async (endpoint: string, data?: unknown, config?: RequestConfig) => {
      posts.push({ endpoint, data, config })
      return {
        flow_id: 'f1',
        authorization_url: 'https://auth',
        expires_in: 900,
      }
    },
  )

  try {
    await datasourceAPI.oauth.startGoogleDrive({ credentials: '{}' })
    await datasourceAPI.oauth.startGmail({ credentials: '{}' })
    await datasourceAPI.oauth.startBox({ client_id: 'a', client_secret: 'b' })
  } finally {
    restore()
  }

  assert.deepEqual(
    posts.map((call) => call.endpoint),
    [
      '/v1/connectors/google/oauth/web/start?source=google-drive',
      '/v1/connectors/google/oauth/web/start?source=gmail',
      '/v1/connectors/box/oauth/web/start',
    ],
  )
})

test('oauth polling maps the pending retcode to a status instead of throwing', async () => {
  const restorePending = stub('post', async () => {
    throw new APIError(200, '106', 'Authorization is still pending.')
  })
  let pending
  try {
    pending = await datasourceAPI.oauth.pollGoogleDrive({ flow_id: 'f1' })
  } finally {
    restorePending()
  }
  assert.deepEqual(pending, { status: 'pending' })

  const restoreDone = stub('post', async () => ({ credentials: '{"token":1}' }))
  let done
  try {
    done = await datasourceAPI.oauth.pollBox({ flow_id: 'f1' })
  } finally {
    restoreDone()
  }
  assert.deepEqual(done, { status: 'completed', credentials: '{"token":1}' })

  // 真正的错误照抛，不能被当成 pending 吞掉
  const restoreError = stub('post', async () => {
    throw new APIError(
      200,
      '108',
      'You are not allowed to access this authorization result.',
    )
  })
  try {
    await assert.rejects(
      () => datasourceAPI.oauth.pollGmail({ flow_id: 'f1' }),
      APIError,
    )
  } finally {
    restoreError()
  }
})

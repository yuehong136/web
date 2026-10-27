import assert from 'node:assert/strict'
import test from 'node:test'
import { agentAPI } from '../agent'
import { apiClient } from '../client'
import { AgentCanvasCategory, AgentCanvasType } from '@/types/agent'

test('setAgent sends pipeline canvas_category when creating a pipeline', async () => {
  const originalPost = apiClient.post
  const calls: Array<{ endpoint: string; data: unknown }> = []

  apiClient.post = (async (endpoint: string, data?: unknown) => {
    calls.push({ endpoint, data })
    return { id: 'pipeline-1' }
  }) as typeof apiClient.post

  try {
    await agentAPI.setAgent({
      title: 'Pipeline',
      canvas_type: AgentCanvasType.PIPELINE,
      dsl: { graph: { nodes: [], edges: [] } },
    })
  } finally {
    apiClient.post = originalPost
  }

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.endpoint, '/agents')
  assert.equal(
    (calls[0]?.data as Record<string, unknown>).canvas_category,
    AgentCanvasCategory.INGESTION,
  )
})

test('setAgent does not backfill agent_canvas during graph-only updates', async () => {
  const originalPut = apiClient.put
  const calls: Array<{ endpoint: string; data: unknown }> = []

  apiClient.put = (async (endpoint: string, data?: unknown) => {
    calls.push({ endpoint, data })
    return { id: 'pipeline-1' }
  }) as typeof apiClient.put

  try {
    await agentAPI.setAgent({
      id: 'pipeline-1',
      title: 'Pipeline',
      dsl: { graph: { nodes: [], edges: [] } },
    })
  } finally {
    apiClient.put = originalPut
  }

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.endpoint, '/agents/pipeline-1')
  assert.equal(
    'canvas_category' in ((calls[0]?.data as Record<string, unknown>) || {}),
    false,
  )
})

test('updateSetting maps basic settings to the RESTful agent update contract', async () => {
  const originalPut = apiClient.put
  const calls: Array<{
    endpoint: string
    data: unknown
    baseURL?: string
  }> = []

  apiClient.put = (async (
    endpoint: string,
    data?: unknown,
    config?: { baseURL?: string },
  ) => {
    calls.push({ endpoint, data, baseURL: config?.baseURL })
    return true
  }) as typeof apiClient.put

  try {
    await agentAPI.updateSetting({
      id: 'agent/with space',
      title: 'Renamed agent',
      description: 'Updated description',
      avatar: 'avatar.svg',
      permission: 'write',
    })
  } finally {
    apiClient.put = originalPut
  }

  assert.deepEqual(calls, [
    {
      endpoint: '/agents/agent%2Fwith%20space',
      data: {
        title: 'Renamed agent',
        description: 'Updated description',
        avatar: 'avatar.svg',
        permission: 'write',
      },
      baseURL: 'http://localhost:8000/api',
    },
  ])
})

test('runAgent uses the RESTful agent completion endpoint', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ url: string; body: Record<string, unknown> }> = []

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(init?.body || '{}')) as Record<string, unknown>,
    })
    return new Response('data:{"event":"node_started"}\n\n')
  }) as typeof fetch

  try {
    await agentAPI.runAgent({
      id: 'agent-1',
      query: 'hello',
      session_id: 'session-1',
      inputs: { city: '杭州' },
      files: [],
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(calls.length, 1)
  assert.equal(
    calls[0]?.url,
    'http://localhost:8000/api/v1/agents/chat/completions',
  )
  assert.equal(calls[0]?.body.agent_id, 'agent-1')
  assert.equal(calls[0]?.body.query, 'hello')
  assert.equal(calls[0]?.body.session_id, 'session-1')
})

test('runAgentSession uses the consolidated RESTful completion endpoint', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ url: string; body: Record<string, unknown> }> = []

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(init?.body || '{}')) as Record<string, unknown>,
    })
    return new Response('data:{"event":"message"}\n\n')
  }) as typeof fetch

  try {
    await agentAPI.runAgentSession({
      id: 'agent-1',
      query: 'hello',
      session_id: 'session-1',
      inputs: {},
      files: [],
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(
    calls[0]?.url,
    'http://localhost:8000/api/v1/agents/chat/completions',
  )
  assert.equal(calls[0]?.body.agent_id, 'agent-1')
  assert.equal(calls[0]?.body.session_id, 'session-1')
})

test('downloadFile sends only the file ID with authenticated ownership', async () => {
  const originalGet = apiClient.get
  const calls: Array<{
    endpoint: string
    params?: Record<string, unknown>
  }> = []

  apiClient.get = (async (
    endpoint: string,
    config?: { params?: Record<string, unknown> },
  ) => {
    calls.push({ endpoint, params: config?.params })
    return new Response()
  }) as typeof apiClient.get

  try {
    await agentAPI.downloadFile('file-1')
  } finally {
    apiClient.get = originalGet
  }

  assert.deepEqual(calls, [
    {
      endpoint: '/agents/download',
      params: { id: 'file-1' },
    },
  ])
})

test('agent webhooks use the consolidated RESTful endpoints', async () => {
  const originalFetch = globalThis.fetch
  const originalGet = apiClient.get
  const fetchCalls: string[] = []
  const getCalls: string[] = []

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    fetchCalls.push(String(url))
    return new Response()
  }) as typeof fetch
  apiClient.get = (async (endpoint: string) => {
    getCalls.push(endpoint)
    return { events: [] }
  }) as typeof apiClient.get

  try {
    await agentAPI.testWebhook({
      canvasId: 'agent-1',
      method: 'POST',
      query: {},
      headers: {},
      body: {},
      contentType: 'application/json',
    })
    await agentAPI.fetchWebhookTrace('agent-1')
  } finally {
    globalThis.fetch = originalFetch
    apiClient.get = originalGet
  }

  assert.deepEqual(fetchCalls, ['/api/v1/agents/agent-1/webhook/test'])
  assert.deepEqual(getCalls, ['/agents/agent-1/webhook/logs'])
})

test('agent tag APIs preserve tokens and REST envelopes through the domain client', async () => {
  const originalGet = apiClient.get
  const originalPut = apiClient.put
  const calls: unknown[] = []
  apiClient.get = (async (endpoint: string, config: unknown) => {
    calls.push({ endpoint, config })
    return []
  }) as typeof apiClient.get
  apiClient.put = (async (endpoint: string, body: unknown) => {
    calls.push({ endpoint, body })
    return true
  }) as typeof apiClient.put
  try {
    await agentAPI.listAgents({
      tags: ['ml', '100%'],
      owner_ids: ['owner'],
      page: 2,
      page_size: 12,
      keywords: 'search',
      canvas_category: 'agent_canvas',
      orderby: 'title',
      desc: false,
    })
    await agentAPI.listAgentTags('dataflow_canvas')
    await agentAPI.updateAgentTags('agent / id', ['one,two', ' ML '])
  } finally {
    apiClient.get = originalGet
    apiClient.put = originalPut
  }
  const list = calls[0] as { endpoint: string; config: { params: unknown } }
  assert.equal(list.endpoint, '/agents')
  assert.deepEqual(list.config.params, {
    tags: 'ml,100%',
    owner_ids: 'owner',
    page: 2,
    page_size: 12,
    keywords: 'search',
    canvas_category: 'agent_canvas',
    orderby: 'title',
    desc: false,
  })
  assert.equal((calls[1] as { endpoint: string }).endpoint, '/agents/tags')
  assert.deepEqual(
    (calls[1] as { config: { params: unknown } }).config.params,
    { canvas_category: 'dataflow_canvas' },
  )
  assert.deepEqual(calls[2], {
    endpoint: '/agents/agent%20%2F%20id/tags',
    body: { tags: ['one,two', ' ML '] },
  })
})

test('public single and multi upload use the beta header with local auth disabled', async () => {
  const originalUpload = apiClient.upload
  const originalRepeated = apiClient.uploadRepeated
  const calls: unknown[] = []
  apiClient.upload = (async (...args: unknown[]) => {
    calls.push(args)
    return { id: 'one' }
  }) as typeof apiClient.upload
  apiClient.uploadRepeated = (async (...args: unknown[]) => {
    calls.push(args)
    return [{ id: 'one' }, { id: 'two' }]
  }) as typeof apiClient.uploadRepeated
  const file = new File(['bytes'], 'test.txt')
  try {
    await agentAPI.uploadPublicFile('agent/1', file, 'public-beta')
    await agentAPI.uploadPublicFile('agent/1', [file, file], 'public-beta')
  } finally {
    apiClient.upload = originalUpload
    apiClient.uploadRepeated = originalRepeated
  }
  assert.deepEqual(calls, [
    [
      '/agents/agent%2F1/upload',
      file,
      undefined,
      {
        skipAuth: true,
        baseURL: '/api',
        headers: { Authorization: 'Bearer public-beta' },
      },
    ],
    [
      '/agents/agent%2F1/upload',
      'file',
      [file, file],
      undefined,
      {
        skipAuth: true,
        baseURL: '/api',
        headers: { Authorization: 'Bearer public-beta' },
      },
    ],
  ])
})

test('public progress upload supplies beta while debug upload uses the login token', async () => {
  const originalXHR = globalThis.XMLHttpRequest
  const originalStorage = globalThis.localStorage
  const requests: Array<{ url: string; headers: Record<string, string> }> = []
  class UploadRequest {
    status = 200
    responseText = '{"retcode":0,"data":{"id":"uploaded"}}'
    upload = { onprogress: undefined }
    onload?: () => void
    onerror?: () => void
    headers: Record<string, string> = {}
    open(_method: string, url: string) {
      requests.push({ url, headers: this.headers })
    }
    setRequestHeader(name: string, value: string) {
      this.headers[name] = value
    }
    send() {
      this.onload?.()
    }
  }
  Reflect.set(globalThis, 'XMLHttpRequest', UploadRequest)
  Reflect.set(globalThis, 'localStorage', { getItem: () => 'login-token' })
  try {
    assert.deepEqual(
      await agentAPI.uploadPublicCanvasFileWithProgress(
        'agent-1',
        new File(['x'], 'x'),
        'public-beta',
      ),
      { id: 'uploaded' },
    )
    await agentAPI.uploadCanvasFileWithProgress('agent-1', new File(['x'], 'x'))
  } finally {
    Reflect.set(globalThis, 'XMLHttpRequest', originalXHR)
    Reflect.set(globalThis, 'localStorage', originalStorage)
  }
  assert.equal(requests[0]?.url, '/api/v1/agents/agent-1/upload')
  assert.deepEqual(requests[0]?.headers, {
    Authorization: 'Bearer public-beta',
  })
  assert.deepEqual(requests[1]?.headers, {
    Authorization: 'Bearer login-token',
  })
})

test('public upload carries beta through the real multipart client', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ url: string; headers: Headers; body: FormData }> = []
  apiClient.setAuthToken('stored-login-must-not-win')
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      headers: new Headers(init?.headers),
      body: init?.body as FormData,
    })
    return new Response('{"retcode":0,"data":{"id":"uploaded"}}', {
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch
  try {
    await agentAPI.uploadPublicFile(
      'agent-1',
      new File(['one'], 'one.txt'),
      'beta-upload',
    )
    await agentAPI.uploadPublicFile(
      'agent-1',
      [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')],
      'beta-upload',
    )
    assert.deepEqual(
      calls.map((call) => call.headers.get('authorization')),
      ['Bearer beta-upload', 'Bearer beta-upload'],
    )
    assert.deepEqual(
      calls.map((call) => call.url),
      ['/api/v1/agents/agent-1/upload', '/api/v1/agents/agent-1/upload'],
    )
    assert.deepEqual(
      calls.map((call) => call.body.getAll('file').length),
      [1, 2],
    )
    assert(calls.every((call) => !call.headers.has('content-type')))
  } finally {
    globalThis.fetch = originalFetch
    apiClient.setAuthToken(null)
  }
})

test('setAgent forwards classification labels without changing execution category', async () => {
  const originalPut = apiClient.put
  const calls: Record<string, unknown>[] = []
  apiClient.put = (async (_endpoint: string, data: Record<string, unknown>) => {
    calls.push(data)
    return { id: 'agent' }
  }) as typeof apiClient.put
  try {
    await agentAPI.setAgent({
      id: 'agent',
      title: 'Tagged',
      canvas_type: 'Support',
    })
    await agentAPI.setAgent({ id: 'agent', title: 'Clear', canvas_type: '' })
    await agentAPI.setAgent({ id: 'agent', title: 'Preserve' })
    await agentAPI.setAgent({
      id: 'agent',
      title: 'Pipeline',
      canvas_type: 'Support',
      canvas_category: AgentCanvasCategory.INGESTION,
    })
    assert.equal(calls[0].canvas_type, 'Support')
    assert.equal('canvas_category' in calls[0], false)
    assert.equal(calls[1].canvas_type, '')
    assert.equal('canvas_category' in calls[1], false)
    assert.equal('canvas_type' in calls[2], false)
    assert.equal(calls[3].canvas_category, AgentCanvasCategory.INGESTION)
  } finally {
    apiClient.put = originalPut
  }
})

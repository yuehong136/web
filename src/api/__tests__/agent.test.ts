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
    'http://localhost:8000/api/v1/agents/chat/completion',
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
    'http://localhost:8000/api/v1/agents/chat/completion',
  )
  assert.equal(calls[0]?.body.agent_id, 'agent-1')
  assert.equal(calls[0]?.body.session_id, 'session-1')
})

test('downloadFile maps the RESTful file ownership query', async () => {
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
    await agentAPI.downloadFile('file-1', 'tenant-1')
  } finally {
    apiClient.get = originalGet
  }

  assert.deepEqual(calls, [
    {
      endpoint: '/agents/download',
      params: { id: 'file-1', created_by: 'tenant-1' },
    },
  ])
})

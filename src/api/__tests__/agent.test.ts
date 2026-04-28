import assert from 'node:assert/strict'
import test from 'node:test'
import { agentAPI } from '../agent'
import { apiClient } from '../client'
import {
  AgentCanvasCategory,
  AgentCanvasType,
} from '@/types/agent'

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
  assert.equal(calls[0]?.endpoint, '/v1/canvas/set')
  assert.equal(
    (calls[0]?.data as Record<string, unknown>).canvas_category,
    AgentCanvasCategory.INGESTION,
  )
})

test('setAgent does not backfill agent_canvas during graph-only updates', async () => {
  const originalPost = apiClient.post
  const calls: Array<{ endpoint: string; data: unknown }> = []

  apiClient.post = (async (endpoint: string, data?: unknown) => {
    calls.push({ endpoint, data })
    return { id: 'pipeline-1' }
  }) as typeof apiClient.post

  try {
    await agentAPI.setAgent({
      id: 'pipeline-1',
      title: 'Pipeline',
      dsl: { graph: { nodes: [], edges: [] } },
    })
  } finally {
    apiClient.post = originalPost
  }

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.endpoint, '/v1/canvas/set')
  assert.equal(
    'canvas_category' in ((calls[0]?.data as Record<string, unknown>) || {}),
    false,
  )
})

test('runAgent uses RAGFlow editor runtime canvas completion endpoint', async () => {
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
  assert.equal(calls[0]?.url, 'http://localhost:8000/v1/canvas/completion')
  assert.equal(calls[0]?.body.id, 'agent-1')
  assert.equal(calls[0]?.body.query, 'hello')
  assert.equal(calls[0]?.body.session_id, 'session-1')
})

test('runAgentSession keeps explore session completion endpoint isolated', async () => {
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
    'http://localhost:8000/v1/canvas/agent-1/completion',
  )
  assert.equal('id' in (calls[0]?.body || {}), false)
  assert.equal(calls[0]?.body.session_id, 'session-1')
})

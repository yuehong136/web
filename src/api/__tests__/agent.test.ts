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

import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasCategory, AgentCanvasType } from '@/types/agent'
import {
  buildAgentCanvasPath,
  downloadFlowJson,
  isPipelineFlow,
  resolveCanvasCategory,
  resolveCanvasKind,
} from '../agent'

test('isPipelineFlow matches ragflow dataflow_canvas category', () => {
  assert.equal(
    isPipelineFlow({
      canvas_type: null,
      canvas_category: AgentCanvasCategory.INGESTION,
    }),
    true,
  )

  assert.equal(
    isPipelineFlow({
      canvas_type: AgentCanvasType.AGENT,
      canvas_category: AgentCanvasCategory.AGENT,
    }),
    false,
  )
})

test('buildAgentCanvasPath appends dataflow query for pipeline flows', () => {
  assert.equal(
    buildAgentCanvasPath('pipe-1', {
      canvas_type: null,
      canvas_category: AgentCanvasCategory.INGESTION,
    }),
    '/agent/pipe-1?category=dataflow_canvas',
  )

  assert.equal(
    buildAgentCanvasPath('agent-1', {
      canvas_type: AgentCanvasType.AGENT,
      canvas_category: AgentCanvasCategory.AGENT,
    }),
    '/agent/agent-1',
  )
})

test('resolveCanvasCategory returns ragflow backend values', () => {
  assert.equal(
    resolveCanvasCategory(AgentCanvasType.PIPELINE),
    AgentCanvasCategory.INGESTION,
  )
  assert.equal(
    resolveCanvasCategory(AgentCanvasType.AGENT),
    AgentCanvasCategory.AGENT,
  )
})

test('resolveCanvasKind normalizes route and backend category values', () => {
  assert.equal(
    resolveCanvasKind(AgentCanvasCategory.INGESTION),
    AgentCanvasType.PIPELINE,
  )
  assert.equal(
    resolveCanvasKind({
      canvas_type: null,
      canvas_category: AgentCanvasCategory.AGENT,
    }),
    AgentCanvasType.AGENT,
  )
})

test('downloadFlowJson exports a round-trippable agent json payload', async () => {
  let capturedBlob: Blob | undefined
  let capturedDownload = ''
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalDocument = globalThis.document

  URL.createObjectURL = ((blob: Blob) => {
    capturedBlob = blob
    return 'blob:agent-export'
  }) as typeof URL.createObjectURL
  URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
  globalThis.document = {
    createElement: () => ({
      href: '',
      click: () => undefined,
      set download(value: string) {
        capturedDownload = value
      },
      get download() {
        return capturedDownload
      },
    }),
    body: {
      appendChild: () => undefined,
      removeChild: () => undefined,
    },
  } as unknown as Document

  try {
    downloadFlowJson({
      id: 'agent-1234567890',
      title: 'Sales Agent',
      description: 'Handles leads',
      canvas_type: AgentCanvasType.AGENT,
      canvas_category: AgentCanvasCategory.AGENT,
      avatar: 'avatar',
      dsl: {
        graph: { nodes: [], edges: [] },
        components: {},
        history: [],
        messages: [],
        reference: [],
        globals: {},
        retrieval: [],
      },
      update_time: 0,
      create_time: 0,
      user_id: 'u1',
      permission: 'me',
    })
  } finally {
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    globalThis.document = originalDocument
  }

  assert.equal(capturedDownload, 'agent-sales-agent-agent-12.json')
  const exported = JSON.parse(await capturedBlob!.text())
  assert.deepEqual(Object.keys(exported).sort(), [
    'avatar',
    'canvas_category',
    'canvas_type',
    'description',
    'dsl',
    'exportedAt',
    'schemaVersion',
    'title',
  ])
  assert.deepEqual(exported.dsl.graph, { nodes: [], edges: [] })
  assert.deepEqual(exported.dsl.components, {})
})

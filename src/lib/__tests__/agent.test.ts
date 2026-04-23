import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AgentCanvasCategory,
  AgentCanvasType,
} from '@/types/agent'
import {
  buildAgentCanvasPath,
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

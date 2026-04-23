import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasCategory, AgentCanvasType } from '@/types/agent'
import { Operator } from '../../constant'
import { adaptAgentFlow } from '../flow'
import { adaptAgentPublishSummary } from '../publish'
import { adaptAgentSessionList } from '../session'
import { adaptAgentShareSummary } from '../share'
import { adaptAgentTraceItems } from '../trace'
import { adaptAgentVersionSummaries } from '../version'
import { adaptAgentWebhookSummary } from '../webhook'

test('adaptAgentFlow parses dsl strings and normalizes graph', () => {
  const flow = adaptAgentFlow({
    id: 'flow-1',
    title: 'Demo',
    description: '',
    canvas_type: AgentCanvasType.AGENT,
    create_time: 1,
    update_time: 1,
    user_id: 'u1',
    permission: 'write',
    dsl: JSON.stringify({
      components: {
        begin: {
          obj: {
            component_name: Operator.Begin,
            params: { mode: 'conversational' },
          },
          downstream: [],
          upstream: [],
        },
      },
      history: [],
      messages: [],
      reference: [],
      globals: {},
      retrieval: [],
    }),
  })

  assert.equal(flow.dsl.graph?.nodes.length, 1)
  assert.equal(flow.dsl.graph?.nodes[0]?.data.label, Operator.Begin)
})

test('adaptAgentFlow treats dataflow_canvas as pipeline even without canvas_type', () => {
  const flow = adaptAgentFlow({
    id: 'flow-pipeline',
    title: 'Pipeline',
    description: '',
    canvas_type: null,
    canvas_category: AgentCanvasCategory.INGESTION,
    create_time: 1,
    update_time: 1,
    user_id: 'u1',
    permission: 'write',
    dsl: {
      components: {},
      history: [],
      graph: { nodes: [], edges: [] },
      messages: [],
      reference: [],
      globals: {},
      variables: {},
      retrieval: [],
    },
  })

  assert.equal(flow.dsl.graph?.nodes[0]?.data.label, Operator.File)
})

test('session and trace adapters normalize consumable structures', () => {
  const sessions = adaptAgentSessionList([
    {
      id: 's1',
      messages: [{ role: 'user', content: 'hi' }],
    },
  ])
  const traces = adaptAgentTraceItems([
    {
      component_id: 'END',
      component_name: 'END',
      status: 'done',
      trace: [{ message: '{"ok":true}' }],
    },
  ])

  assert.equal(sessions.total, 1)
  assert.equal(sessions.sessions[0]?.message_count, 1)
  assert.equal(Array.isArray(traces[0]?.trace), true)
})

test('version, share, publish, and webhook adapters expose stable summaries', () => {
  const versions = adaptAgentVersionSummaries([
    { version_id: 'v1', description: 'first', id: '' },
  ])
  const share = adaptAgentShareSummary({
    title: 'Share Demo',
    inputs: {
      query: {
        type: 'string',
        required: true,
      },
    },
  })
  const publish = adaptAgentPublishSummary({
    id: 'flow-1',
    title: 'Demo',
    description: '',
    canvas_type: AgentCanvasType.AGENT,
    create_time: 1,
    update_time: 1,
    user_id: 'u1',
    permission: 'write',
    release: true,
    last_publish_time: 99,
    dsl: {
      components: {},
      history: [],
      graph: { nodes: [], edges: [] },
      messages: [],
      reference: [],
      globals: {},
      variables: {},
      retrieval: [],
    },
  })
  const webhook = adaptAgentWebhookSummary(
    {
      id: 'flow-1',
      title: 'Demo',
      description: '',
      canvas_type: AgentCanvasType.AGENT,
      create_time: 1,
      update_time: 1,
      user_id: 'u1',
      permission: 'write',
      dsl: {
        components: {},
        history: [],
        graph: { nodes: [], edges: [] },
        messages: [],
        reference: [],
        globals: {},
        variables: {},
        retrieval: [],
      },
    },
    'https://example.com/webhook',
  )

  assert.equal(versions[0]?.id, 'v1')
  assert.equal(share.inputs.query?.label, 'query')
  assert.equal(publish.isPublished, true)
  assert.equal(webhook.status, 'active')
})

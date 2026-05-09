import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasCategory, AgentCanvasType } from '@/types/agent'
import { buildAgentSessionListQuery } from '@/api/agent'
import { Operator } from '../../constant'
import {
  buildAgentEmbedCode,
  buildAgentSharePath,
  buildAgentWidgetSharePath,
  parseAgentShareAccess,
} from '../../share/access'
import {
  buildInitialShareValues,
  buildShareInputsPayload,
} from '../../share/utils'
import { adaptAgentFlow } from '../flow'
import { adaptAgentPublishSummary } from '../publish'
import {
  adaptAgentSessionList,
  buildSessionErrorSummary,
  extractLatestSessionOutput,
  extractSessionLatestMessageId,
  extractSessionStatus,
  extractSessionTitle,
} from '../session'
import { adaptAgentShareSummary } from '../share'
import {
  adaptAgentTraceItems,
  buildTraceDebugBundle,
  buildTraceRunViewModel,
  buildTraceSpansFromRuntimeEvents,
  buildTraceSpansFromTraceItems,
  extractTraceErrorMessage,
  extractTraceIssues,
  extractTraceToolCalls,
} from '../trace'
import { adaptAgentVersionSummaries } from '../version'
import { adaptAgentWebhookSummary, adaptAgentWebhookTrace } from '../webhook'

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

test('session adapter accepts ragflow message alias and preserves real assistant message ids', () => {
  const sessions = adaptAgentSessionList([
    {
      id: 's1',
      message: [
        { role: 'user', content: 'hi' },
        { id: 'message-real-1', role: 'assistant', content: 'hello' },
      ],
    },
  ])

  assert.equal(sessions.sessions[0]?.messages?.length, 2)
  assert.equal(
    extractSessionLatestMessageId(sessions.sessions[0]),
    'message-real-1',
  )
})

test('agent session list query keeps supported backend filters explicit', () => {
  assert.deepEqual(
    buildAgentSessionListQuery({
      page: 2,
      page_size: 24,
      keywords: 'demo',
      from_date: '2026-04-01',
      to_date: '2026-04-27',
      orderby: 'update_time',
      desc: false,
      exp_user_id: 'external-user',
    }),
    {
      page: 2,
      page_size: 24,
      keywords: 'demo',
      from_date: '2026-04-01',
      to_date: '2026-04-27',
      orderby: 'update_time',
      desc: false,
      exp_user_id: 'external-user',
    },
  )
})

test('trace adapter treats non-array trace responses as empty lists like ragflow', () => {
  assert.deepEqual(adaptAgentTraceItems(undefined), [])
  assert.deepEqual(adaptAgentTraceItems({}), [])
  assert.deepEqual(adaptAgentTraceItems({ data: {} }), [])
  assert.equal(
    adaptAgentTraceItems({
      data: [
        {
          component_id: 'agent',
          component_name: 'Agent',
          status: 'done',
        },
      ],
    })[0]?.component_id,
    'agent',
  )
})

test('trace view model builds node spans from ragflow style trace items', () => {
  const traceItems = adaptAgentTraceItems([
    {
      component_id: 'agent_0',
      component_name: 'Agent',
      status: 'success',
      elapsed_time: 1.25,
      inputs: { query: 'hello' },
      outputs: { answer: 'world' },
      trace: [],
    },
  ])
  const spans = buildTraceSpansFromTraceItems(traceItems)

  assert.equal(spans.length, 1)
  assert.equal(spans[0]?.componentId, 'agent_0')
  assert.equal(spans[0]?.name, 'Agent')
  assert.equal(spans[0]?.kind, 'llm')
  assert.equal(spans[0]?.status, 'success')
  assert.equal(spans[0]?.duration, 1.25)
  assert.deepEqual(spans[0]?.input, { query: 'hello' })
})

test('trace view model attaches tool calls from trace rows to node spans', () => {
  const traceItems = adaptAgentTraceItems([
    {
      component_id: 'agent_0',
      component_name: 'Agent',
      status: 'success',
      trace: [
        {
          tool_name: 'tavily_search',
          path: 'Agent-->Search',
          arguments: { query: 'ragflow' },
          result: '{"items":[1]}',
          elapsed_time: 2.5,
        },
      ],
    },
  ])
  const spans = buildTraceSpansFromTraceItems(traceItems)
  const toolCalls = extractTraceToolCalls(traceItems)
  const toolSpan = spans[0]?.children[0]

  assert.equal(toolCalls.length, 1)
  assert.equal(toolSpan?.kind, 'tool')
  assert.equal(toolSpan?.parentId, spans[0]?.id)
  assert.equal(toolSpan?.name, 'tavily_search')
  assert.deepEqual(toolSpan?.input, { query: 'ragflow' })
  assert.deepEqual(toolSpan?.output, { items: [1] })
  assert.equal(toolSpan?.duration, 2.5)
})

test('trace view model builds running success and error spans from runtime events', () => {
  const spans = buildTraceSpansFromRuntimeEvents([
    {
      event: 'node_started',
      data: {
        component_id: 'agent_0',
        component_name: 'Agent',
        component_type: 'Agent',
      },
    },
    {
      event: 'node_finished',
      data: {
        component_id: 'retrieval_0',
        component_name: 'Retrieval',
        component_type: 'Retrieval',
        elapsed_time: 0.75,
        outputs: { docs: 2 },
      },
    },
    {
      event: 'error',
      message: 'runtime failed',
      data: {
        component_id: 'tool_0',
        component_name: 'Tool',
        component_type: 'Tool',
      },
    },
  ])

  assert.equal(
    spans.find((span) => span.componentId === 'agent_0')?.status,
    'running',
  )
  assert.equal(
    spans.find((span) => span.componentId === 'retrieval_0')?.status,
    'success',
  )
  assert.equal(
    spans.find((span) => span.componentId === 'tool_0')?.status,
    'error',
  )
  assert.equal(
    spans.find((span) => span.componentId === 'tool_0')?.error,
    'runtime failed',
  )
})

test('trace view model classifies empty trace with message id as unavailable', () => {
  const evicted = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: [],
  })
  const backendEmpty = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: [],
    unavailableReason: 'backend-empty',
  })

  assert.equal(evicted.status, 'missing')
  assert.equal(evicted.unavailableReason, 'redis-evicted')
  assert.equal(backendEmpty.unavailableReason, 'backend-empty')
  assert.equal(backendEmpty.issues[0]?.severity, 'warning')
})

test('trace view model classifies missing message id as no-message-id', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    traceItems: [],
  })

  assert.equal(viewModel.status, 'missing')
  assert.equal(viewModel.unavailableReason, 'no-message-id')
  assert.match(viewModel.issues[0]?.message || '', /message id/)
})

test('trace view model extracts failed spans and issues from error traces', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'tool_0',
        component_name: 'Tool',
        status: 'failed',
        trace: [{ message: 'tool exploded' }],
      },
    ]),
  })
  const issues = extractTraceIssues(viewModel.spans)

  assert.equal(viewModel.status, 'error')
  assert.equal(viewModel.spans[0]?.status, 'error')
  assert.equal(viewModel.spans[0]?.error, 'tool exploded')
  assert.equal(issues[0]?.message, 'tool exploded')
})

test('trace debug bundle masks common sensitive fields', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'agent_0',
        component_name: 'Agent',
        status: 'success',
        inputs: {
          token: 'token-value',
          nested: { api_key: 'api-key-value' },
        },
        trace: [
          {
            tool_name: 'http_request',
            arguments: {
              authorization: 'Bearer secret-token',
              cookie: 'sid=secret-cookie',
            },
            result: { password: 'secret-password', ok: true },
          },
        ],
      },
    ]),
    raw: {
      secret: 'raw-secret',
    },
  })
  const bundle = buildTraceDebugBundle(viewModel)
  const serialized = JSON.stringify(bundle)

  assert.match(serialized, /\[MASKED\]/)
  assert.doesNotMatch(serialized, /token-value/)
  assert.doesNotMatch(serialized, /api-key-value/)
  assert.doesNotMatch(serialized, /secret-token/)
  assert.doesNotMatch(serialized, /secret-cookie/)
  assert.doesNotMatch(serialized, /secret-password/)
  assert.doesNotMatch(serialized, /raw-secret/)
})

test('trace view model duration summary identifies the slowest span', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'agent_0',
        component_name: 'Agent',
        status: 'success',
        elapsed_time: 1,
        trace: [
          {
            tool_name: 'slow_tool',
            elapsed_time: 3.5,
            arguments: {},
            result: {},
          },
        ],
      },
      {
        component_id: 'message_0',
        component_name: 'Message',
        status: 'success',
        elapsed_time: 0.5,
      },
    ]),
  })

  assert.equal(viewModel.summary.spanCount, 3)
  assert.equal(viewModel.summary.toolCallCount, 1)
  assert.equal(viewModel.summary.slowestSpan?.name, 'slow_tool')
  assert.equal(viewModel.summary.slowestSpan?.duration, 3.5)
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
  assert.equal(publish.lastPublishedAt, 99)
  assert.equal(webhook.status, 'active')
})

test('share access parser keeps canonical shared_id/auth contract', () => {
  const access = parseAgentShareAccess(
    new URLSearchParams(
      'id=agent-1&beta=beta-1&shared_id=canonical-agent&auth=canonical-beta&release=true&data_topic=demo',
    ),
  )
  const path = buildAgentSharePath({
    agentId: access.agentId,
    betaToken: access.betaToken,
    release: access.release,
  })

  assert.equal(access.agentId, 'canonical-agent')
  assert.equal(access.betaToken, 'canonical-beta')
  assert.equal(access.data.topic, 'demo')
  assert.equal(
    path,
    '/agent/share?shared_id=canonical-agent&from=agent&auth=canonical-beta&release=true',
  )
})

test('share access builders generate fullscreen and widget embed contracts', () => {
  const fullscreenPath = buildAgentSharePath({
    agentId: 'agent-1',
    betaToken: 'beta-1',
    release: true,
    visibleAvatar: true,
    locale: 'zh-CN',
    theme: 'light',
    userId: 'external-user',
  })
  const widgetPath = buildAgentWidgetSharePath({
    agentId: 'agent-1',
    betaToken: 'beta-1',
    release: true,
    visibleAvatar: true,
    locale: 'zh-CN',
    userId: 'external-user',
    mode: 'master',
    streaming: true,
  })

  assert.equal(
    fullscreenPath,
    '/agent/share?shared_id=agent-1&from=agent&auth=beta-1&release=true&userId=external-user&locale=zh-CN&visible_avatar=1&theme=light',
  )
  assert.equal(
    widgetPath,
    '/chats/widget?shared_id=agent-1&from=agent&auth=beta-1&release=true&userId=external-user&locale=zh-CN&visible_avatar=1&mode=master&streaming=true',
  )
})

test('share embed code switches between fullscreen iframe and widget script', () => {
  const fullscreen = buildAgentEmbedCode({
    embedType: 'fullscreen',
    agentId: 'agent-1',
    betaToken: 'beta-1',
    origin: 'https://example.test',
    theme: 'light',
  })
  const widget = buildAgentEmbedCode({
    embedType: 'widget',
    agentId: 'agent-1',
    betaToken: 'beta-1',
    origin: 'https://example.test',
    streaming: false,
  })

  assert.match(fullscreen, /src="https:\/\/example\.test\/agent\/share\?/)
  assert.match(fullscreen, /min-height:600px/)
  assert.match(widget, /src="https:\/\/example\.test\/chats\/widget\?/)
  assert.match(widget, /mode=master/)
  assert.match(widget, /streaming=false/)
  assert.match(widget, /CREATE_CHAT_WINDOW/)
  assert.match(widget, /TOGGLE_CHAT/)
})

test('share input utilities build values and completion payload', () => {
  const fields = adaptAgentShareSummary({
    inputs: {
      query: { type: 'line', required: true },
      category: {
        type: 'options',
        options: ['a', 'b'],
      },
      count: { type: 'integer' },
      enabled: { type: 'boolean' },
      docs: { type: 'file' },
    },
  }).inputs
  const values = buildInitialShareValues(fields, { query: 'hello' })
  const payload = buildShareInputsPayload(fields, {
    ...values,
    count: 3,
    enabled: true,
    docs: [{ id: 'file-1', name: 'demo.pdf' }],
  })

  assert.equal(values.query, 'hello')
  assert.equal(values.category, 'a')
  assert.equal(values.enabled, false)
  assert.equal(payload.count?.value, 3)
  assert.equal(payload.enabled?.value, true)
  assert.deepEqual(payload.docs?.value, [{ id: 'file-1', name: 'demo.pdf' }])
})

test('webhook trace adapter exposes status, input, output and errors', () => {
  const running = adaptAgentWebhookTrace({
    webhook_id: 'webhook-1',
    next_since_ts: 10,
    finished: false,
    events: [
      {
        event: 'node_finished',
        data: {
          component_id: 'begin',
          inputs: { query: 'hello' },
        },
      },
      {
        event: 'node_finished',
        data: {
          component_id: 'message_0',
          outputs: { answer: 'world' },
        },
      },
    ],
  })
  const failed = adaptAgentWebhookTrace({
    finished: true,
    events: [
      {
        event: 'error',
        message: 'boom',
      },
    ],
  })

  assert.equal(running.status, 'running')
  assert.equal(running.webhookId, 'webhook-1')
  assert.deepEqual(running.firstInput, { query: 'hello' })
  assert.deepEqual(running.latestOutput, { answer: 'world' })
  assert.equal(failed.status, 'error')
  assert.equal(failed.errorMessage, 'boom')
})

test('session extractors expose status, latest output and real message ids', () => {
  const empty = adaptAgentSessionList([{ id: 'empty', messages: [] }])
    .sessions[0]
  const errored = adaptAgentSessionList([
    {
      id: 'error-session',
      errors: 'model failed',
      outputs: { _answer: { ok: false } },
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: '', id: 'assistant-123' },
      ],
    },
  ]).sessions[0]
  const completed = adaptAgentSessionList([
    {
      id: 'done-session',
      messages: [
        { role: 'user', content: 'hi', id: 'user-1' },
        { role: 'assistant', content: 'answer', id: 'message-real-1' },
      ],
    },
  ]).sessions[0]

  assert.equal(extractSessionStatus(empty), 'unknown')
  assert.equal(extractSessionStatus(errored), 'error')
  assert.equal(extractSessionStatus(completed), 'success')
  assert.equal(extractSessionLatestMessageId(errored), undefined)
  assert.equal(extractSessionLatestMessageId(completed), 'message-real-1')
  assert.deepEqual(extractLatestSessionOutput(errored), {
    kind: 'json',
    value: { ok: false },
  })
  assert.deepEqual(extractLatestSessionOutput(completed), {
    kind: 'text',
    value: 'answer',
  })
})

test('trace error extraction walks failed child nodes for session summaries', () => {
  const trace = adaptAgentTraceItems([
    {
      component_id: 'agent',
      component_name: 'Agent',
      status: 'success',
      traces: [
        {
          component_id: 'tool',
          component_name: 'Tool',
          status: 'failed',
          message: 'tool failed',
        },
      ],
    },
  ])

  assert.equal(extractTraceErrorMessage(trace), 'tool failed')
  assert.equal(buildSessionErrorSummary({ id: 's1' }, trace), 'tool failed')
  assert.equal(
    buildSessionErrorSummary({ id: 's2', errors: 'session failed' }, trace),
    'session failed',
  )
})

test('extractSessionTitle falls back to first user message content', () => {
  assert.equal(
    extractSessionTitle({
      id: 's1',
      messages: [
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: '用户问题' },
      ],
    }),
    '用户问题',
  )
  assert.equal(extractSessionTitle({ id: 's2', name: '命名会话' }), '命名会话')
  assert.equal(extractSessionTitle({ id: 's3' }), '未命名会话')
})

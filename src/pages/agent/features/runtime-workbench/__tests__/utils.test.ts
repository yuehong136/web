import assert from 'node:assert/strict'
import test from 'node:test'
import { BeginQueryType } from '../../../constant'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
} from '../types'
import {
  buildRuntimeInputObject,
  buildRuntimeSummary,
  consumeRuntimeMessageChunk,
  formatRuntimeInputSummary,
  normalizeRuntimeAttachments,
  normalizeRuntimeEvent,
} from '../utils'
import { buildRuntimeThoughtChainNodes } from '../thought-chain-utils'
import { extractReferencesFromSSEData } from '@/utils/reference-replacer'

test('buildRuntimeInputObject preserves mixed begin-query field metadata', () => {
  const inputs = buildRuntimeInputObject([
    {
      key: 'question',
      name: '问题',
      type: BeginQueryType.Line,
      value: 'hello',
      optional: false,
    },
    {
      key: 'retry',
      name: '重试',
      type: BeginQueryType.Boolean,
      value: true as unknown as string,
      optional: true,
    },
    {
      key: 'limit',
      name: '数量',
      type: BeginQueryType.Integer,
      value: 3 as unknown as string,
      optional: false,
    },
    {
      key: 'attachment',
      name: '附件',
      type: BeginQueryType.File,
      value: [
        {
          id: 'file-1',
          name: 'report.pdf',
          type: 'pdf',
        },
      ] as unknown as string,
      optional: true,
    },
    {
      key: 'mode',
      name: '模式',
      type: BeginQueryType.Options,
      value: 'fast',
      optional: false,
      options: ['fast', 'safe'],
    },
  ])

  assert.deepEqual(Object.keys(inputs), [
    'question',
    'retry',
    'limit',
    'attachment',
    'mode',
  ])
  assert.equal(inputs.question?.value, 'hello')
  assert.equal(inputs.retry?.value, true)
  assert.equal(inputs.limit?.value, 3)
  assert.deepEqual(inputs.mode?.options, ['fast', 'safe'])
  assert.equal(
    (inputs.attachment?.value as unknown as Array<{ id: string }>)[0]?.id,
    'file-1',
  )
})

test('formatRuntimeInputSummary renders readable labels and values', () => {
  const summary = formatRuntimeInputSummary([
    {
      key: 'question',
      name: '问题',
      type: BeginQueryType.Line,
      value: 'hello',
      optional: false,
    },
    {
      key: 'attachment',
      name: '附件',
      type: BeginQueryType.File,
      value: [{ id: 'file-1', name: 'report.pdf' }] as unknown as string,
      optional: true,
    },
  ])

  assert.equal(summary, '问题: hello\n附件: report.pdf')
})

test('normalizeRuntimeAttachments handles upload payloads and scalar values', () => {
  const attachments = normalizeRuntimeAttachments([
    {
      id: 'file-1',
      name: 'report.pdf',
      extension: 'pdf',
      mime_type: 'application/pdf',
      preview_url: '/preview/report.pdf',
      size: 1024,
    },
    {
      filename: 'image.png',
      type: 'png',
      url: '/preview/image.png',
    },
    {
      doc_id: 'doc-1',
      file_name: 'ragflow-report.docx',
      format: 'docx',
    },
  ])

  assert.deepEqual(attachments, [
    {
      id: 'file-1',
      name: 'report.pdf',
      extension: 'pdf',
      mime_type: 'application/pdf',
      preview_url: '/preview/report.pdf',
      size: 1024,
      type: 'pdf',
      mimeType: 'application/pdf',
      url: '/preview/report.pdf',
    },
    {
      filename: 'image.png',
      type: 'png',
      url: '/preview/image.png',
      name: 'image.png',
      mimeType: undefined,
      size: undefined,
    },
    {
      doc_id: 'doc-1',
      file_name: 'ragflow-report.docx',
      format: 'docx',
      name: 'ragflow-report.docx',
      type: 'docx',
      mimeType: undefined,
      size: undefined,
      url: undefined,
    },
  ])
})

test('normalizeRuntimeEvent extracts ids, log events, and runtime errors', () => {
  const logEvent = normalizeRuntimeEvent({
    event: 'node_finished',
    message_id: 'message-1',
    task_id: 'task-1',
    session_id: 'session-1',
    data: {
      component_id: 'generate_0',
      outputs: { answer: 'done' },
    },
    retcode: 0,
  })

  assert.equal(logEvent.event, 'node_finished')
  assert.equal(logEvent.messageId, 'message-1')
  assert.equal(logEvent.taskId, 'task-1')
  assert.equal(logEvent.sessionId, 'session-1')
  assert.equal(logEvent.outputContent, 'done')
  assert.deepEqual(logEvent.logEvent, {
    event: 'node_finished',
    message_id: 'message-1',
    task_id: 'task-1',
    data: {
      component_id: 'generate_0',
      outputs: { answer: 'done' },
    },
  })

  const errorEvent = normalizeRuntimeEvent({
    event: 'workflow_finished',
    message_id: 'message-1',
    code: 500,
    retmsg: 'runtime failed',
    data: {},
  })

  assert.equal(errorEvent.errorMessage, 'runtime failed')

  const wrappedEvent = normalizeRuntimeEvent({
    event: 'node_finished',
    message_id: 'message-2',
    data: {
      data: {
        component_id: 'agent_1',
        outputs: { content: 'fallback answer' },
      },
    },
  })

  assert.equal(wrappedEvent.outputContent, 'fallback answer')
  assert.deepEqual(wrappedEvent.logEvent?.data, {
    component_id: 'agent_1',
    outputs: { content: 'fallback answer' },
  })
})

test('consumeRuntimeMessageChunk keeps main content and thinking content separate', () => {
  const first = consumeRuntimeMessageChunk(undefined, {
    content: 'Answer: ',
  })
  const second = consumeRuntimeMessageChunk(first.nextState, {
    start_to_think: true,
    content: 'reason about tools',
  })
  const third = consumeRuntimeMessageChunk(second.nextState, {
    end_to_think: true,
  })
  const fourth = consumeRuntimeMessageChunk(third.nextState, {
    content: 'done',
    final: true,
  })

  assert.equal(first.nextState.content, 'Answer: ')
  assert.equal(second.nextState.content, 'Answer:')
  assert.equal(second.nextState.thinking, 'reason about tools')
  assert.equal(fourth.nextState.content, 'Answer: done')
  assert.equal(fourth.nextState.thinking, 'reason about tools')
  assert.equal(fourth.isFinal, true)
})

test('buildRuntimeThoughtChainNodes maps SSE node events to chain status', () => {
  const runningNodes = buildRuntimeThoughtChainNodes(
    [
      {
        event: 'node_started',
        data: {
          component_id: 'begin',
          component_name: 'Begin',
          component_type: 'Begin',
          inputs: { query: 'hello' },
        },
      },
      {
        event: 'node_finished',
        data: {
          component_id: 'begin',
          component_name: 'Begin',
          component_type: 'Begin',
          elapsed_time: 0.12,
          outputs: { query: 'hello' },
        },
      },
      {
        event: 'node_started',
        data: {
          component_id: 'generate_1',
          component_name: 'Generate',
          component_type: 'Generate',
          inputs: { prompt: 'hello' },
        },
      },
    ],
    true,
  )

  assert.equal(runningNodes.length, 2)
  assert.equal(runningNodes[0]?.status, 'success')
  assert.equal(runningNodes[0]?.elapsedTime, 0.12)
  assert.deepEqual(runningNodes[0]?.outputs, { query: 'hello' })
  assert.equal(runningNodes[1]?.status, 'loading')
  assert.equal(runningNodes[1]?.blink, true)
  assert.equal(runningNodes[1]?.actionKind, 'action')
  assert.equal(runningNodes[1]?.actionLabel, 'Agent Action')

  const toolNodes = buildRuntimeThoughtChainNodes([
    {
      event: 'node_finished',
      data: {
        component_id: 'retrieval_1',
        component_name: 'Knowledge Query',
        component_type: 'Retrieval',
        outputs: { chunks: ['doc-a'] },
      },
    },
  ])

  assert.equal(toolNodes[0]?.actionKind, 'tool')
  assert.equal(toolNodes[0]?.actionLabel, 'Tool Call')

  const failedNodes = buildRuntimeThoughtChainNodes(
    [
      {
        event: 'node_finished',
        data: {
          component_id: 'generate_1',
          component_name: 'Generate',
          component_type: 'Generate',
          outputs: { _ERROR: 'model unavailable' },
        },
      },
    ],
    false,
  )

  assert.equal(failedNodes[0]?.status, 'error')
  assert.equal(failedNodes[0]?.error, 'model unavailable')
})

test('extractReferencesFromSSEData preserves object chunk reference ids', () => {
  const references = extractReferencesFromSSEData({
    reference: {
      chunks: {
        '290': {
          id: 'chunk-290',
          content: 'OpenClaw summary',
          document_id: 'doc-1',
          document_name: 'lesson.docx',
          dataset_id: 'dataset-1',
        },
        '2': {
          id: 'chunk-2',
          content: 'Xiaomi agent',
          document_id: 'doc-1',
          document_name: 'lesson.docx',
          dataset_id: 'dataset-1',
        },
      },
    },
  })

  assert.deepEqual(
    references.map((chunk) => chunk.reference_index),
    [2, 290],
  )
  assert.equal(references[0]?.id, 'chunk-2')
  assert.equal(references[1]?.id, 'chunk-290')
})

test('buildRuntimeSummary keeps the public runtime rail shape stable', () => {
  const summary = buildRuntimeSummary({
    status: AgentRuntimeStatus.SUCCESS,
    currentView: RuntimeWorkbenchView.LOG,
    messageCount: 3,
    hasLogs: true,
    lastRunAt: 123,
    lastMessageId: 'message-1',
    lastTaskId: 'task-1',
    lastError: undefined,
  })

  assert.deepEqual(summary, {
    status: AgentRuntimeStatus.SUCCESS,
    currentView: RuntimeWorkbenchView.LOG,
    messageCount: 3,
    hasLogs: true,
    lastRunAt: 123,
    lastMessageId: 'message-1',
    lastTaskId: 'task-1',
    lastError: undefined,
  })
})

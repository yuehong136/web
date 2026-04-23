import assert from 'node:assert/strict'
import test from 'node:test'
import type { AgentTraceItem } from '@/types/agent'
import {
  PipelineRuntimeStatus,
  PipelineWorkbenchView,
} from '../types'
import {
  buildPipelineInputObject,
  buildPipelineSummary,
  buildPipelineResultPath,
  extractMessageIdFromChunk,
  findFirstPipelineRunFile,
  findLastFailureMessage,
  findPipelineEndOutput,
  isPipelineCompleted,
  isPipelineEndOutputEmpty,
} from '../utils'

const baseTrace = (
  partial: Partial<AgentTraceItem>,
): AgentTraceItem => ({
  component_id: '',
  component_name: '',
  status: 'unknown',
  ...partial,
})

test('isPipelineCompleted is false until END node carries trace messages', () => {
  assert.equal(isPipelineCompleted(undefined), false)
  assert.equal(isPipelineCompleted([]), false)
  assert.equal(
    isPipelineCompleted([
      baseTrace({ component_id: 'parser_0', status: 'success' }),
      baseTrace({ component_id: 'END', trace: [{ message: '' }] }),
    ]),
    false,
  )

  assert.equal(
    isPipelineCompleted([
      baseTrace({ component_id: 'parser_0', status: 'success' }),
      baseTrace({
        component_id: 'END',
        trace: [{ message: '{"chunks":[1,2]}' }],
      }),
    ]),
    true,
  )
})

test('findPipelineEndOutput parses END trace JSON message and falls back to raw', () => {
  assert.equal(findPipelineEndOutput(undefined), undefined)

  const parsed = findPipelineEndOutput([
    baseTrace({
      component_id: 'END',
      trace: [{ message: '{"chunks":[1,2]}' }],
    }),
  ])
  assert.deepEqual(parsed, { chunks: [1, 2] })

  const fallback = findPipelineEndOutput([
    baseTrace({
      component_id: 'END',
      trace: [{ message: 'plain text result' }],
    }),
  ])
  assert.equal(fallback, 'plain text result')
})

test('isPipelineEndOutputEmpty is true when no END message is present', () => {
  assert.equal(isPipelineEndOutputEmpty(undefined), true)
  assert.equal(isPipelineEndOutputEmpty([]), true)
  assert.equal(
    isPipelineEndOutputEmpty([baseTrace({ component_id: 'END', trace: [] })]),
    true,
  )
  assert.equal(
    isPipelineEndOutputEmpty([
      baseTrace({
        component_id: 'END',
        trace: [{ message: '{"a":1}' }],
      }),
    ]),
    false,
  )
})

test('findLastFailureMessage extracts the latest failure for the error rail', () => {
  assert.equal(findLastFailureMessage(undefined), undefined)
  assert.equal(
    findLastFailureMessage([
      baseTrace({ component_id: 'parser_0', status: 'success' }),
    ]),
    undefined,
  )
  assert.equal(
    findLastFailureMessage([
      baseTrace({
        component_id: 'splitter_0',
        status: 'fail',
        message: 'split error',
      }),
      baseTrace({
        component_id: 'extractor_0',
        status: 'failed',
        trace: [{ message: 'extractor failed' }],
      }),
    ]),
    'extractor failed',
  )
})

test('extractMessageIdFromChunk reads message_id from first SSE-like chunk', () => {
  assert.equal(extractMessageIdFromChunk(undefined), undefined)
  assert.equal(extractMessageIdFromChunk(''), undefined)
  assert.equal(
    extractMessageIdFromChunk(JSON.stringify({ data: { message_id: 'm-1' } })),
    'm-1',
  )
  assert.equal(
    extractMessageIdFromChunk(JSON.stringify({ message_id: 'top-level' })),
    'top-level',
  )
  assert.equal(extractMessageIdFromChunk('not-json'), undefined)
})

test('buildPipelineInputObject keeps non-key fields and drops missing keys', () => {
  const result = buildPipelineInputObject([
    {
      key: 'doc',
      type: 'file',
      name: '文档',
      value: [{ id: 'file-1' }] as unknown,
    },
    {
      type: 'file',
      name: '无 key 字段',
      value: 'should be skipped',
    } as Record<string, unknown>,
  ])

  assert.deepEqual(Object.keys(result), ['doc'])
  assert.deepEqual(result.doc, {
    type: 'file',
    name: '文档',
    value: [{ id: 'file-1' }],
  })
})

test('buildPipelineSummary keeps the rail snapshot shape stable', () => {
  const summary = buildPipelineSummary({
    status: PipelineRuntimeStatus.SUCCESS,
    currentView: PipelineWorkbenchView.OUTPUT,
    messageCount: 4,
    hasLogs: true,
    outputAvailable: true,
    lastRunAt: 999,
    lastMessageId: 'message-1',
    lastTaskId: 'task-1',
    lastError: undefined,
    uploadedFile: { id: 'doc-1', name: 'sample.pdf' },
    resultPath: '/dataflow-result?id=message-1',
  })

  assert.deepEqual(summary, {
    status: PipelineRuntimeStatus.SUCCESS,
    currentView: PipelineWorkbenchView.OUTPUT,
    messageCount: 4,
    hasLogs: true,
    outputAvailable: true,
    lastRunAt: 999,
    lastMessageId: 'message-1',
    lastTaskId: 'task-1',
    lastError: undefined,
    uploadedFile: { id: 'doc-1', name: 'sample.pdf' },
    resultPath: '/dataflow-result?id=message-1',
  })
})

test('findFirstPipelineRunFile extracts the first uploaded file payload', () => {
  assert.equal(findFirstPipelineRunFile([]), undefined)
  assert.deepEqual(
    findFirstPipelineRunFile([
      { key: 'note', value: 'hello' },
      {
        key: 'doc',
        value: [{ id: 'doc-1', name: 'sample.pdf', extension: 'pdf' }],
      },
    ]),
    { id: 'doc-1', name: 'sample.pdf', extension: 'pdf' },
  )
})

test('buildPipelineResultPath keeps the ragflow-compatible result query shape', () => {
  assert.equal(
    buildPipelineResultPath({
      agentId: 'agent-1',
      messageId: 'message-1',
      file: undefined,
    }),
    undefined,
  )

  assert.equal(
    buildPipelineResultPath({
      agentId: 'agent-1',
      agentTitle: 'Ingestion Pipeline',
      messageId: 'message-1',
      file: {
        id: 'doc-1',
        name: 'sample.pdf',
        extension: 'pdf',
        created_by: 'user-1',
      },
    }),
    '/dataflow-result?id=message-1&agent_id=agent-1&doc_id=doc-1&type=dataflow&is_read_only=true&agent_title=Ingestion+Pipeline&created_by=user-1&extension=pdf',
  )
})

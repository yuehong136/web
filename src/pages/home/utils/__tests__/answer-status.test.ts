import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError } from '@/api/client-types'
import {
  createInitialAgentTimelineState,
  createInitialStreamingAnswerState,
  type AgentTimelineNode,
} from '@/lib/streaming'
import type { ChatMessage } from '../../types'
import {
  answerVerdict,
  classifyAnswerError,
  resolveAnswerKind,
  settleAnswerMessage,
  timelineVerdict,
  unresolvedStreamEnd,
  withoutErrorNodes,
} from '../answer-status'

const node = (
  id: string,
  kind: AgentTimelineNode['kind'],
  status: AgentTimelineNode['status'],
): AgentTimelineNode => ({ id, kind, title: id, status })

const answer = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'answer',
  role: 'assistant',
  content: '',
  timestamp: '',
  ...overrides,
})

test('classifyAnswerError reads only the HTTP status, stable code and error type', () => {
  const cases: Array<[unknown, string]> = [
    [
      new APIError(401, 'HTTP_ERROR', 'token sk-secret expired'),
      'unauthorized',
    ],
    [new APIError(200, '401', 'Unauthorized'), 'unauthorized'],
    [new APIError(401, 'UNAUTHORIZED', 'x'), 'unauthorized'],
    [new APIError(429, 'HTTP_ERROR', 'quota'), 'rate_limited'],
    [new APIError(408, 'TIMEOUT', 'x'), 'timeout'],
    [new APIError(504, 'HTTP_ERROR', 'x'), 'timeout'],
    [new APIError(500, '500', 'Traceback ...'), 'server_error'],
    [new APIError(502, 'HTTP_ERROR', 'x'), 'server_error'],
    [new APIError(503, 'HTTP_ERROR', 'x'), 'server_error'],
    [new APIError(0, 'NETWORK_ERROR', 'x'), 'network'],
    [new APIError(200, '102', 'Conversation not found!'), 'failed'],
    [new APIError(403, 'HTTP_ERROR', 'x'), 'failed'],
    [new TypeError('Failed to fetch'), 'network'],
    [new DOMException('network error', 'NetworkError'), 'network'],
    [new DOMException('aborted by the browser', 'AbortError'), 'network'],
    [new DOMException('signal timed out', 'TimeoutError'), 'timeout'],
    [new SyntaxError('Unexpected token'), 'failed'],
    [new Error('upstream secret'), 'failed'],
    [undefined, 'failed'],
  ]

  for (const [error, kind] of cases) {
    assert.equal(classifyAnswerError(error), kind, String(error))
  }
})

test('only the completion frame completes an app answer; failure is business', () => {
  const streaming = createInitialStreamingAnswerState()

  assert.equal(answerVerdict(streaming), null)
  assert.equal(answerVerdict({ ...streaming, phase: 'completed' }), 'completed')
  assert.equal(
    answerVerdict({
      ...streaming,
      phase: 'failed',
      failure: { kind: 'error_frame', code: 500 },
    }),
    'business',
  )
})

test('an MCP error event is a business failure even when completion follows', () => {
  const initial = createInitialAgentTimelineState()
  const withError = {
    ...initial,
    nodes: [
      node('tool-1', 'tool', 'success'),
      node('error-2', 'error', 'error'),
    ],
  }

  assert.equal(timelineVerdict(initial), null)
  assert.equal(timelineVerdict({ ...initial, final: true }), 'completed')
  assert.equal(timelineVerdict(withError), 'business')
  assert.equal(timelineVerdict({ ...withError, final: true }), 'business')
})

test('a verdict from the stream wins over how the connection ended', () => {
  assert.equal(unresolvedStreamEnd({ reason: 'eof' }), 'unconfirmed')
  assert.equal(unresolvedStreamEnd({ reason: 'aborted' }), 'stopped')

  assert.equal(resolveAnswerKind(null, 'network'), 'network')
  assert.equal(resolveAnswerKind('business', 'stopped'), 'business')
  assert.equal(resolveAnswerKind('completed', 'network'), null)
  assert.equal(resolveAnswerKind('completed', 'stopped'), null)
})

test('settling keeps the answer, records the kind and stops unfinished steps', () => {
  const reference = {
    id: 'chunk-1',
    content: '原文',
    document_id: 'doc-1',
    document_name: '制度.pdf',
    dataset_id: 'kb-1',
  }
  const settled = settleAnswerMessage(
    answer({
      content: '部分正文',
      isStreaming: true,
      references: [reference],
      timelineNodes: [
        node('tool-1', 'tool', 'success'),
        node('tool-2', 'tool', 'loading'),
      ],
    }),
    'network',
  )

  assert.equal(settled.content, '部分正文')
  assert.deepEqual(settled.references, [reference])
  assert.deepEqual(settled.status, { kind: 'network', partial: true })
  assert.equal(settled.isStreaming, false)
  assert.deepEqual(
    settled.timelineNodes?.map((item) => item.status),
    ['success', 'abort'],
  )
})

test('settling marks partial only when something was received', () => {
  assert.deepEqual(
    settleAnswerMessage(answer({ timelineNodes: [] }), 'unauthorized').status,
    { kind: 'unauthorized', partial: false },
  )
  assert.equal(
    settleAnswerMessage(answer({ thinking: '思考' }), 'stopped').status
      ?.partial,
    true,
  )
  assert.equal(
    settleAnswerMessage(
      answer({ timelineNodes: [node('analysis', 'system', 'loading')] }),
      'unconfirmed',
    ).status?.partial,
    true,
  )
})

test('a completed answer gets no status and keeps its steps as they are', () => {
  const steps = [node('tool-1', 'tool', 'loading')]
  const settled = settleAnswerMessage(
    answer({ content: '完整回答', isStreaming: true, timelineNodes: steps }),
    null,
  )

  assert.equal(settled.status, undefined)
  assert.equal(settled.isStreaming, false)
  assert.equal(settled.timelineNodes, steps)
})

test('error nodes, which carry backend text, are not shown', () => {
  const nodes = [
    node('reasoning-1', 'reasoning', 'success'),
    node('error-2', 'error', 'error'),
    node('tool-3', 'tool', 'error'),
  ]

  assert.deepEqual(
    withoutErrorNodes(nodes).map((item) => item.id),
    ['reasoning-1', 'tool-3'],
  )
})

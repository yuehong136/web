import test from 'node:test'
import assert from 'node:assert/strict'
import {
  consumeAgentTimelineEvent,
  createInitialAgentTimelineState,
} from '../agent-timeline'
import { normalizeAgentSSEPayload } from '../agent-timeline-events'
import type { AgentStreamEvent, AgentTimelineState } from '../agent-timeline'

const consume = (events: AgentStreamEvent[]) => {
  return events.reduce<AgentTimelineState>(
    (state, event) => consumeAgentTimelineEvent(state, event),
    createInitialAgentTimelineState(),
  )
}

test('keeps multi-round reasoning and tool events in order', () => {
  const state = consume([
    { kind: 'think_start' },
    { kind: 'text', content: 'reasoning 1' },
    { kind: 'think_end' },
    {
      kind: 'tool_call',
      toolName: 'search',
      arguments: { query: 'agent timeline' },
      callId: 'call_1',
    },
    {
      kind: 'tool_result',
      toolName: 'search',
      result: 'found docs',
      callId: 'call_1',
      success: true,
    },
    { kind: 'think_start' },
    { kind: 'text', content: 'reasoning 2' },
    { kind: 'think_end' },
    { kind: 'text', content: 'final answer' },
  ])

  assert.deepEqual(
    state.nodes.map((node) => node.kind),
    ['tool', 'reasoning'],
  )
  assert.equal(
    (state.nodes[0].content as Record<string, unknown>).reasoning,
    'reasoning 1',
  )
  assert.equal(state.nodes[0].status, 'success')
  assert.equal(state.nodes[1].content, 'reasoning 2')
  assert.equal(state.answer, 'final answer')
})

test('tool call closes active reasoning and stores it inside the tool node', () => {
  const state = consume([
    { kind: 'think_start' },
    { kind: 'text', content: 'need to lookup trains' },
    {
      kind: 'tool_call',
      toolName: 'query_trains',
      arguments: { from: 'Nanjing South', to: 'Hangzhou East' },
      callId: 'call_1',
    },
    { kind: 'text', content: 'normal answer text' },
  ])

  assert.equal(state.nodes.length, 1)
  assert.equal(state.nodes[0].kind, 'tool')
  assert.equal(
    (state.nodes[0].content as Record<string, unknown>).reasoning,
    'need to lookup trains',
  )
  assert.equal(state.inReasoning, false)
  assert.equal(state.answer, 'normal answer text')
})

test('splits stray think tags into separate reasoning blocks', () => {
  const state = consume([
    { kind: 'text', content: '<think>first <think>second</think>answer' },
  ])

  assert.deepEqual(
    state.nodes.map((node) => node.kind),
    ['reasoning', 'reasoning'],
  )
  assert.equal(state.nodes[0].content, 'first ')
  assert.equal(state.nodes[0].status, 'success')
  assert.equal(state.nodes[1].content, 'second')
  assert.equal(state.answer, 'answer')
})

test('merges tool result into matching call id', () => {
  const state = consume([
    {
      kind: 'tool_call',
      toolName: 'lookup',
      arguments: { id: 1 },
      callId: 'call_1',
    },
    {
      kind: 'tool_result',
      toolName: 'lookup',
      result: { ok: true },
      callId: 'call_1',
      success: true,
    },
  ])

  assert.equal(state.nodes.length, 1)
  assert.equal(state.nodes[0].status, 'success')
  assert.deepEqual((state.nodes[0].content as Record<string, unknown>).result, {
    ok: true,
  })
})

test('keeps tool call loading when result is missing', () => {
  const state = consume([
    {
      kind: 'tool_call',
      toolName: 'lookup',
      arguments: { id: 1 },
      callId: 'call_1',
    },
    { kind: 'tool_end', totalCalls: 1 },
  ])

  assert.equal(state.nodes[0].status, 'loading')
})

test('complete closes an active reasoning block', () => {
  const state = consume([
    { kind: 'think_start' },
    { kind: 'text', content: 'still thinking' },
    { kind: 'complete' },
  ])

  assert.equal(state.nodes[0].status, 'success')
  assert.equal(state.inReasoning, false)
  assert.equal(state.final, true)
})

test('complete recovers answer text trapped in trailing reasoning', () => {
  const state = consume([
    { kind: 'think_start' },
    { kind: 'text', content: 'reasoning details\n\nfinal answer' },
    { kind: 'complete' },
  ])

  assert.equal(state.nodes[0].content, 'reasoning details')
  assert.equal(state.answer, 'final answer')
})

test('normalizes wrapped structured SSE payloads', () => {
  const events = normalizeAgentSSEPayload({
    retcode: 0,
    retmsg: '',
    data: {
      type: 'tool_call',
      content: {
        tool_name: 'search',
        arguments: { query: 'x' },
        call_id: 'call_1',
      },
    },
  })

  assert.deepEqual(events, [
    {
      kind: 'tool_call',
      toolName: 'search',
      arguments: { query: 'x' },
      callId: 'call_1',
    },
  ])
})

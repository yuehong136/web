import assert from 'node:assert/strict'
import test from 'node:test'
import { streamStructuredChat } from '@/components/chat/structured-chat-stream'
import {
  consumeStructuredChatChunk,
  createInitialStructuredChatState,
  finalizeStructuredChatState,
  getRunPhaseNotice,
  transitionRunPhase,
  type StructuredChatState,
} from '../index'
import {
  encodeSSE,
  fixtureResponse,
  structuredChatFixtures,
} from './fixtures/structured-chat'

const runFixture = async (events: readonly unknown[]) => {
  const original = globalThis.fetch
  globalThis.fetch = async () => fixtureResponse(events)
  const messages: string[] = []
  const states: StructuredChatState[] = []
  try {
    const state = await streamStructuredChat({
      url: 'http://fixture.invalid/stream',
      requestBody: {},
      onMessage: (message) => messages.push(message.type),
      onState: (next) => states.push(next),
    })
    return { state, messages, states }
  } finally {
    globalThis.fetch = original
  }
}

test('backend structured chat fixture completes only at the server terminal frame', async () => {
  const { state, messages } = await runFixture(structuredChatFixtures.completed)
  assert.equal(state.phase, 'completed')
  assert.equal(state.accumulatedText, 'Complete answer')
  assert.equal(state.toolCalls[0].status, 'success')
  assert.equal(state.toolCalls[0].result, 0)
  assert.equal(messages.filter((type) => type === 'complete').length, 1)
})

test('clean EOF without a terminal frame keeps partial output as interrupted', async () => {
  const { state, messages } = await runFixture(structuredChatFixtures.partial)
  assert.equal(state.phase, 'interrupted')
  assert.equal(state.accumulatedText, 'Partial answer')
  assert.equal(state.completeSeen, false)
  assert.deepEqual(messages, ['text'])
})

test('an error followed by completion and late text remains failed with the partial result', async () => {
  const { state, messages } = await runFixture([
    ...structuredChatFixtures.failed,
    { retcode: 0, data: true },
    { retcode: 0, data: { type: 'text', content: 'late success' } },
  ])
  assert.equal(state.phase, 'failed')
  assert.equal(state.accumulatedText, 'Partial answer')
  assert.deepEqual(messages, ['text', 'error'])
  assert.equal(getRunPhaseNotice(state.phase), 'chat.stream.failed')
})

test('duplicate and conflicting terminal frames never emit another completion or change content', async () => {
  const { state, messages } = await runFixture([
    ...structuredChatFixtures.completed,
    { retcode: 0, data: true },
    { retcode: 102, data: '', retmsg: 'late error' },
    { type: 'text', content: 'late content' },
  ])
  assert.equal(state.phase, 'completed')
  assert.equal(state.accumulatedText, 'Complete answer')
  assert.equal(messages.filter((type) => type === 'complete').length, 1)
  assert.equal(messages.includes('error'), false)
})

test('user stop during a pending read cancels only local reception and keeps partial content', async () => {
  const original = globalThis.fetch
  let streamCancelled = false
  const response = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(encodeSSE(structuredChatFixtures.partial)),
        )
      },
      cancel() {
        streamCancelled = true
      },
    }),
    { headers: { 'content-type': 'text/event-stream' } },
  )
  globalThis.fetch = async () => response
  const owner = new AbortController()
  try {
    const state = await streamStructuredChat({
      url: 'http://fixture.invalid/stream',
      requestBody: {},
      signal: owner.signal,
      onMessage: (message) => {
        if (message.type === 'text') owner.abort()
      },
    })
    assert.equal(state.phase, 'locallyStopped')
    assert.equal(state.accumulatedText, 'Partial answer')
    assert.equal(state.completeSeen, false)
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(streamCancelled, true)
  } finally {
    globalThis.fetch = original
  }
})

test('a broken connection publishes interrupted state before propagating its error', async () => {
  const original = globalThis.fetch
  let streamController!: ReadableStreamDefaultController<Uint8Array>
  const response = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller
      },
    }),
    {
      headers: { 'content-type': 'text/event-stream' },
    },
  )
  globalThis.fetch = async () => response
  let latest: StructuredChatState | undefined
  try {
    const pending = streamStructuredChat({
      url: 'http://fixture.invalid/stream',
      requestBody: {},
      onMessage: () => streamController.error(new Error('disconnected')),
      onState: (state) => {
        latest = state
      },
    })
    streamController.enqueue(
      new TextEncoder().encode(encodeSSE(structuredChatFixtures.partial)),
    )
    await assert.rejects(pending)
    assert.equal(latest?.phase, 'interrupted')
    assert.equal(latest?.accumulatedText, 'Partial answer')
  } finally {
    globalThis.fetch = original
  }
})

test('cancel acknowledgement remains pending until an explicit run.cancelled event', () => {
  const initial = createInitialStructuredChatState()
  const acknowledged = {
    ...initial,
    phase: transitionRunPhase(initial.phase, 'cancelRequested'),
  }
  assert.equal(acknowledged.phase, 'cancelRequested')
  const final = consumeStructuredChatChunk(acknowledged, {
    // Event type from api/run_platform/events.py; HTTP data:true is not this event.
    type: 'run.cancelled',
    payload: {},
    run_id: 'fixture-run',
    seq: 3,
  })
  assert.equal(final.nextState.phase, 'serverCancelled')
  assert.equal(
    finalizeStructuredChatState(final.nextState, 'aborted'),
    final.nextState,
  )
  assert.equal(transitionRunPhase('cancelRequested', 'completed'), 'completed')
  assert.equal(
    transitionRunPhase('locallyStopped', 'serverCancelled'),
    'locallyStopped',
  )
})

test('tool completion cannot be fabricated by tool_end, run completion or duplicate call frames', async () => {
  const events = structuredChatFixtures.completed.filter(
    (event) =>
      typeof event.data !== 'object' || event.data.type !== 'tool_result',
  )
  const { state } = await runFixture(events)
  assert.equal(state.phase, 'completed')
  assert.equal(state.toolCalls[0].status, 'running')
  assert.equal(state.toolCalls[0].result, undefined)
  let reduced = createInitialStructuredChatState()
  for (const event of structuredChatFixtures.completed.slice(0, 3))
    reduced = consumeStructuredChatChunk(reduced, event).nextState
  const replayed = consumeStructuredChatChunk(
    reduced,
    structuredChatFixtures.completed[1],
  )
  assert.equal(replayed.nextState.toolCalls[0].status, 'success')
  assert.equal(replayed.nextState.toolCalls[0].result, 0)
})

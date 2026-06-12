import assert from 'node:assert/strict'
import test from 'node:test'
import {
  consumeStructuredChatChunk,
  createInitialStructuredChatState,
  createSyntheticCompleteMessage,
} from '../structured-chat-reducer'

test('structured text merges accumulated and delta payloads', () => {
  const first = consumeStructuredChatChunk(createInitialStructuredChatState(), {
    retcode: 0,
    data: { type: 'text', content: 'Hello' },
  })
  assert.equal(first.message?.type, 'text')
  assert.equal(first.nextState.accumulatedText, 'Hello')

  // Accumulated-text backend: payload repeats the prefix, replace not append.
  const second = consumeStructuredChatChunk(first.nextState, {
    retcode: 0,
    data: { type: 'text', content: 'Hello world' },
  })
  assert.equal(second.nextState.accumulatedText, 'Hello world')

  // Delta-text backend: payload is an increment, append.
  const third = consumeStructuredChatChunk(second.nextState, {
    retcode: 0,
    data: { type: 'text', content: ' again' },
  })
  assert.equal(third.nextState.accumulatedText, 'Hello world again')

  // Identical content produces no message.
  const fourth = consumeStructuredChatChunk(third.nextState, {
    retcode: 0,
    data: { type: 'text', content: 'Hello world again' },
  })
  assert.equal(fourth.message, null)
  assert.equal(fourth.nextState.accumulatedText, 'Hello world again')
})

test('root-level think markers inject tags exactly once', () => {
  const opened = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    { retcode: 0, data: '', start_to_think: true },
  )
  assert.equal(opened.message?.type, 'text')
  assert.equal(opened.nextState.accumulatedText, '<think>')

  // Re-opening while a think block is open must not duplicate the tag.
  const reopened = consumeStructuredChatChunk(opened.nextState, {
    retcode: 0,
    data: 'reasoning',
    start_to_think: true,
  })
  assert.equal(reopened.nextState.accumulatedText, '<think>reasoning')

  const closed = consumeStructuredChatChunk(reopened.nextState, {
    retcode: 0,
    data: '',
    end_to_think: true,
  })
  assert.equal(closed.nextState.accumulatedText, '<think>reasoning</think>')

  // Closing without an open tag is a no-op and emits nothing.
  const closedAgain = consumeStructuredChatChunk(closed.nextState, {
    retcode: 0,
    data: '',
    end_to_think: true,
  })
  assert.equal(closedAgain.message, null)
  assert.equal(
    closedAgain.nextState.accumulatedText,
    '<think>reasoning</think>',
  )
})

test('legacy tool_call tags are parsed, stripped, and deduplicated', () => {
  const payload =
    'before <tool_call>{"name":"search","args":{"q":"x"},"result":"ok"}</tool_call> after'
  const first = consumeStructuredChatChunk(createInitialStructuredChatState(), {
    retcode: 0,
    data: payload,
  })
  assert.equal(first.nextState.toolCalls.length, 1)
  assert.equal(first.nextState.toolCalls[0].name, 'search')
  assert.equal(first.nextState.toolCalls[0].status, 'success')
  assert.equal(first.nextState.accumulatedText, 'before  after')

  // Legacy streams repeat cumulative payloads; same signature keeps one
  // entry and the original id.
  const firstId = first.nextState.toolCalls[0].id
  const second = consumeStructuredChatChunk(first.nextState, {
    retcode: 0,
    data: payload,
  })
  assert.equal(second.nextState.toolCalls.length, 1)
  assert.equal(second.nextState.toolCalls[0].id, firstId)

  // An explicit 'Begin to call...' result marks the call as still running;
  // a missing result falls back to the same text but reads as success
  // (original parser quirk, preserved).
  const running = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    {
      retcode: 0,
      data: '<tool_call>{"name":"fetch","args":{},"result":"Begin to call..."}</tool_call>',
    },
  )
  assert.equal(running.nextState.toolCalls[0].status, 'running')
  assert.equal(running.nextState.toolCalls[0].result, 'Begin to call...')

  const noResult = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    {
      retcode: 0,
      data: '<tool_call>{"name":"fetch","args":{}}</tool_call>',
    },
  )
  assert.equal(noResult.nextState.toolCalls[0].status, 'success')
  assert.equal(noResult.nextState.toolCalls[0].result, 'Begin to call...')
})

test('wrapped answer object goes through the legacy text path', () => {
  const result = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    { retcode: 0, data: { answer: 'hi' } },
  )
  assert.equal(result.message?.type, 'text')
  assert.equal(result.nextState.accumulatedText, 'hi')
})

test('non-zero retcode produces an error message', () => {
  const result = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    { retcode: 102, retmsg: 'model unavailable', data: '' },
  )
  assert.deepEqual(result.message, {
    type: 'error',
    content: { error: 'model unavailable', code: 102 },
  })

  const fallback = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    { retcode: 1, data: '' },
  )
  assert.equal(
    (fallback.message?.content as { error: string }).error,
    'Unknown error',
  )
})

test('structured tool_call and tool_result drive the lifecycle by call_id', () => {
  const called = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    {
      retcode: 0,
      data: {
        type: 'tool_call',
        content: { tool_name: 'lookup', arguments: { id: 1 }, call_id: 'c1' },
      },
    },
  )
  assert.equal(called.message?.type, 'tool_call')
  assert.equal(called.nextState.toolCalls.length, 1)
  assert.equal(called.nextState.toolCalls[0].status, 'running')

  const succeeded = consumeStructuredChatChunk(called.nextState, {
    retcode: 0,
    data: {
      type: 'tool_result',
      content: {
        tool_name: 'lookup',
        call_id: 'c1',
        result: 42,
        success: true,
      },
    },
  })
  assert.equal(succeeded.nextState.toolCalls[0].status, 'success')
  assert.equal(succeeded.nextState.toolCalls[0].result, 42)

  // Failed result: error text wins over result, status flips to error.
  const failed = consumeStructuredChatChunk(called.nextState, {
    retcode: 0,
    data: {
      type: 'tool_result',
      content: {
        tool_name: 'lookup',
        call_id: 'c1',
        result: 'ignored',
        success: false,
        error: 'boom',
      },
    },
  })
  assert.equal(failed.nextState.toolCalls[0].status, 'error')
  assert.equal(failed.nextState.toolCalls[0].result, 'boom')

  // Unknown call_id is a no-op.
  const unknown = consumeStructuredChatChunk(called.nextState, {
    retcode: 0,
    data: {
      type: 'tool_result',
      content: { tool_name: 'lookup', call_id: 'nope', success: true },
    },
  })
  assert.equal(unknown.nextState.toolCalls[0].status, 'running')
})

test('tool_start and tool_end toggle isToolAnalyzing', () => {
  const started = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    { retcode: 0, data: { type: 'tool_start', content: 'analyzing' } },
  )
  assert.equal(started.nextState.isToolAnalyzing, true)

  const ended = consumeStructuredChatChunk(started.nextState, {
    retcode: 0,
    data: { type: 'tool_end', content: { total_calls: 1 } },
  })
  assert.equal(ended.nextState.isToolAnalyzing, false)
})

test('metadata frames merge into state and reach the complete frame', () => {
  const withMeta = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    { type: 'metadata', content: { token_count: 7 } },
  )
  assert.equal(withMeta.message?.type, 'metadata')
  assert.deepEqual(withMeta.nextState.metadata, { token_count: 7 })

  const complete = consumeStructuredChatChunk(withMeta.nextState, {
    retcode: 0,
    data: true,
  })
  assert.equal(complete.message?.type, 'complete')
  assert.deepEqual(complete.message?.metadata, { token_count: 7 })
  assert.equal(complete.nextState.completeSeen, true)
})

test('synthetic complete fires only when the server never completed', () => {
  const streamed = consumeStructuredChatChunk(
    createInitialStructuredChatState(),
    { retcode: 0, data: 'partial' },
  )
  const synthetic = createSyntheticCompleteMessage(streamed.nextState)
  assert.equal(synthetic?.type, 'complete')
  assert.equal(synthetic?.content, true)

  const completed = consumeStructuredChatChunk(streamed.nextState, {
    retcode: 0,
    data: true,
  })
  assert.equal(createSyntheticCompleteMessage(completed.nextState), null)
})

test('reducer never mutates the previous state', () => {
  const initial = createInitialStructuredChatState()
  const first = consumeStructuredChatChunk(initial, {
    retcode: 0,
    data: {
      type: 'tool_call',
      content: { tool_name: 'lookup', arguments: {}, call_id: 'c1' },
    },
  })
  assert.equal(initial.toolCalls.length, 0)
  assert.equal(initial.toolCallById.size, 0)

  consumeStructuredChatChunk(first.nextState, {
    retcode: 0,
    data: {
      type: 'tool_result',
      content: { tool_name: 'lookup', call_id: 'c1', success: true },
    },
  })
  assert.equal(first.nextState.toolCalls[0].status, 'running')
})

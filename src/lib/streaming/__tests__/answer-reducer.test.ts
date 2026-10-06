import assert from 'node:assert/strict'
import test from 'node:test'
import {
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  finalizeStreamingAnswerState,
  getStreamingAnswerFailureNotice,
  type StreamingAnswerState,
} from '../answer-reducer'

const consumeAll = (
  chunks: unknown[],
  state: StreamingAnswerState = createInitialStreamingAnswerState(),
) =>
  chunks.reduce<StreamingAnswerState>(
    (current, chunk) => consumeStreamingAnswerChunk(current, chunk).nextState,
    state,
  )

test('consumeStreamingAnswerChunk keeps closed thinking separate from answer', () => {
  const first = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    {
      data: {
        answer: 'Answer: ',
      },
      retcode: 0,
    },
  )
  const second = consumeStreamingAnswerChunk(first.nextState, {
    data: {
      start_to_think: true,
      answer: 'reasoning',
    },
    retcode: 0,
  })
  const third = consumeStreamingAnswerChunk(second.nextState, {
    data: {
      end_to_think: true,
    },
    retcode: 0,
  })
  const fourth = consumeStreamingAnswerChunk(third.nextState, {
    data: {
      answer: ' done',
    },
    retcode: 0,
  })

  assert.equal(fourth.nextState.content, 'Answer:  done')
  assert.equal(fourth.nextState.thinking, 'reasoning')
  assert.equal(fourth.isFinal, false)
})

test('consumeStreamingAnswerChunk replaces deltas with the final answer that carries inserted citations', () => {
  const streamed = consumeAll([
    { retcode: 0, data: { answer: '根据文档，', final: false } },
    { retcode: 0, data: { answer: '答案是 42。', final: false } },
  ])
  const final = consumeStreamingAnswerChunk(streamed, {
    retcode: 0,
    data: {
      answer: '根据文档，答案是 42 [ID:0]。',
      reference: { chunks: [{ id: 'chunk-0' }] },
      final: true,
    },
  })

  assert.equal(streamed.content, '根据文档，答案是 42。')
  assert.equal(final.nextState.content, '根据文档，答案是 42 [ID:0]。')
  assert.equal(final.nextState.fullAnswer, '根据文档，答案是 42 [ID:0]。')
  assert.equal(final.isFinal, true)
})

test('consumeStreamingAnswerChunk keeps closed reasoning that the final answer omits', () => {
  const state = consumeAll([
    { retcode: 0, data: { answer: '', start_to_think: true } },
    { retcode: 0, data: { answer: '先检索' } },
    { retcode: 0, data: { answer: '', end_to_think: true } },
    { retcode: 0, data: { answer: '结论' } },
    { retcode: 0, data: { answer: '结论 ##0$$', final: true } },
  ])

  assert.equal(state.content, '结论 ##0$$')
  assert.equal(state.thinking, '先检索')
})

test('consumeStreamingAnswerChunk takes reasoning from a final answer that carries its own think block', () => {
  const state = consumeAll([
    { retcode: 0, data: { answer: '', start_to_think: true } },
    { retcode: 0, data: { answer: 'step' } },
    { retcode: 0, data: { answer: '', end_to_think: true } },
    { retcode: 0, data: { answer: 'visible' } },
    {
      retcode: 0,
      data: { answer: '<think>step</think>visible [ID:1]', final: true },
    },
  ])

  assert.equal(state.content, 'visible [ID:1]')
  assert.equal(state.thinking, 'step')
})

test('consumeStreamingAnswerChunk keeps the backend merge when reasoning never closed', () => {
  const state = consumeAll([
    { retcode: 0, data: { answer: '', start_to_think: true } },
    { retcode: 0, data: { answer: '想法和答案' } },
    { retcode: 0, data: { answer: '想法和答案 [ID:0]', final: true } },
  ])

  assert.equal(state.content, '想法和答案 [ID:0]')
  assert.equal(state.thinking, '')
})

test('consumeStreamingAnswerChunk treats answer on end_to_think frame as main content', () => {
  const thinkingChunk = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    {
      data: {
        start_to_think: true,
        answer: 'reasoning',
      },
      retcode: 0,
    },
  )
  const answerChunk = consumeStreamingAnswerChunk(thinkingChunk.nextState, {
    data: {
      end_to_think: true,
      answer: '最终回答',
      final: true,
    },
    retcode: 0,
  })

  assert.equal(answerChunk.nextState.content, '最终回答')
  assert.equal(answerChunk.nextState.thinking, 'reasoning')
  assert.equal(answerChunk.isFinal, true)
})

test('finalizeStreamingAnswerState splits unclosed thinking with double-newline answer', () => {
  const thinkingChunk = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    {
      data: {
        start_to_think: true,
        answer: '先判断用户意图。\n\n你好，可以这样回复。',
      },
      retcode: 0,
    },
  )
  const doneChunk = consumeStreamingAnswerChunk(thinkingChunk.nextState, {
    data: true,
    retcode: 0,
  })
  const finalized = finalizeStreamingAnswerState(doneChunk.nextState)

  assert.equal(finalized.content, '你好，可以这样回复。')
  assert.equal(finalized.thinking, '先判断用户意图。')
})

test('finalizeStreamingAnswerState preserves unclosed thinking when no answer boundary exists', () => {
  const thinkingChunk = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    {
      data: {
        start_to_think: true,
        answer: '仍在思考',
      },
      retcode: 0,
    },
  )
  const finalized = finalizeStreamingAnswerState(thinkingChunk.nextState)

  assert.equal(finalized.content, '')
  assert.equal(finalized.thinking, '仍在思考')
})

test('finalizeStreamingAnswerState preserves normal answer content', () => {
  const answerChunk = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    {
      data: {
        answer: '直接答案',
        final: true,
      },
      retcode: 0,
    },
  )
  const finalized = finalizeStreamingAnswerState(answerChunk.nextState)

  assert.equal(finalized.content, '直接答案')
  assert.equal(finalized.thinking, '')
})

test('consumeStreamingAnswerChunk completes on the data===true terminal frame', () => {
  const seeded = consumeAll([{ retcode: 0, data: { answer: '完整回答' } }])
  const result = consumeStreamingAnswerChunk(seeded, { retcode: 0, data: true })

  assert.equal(result.isDone, true)
  assert.equal(result.isFinal, true)
  assert.equal(result.nextState.phase, 'completed')
  assert.equal(result.nextState.content, '完整回答')
  assert.equal(result.nextState.failure, null)
})

test('consumeStreamingAnswerChunk keeps partial content and fails on a non-zero retcode', () => {
  const seeded = consumeAll([{ retcode: 0, data: { answer: '部分内容' } }])
  const onError = consumeStreamingAnswerChunk(seeded, {
    retcode: 500,
    retmsg: 'boom: upstream secret',
    data: { answer: '**ERROR**: boom: upstream secret', reference: [] },
  })

  assert.equal(onError.nextState.content, '部分内容')
  assert.equal(onError.nextState.phase, 'failed')
  assert.deepEqual(onError.nextState.failure, {
    kind: 'error_frame',
    code: 500,
  })
  assert.doesNotMatch(JSON.stringify(onError.nextState), /upstream secret/)
  assert.equal(onError.isDone, false)
  assert.equal(onError.isFinal, false)
})

test('consumeStreamingAnswerChunk honors the alternate code error field', () => {
  const seeded = consumeAll([{ code: 0, data: { answer: 'ok' } }])
  const onError = consumeStreamingAnswerChunk(seeded, {
    code: 500,
    data: { answer: '应被忽略' },
  })

  assert.equal(seeded.content, 'ok')
  assert.equal(onError.nextState.content, 'ok')
  assert.deepEqual(onError.nextState.failure, {
    kind: 'error_frame',
    code: 500,
  })
})

test('consumeStreamingAnswerChunk stays failed through the trailing terminal frame', () => {
  const failed = consumeAll([
    { retcode: 0, data: { answer: '部分' } },
    { retcode: 500, data: { answer: '**ERROR**: boom' } },
  ])
  const done = consumeStreamingAnswerChunk(failed, { retcode: 0, data: true })

  assert.equal(done.isDone, true)
  assert.equal(done.nextState, failed)
  assert.equal(done.nextState.phase, 'failed')
})

test('consumeStreamingAnswerChunk ignores frames that arrive after a terminal state', () => {
  const failed = consumeAll([
    { retcode: 0, data: { answer: '部分' } },
    { retcode: 500, data: {} },
  ])
  const completed = consumeAll([
    { retcode: 0, data: { answer: '完整' } },
    { retcode: 0, data: true },
  ])

  for (const state of [failed, completed]) {
    const late = consumeStreamingAnswerChunk(state, {
      retcode: 0,
      data: { answer: '晚到内容', final: true },
    })
    assert.equal(late.nextState, state)
    assert.equal(late.isDone, false)
    assert.equal(late.isFinal, false)
  }
})

test('consumeStreamingAnswerChunk fails on a coded model error and hides its upstream text', () => {
  const state = consumeAll([
    { retcode: 0, data: { answer: '已生成的一段' } },
    {
      retcode: 0,
      data: { answer: '**ERROR**: QUOTA_EXCEEDED - key sk-123 over quota' },
    },
  ])

  assert.equal(state.content, '已生成的一段')
  assert.doesNotMatch(`${state.content}${state.thinking}`, /sk-123/)
  assert.equal(state.phase, 'failed')
  assert.deepEqual(state.failure, {
    kind: 'model_error',
    code: 'QUOTA_EXCEEDED',
  })
})

test('consumeStreamingAnswerChunk fails on a reply that opens with the error sentinel', () => {
  const state = consumeAll([
    {
      retcode: 0,
      data: { answer: '\n**ERROR**: Empty response from reasoning model' },
    },
  ])

  assert.equal(state.content, '')
  assert.deepEqual(state.failure, { kind: 'model_error', code: null })
})

test('consumeStreamingAnswerChunk fails on a model error raised inside reasoning', () => {
  const state = consumeAll([
    { retcode: 0, data: { answer: '', start_to_think: true } },
    { retcode: 0, data: { answer: '分析中' } },
    { retcode: 0, data: { answer: '**ERROR**: TIMEOUT - upstream' } },
  ])

  assert.equal(state.thinking, '分析中')
  assert.equal(state.content, '')
  assert.deepEqual(state.failure, { kind: 'model_error', code: 'TIMEOUT' })
})

test('consumeStreamingAnswerChunk keeps an error sentinel quoted inside an answer', () => {
  const state = consumeAll([
    {
      retcode: 0,
      data: { answer: '日志中出现 **ERROR**: disk full 表示磁盘已满。' },
    },
  ])

  assert.equal(state.content, '日志中出现 **ERROR**: disk full 表示磁盘已满。')
  assert.equal(state.phase, 'streaming')
})

test('consumeStreamingAnswerChunk keeps error text when detection is disabled', () => {
  const result = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    { retcode: 0, data: { answer: '**ERROR**: MODEL_ERROR - boom' } },
    { detectErrorText: false },
  )

  assert.equal(result.nextState.content, '**ERROR**: MODEL_ERROR - boom')
  assert.equal(result.nextState.phase, 'streaming')
})

test('getStreamingAnswerFailureNotice only reports failed answers', () => {
  const partial = consumeAll([
    { retcode: 0, data: { answer: '部分' } },
    { retcode: 500, data: {} },
  ])
  const empty = consumeAll([{ retcode: 500, data: {} }])
  const completed = consumeAll([
    { retcode: 0, data: { answer: '完整' } },
    { retcode: 0, data: true },
  ])

  assert.equal(
    getStreamingAnswerFailureNotice(partial),
    'chat.stream.interrupted',
  )
  assert.equal(getStreamingAnswerFailureNotice(empty), 'chat.stream.failed')
  assert.equal(getStreamingAnswerFailureNotice(completed), null)
  assert.equal(
    getStreamingAnswerFailureNotice(createInitialStreamingAnswerState()),
    null,
  )
})

test('finalizeStreamingAnswerState does not promote reasoning of a failed answer', () => {
  const failed = consumeAll([
    { retcode: 0, data: { answer: '', start_to_think: true } },
    { retcode: 0, data: { answer: '先想想。\n\n这里像是答案' } },
    { retcode: 500, data: {} },
  ])

  assert.equal(finalizeStreamingAnswerState(failed), failed)
  assert.equal(getStreamingAnswerFailureNotice(failed), 'chat.stream.failed')
})

test('consumeStreamingAnswerChunk ignores non-record chunks', () => {
  const state = createInitialStreamingAnswerState()

  for (const rawChunk of [null, undefined, 'text', 42, true]) {
    const result = consumeStreamingAnswerChunk(state, rawChunk)
    assert.equal(result.nextState, state)
    assert.equal(result.isDone, false)
    assert.equal(result.isFinal, false)
  }
})

test('consumeStreamingAnswerChunk merges delta-style answer payloads by appending', () => {
  const first = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    { retcode: 0, data: { answer: '你好' } },
  )
  const second = consumeStreamingAnswerChunk(first.nextState, {
    retcode: 0,
    data: { answer: '，世界' },
  })

  assert.equal(second.nextState.content, '你好，世界')
})

test('consumeStreamingAnswerChunk replaces on cumulative full-text payloads', () => {
  const first = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    { retcode: 0, data: { answer: '你好' } },
  )
  const second = consumeStreamingAnswerChunk(first.nextState, {
    retcode: 0,
    data: { answer: '你好，世界' },
  })

  assert.equal(second.nextState.content, '你好，世界')
  assert.equal(second.nextState.fullAnswer, '你好，世界')
})

test('consumeStreamingAnswerChunk handles bare string data with root think markers', () => {
  const thinking = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    { retcode: 0, start_to_think: true, data: '推理片段' },
  )
  const closed = consumeStreamingAnswerChunk(thinking.nextState, {
    retcode: 0,
    end_to_think: true,
    data: '',
  })
  const answer = consumeStreamingAnswerChunk(closed.nextState, {
    retcode: 0,
    data: '正文',
  })

  assert.equal(answer.nextState.thinking, '推理片段')
  assert.equal(answer.nextState.content, '正文')
})

test('consumeStreamingAnswerChunk does not double-open think blocks', () => {
  const first = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    { retcode: 0, data: { start_to_think: true, answer: '想' } },
  )
  const second = consumeStreamingAnswerChunk(first.nextState, {
    retcode: 0,
    data: { start_to_think: true, answer: '继续想' },
  })

  assert.equal(second.nextState.fullAnswer, '<think>想继续想')
  assert.equal(second.nextState.thinking, '想继续想')
  assert.equal(second.nextState.content, '')
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  finalizeStreamingAnswerState,
} from '../answer-reducer'

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
      final: true,
    },
    retcode: 0,
  })

  assert.equal(fourth.nextState.content, 'Answer:  done')
  assert.equal(fourth.nextState.thinking, 'reasoning')
  assert.equal(fourth.isFinal, true)
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

test('consumeStreamingAnswerChunk reports the data===true terminal frame as done', () => {
  const state = createInitialStreamingAnswerState()
  const result = consumeStreamingAnswerChunk(state, { retcode: 0, data: true })

  assert.equal(result.isDone, true)
  assert.equal(result.isFinal, true)
  assert.equal(result.nextState, state)
})

test('consumeStreamingAnswerChunk leaves state untouched on non-zero retcode', () => {
  const seeded = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    { retcode: 0, data: { answer: '部分内容' } },
  )
  const onError = consumeStreamingAnswerChunk(seeded.nextState, {
    retcode: 102,
    retmsg: 'boom',
    data: { answer: '应被忽略' },
  })

  assert.equal(onError.nextState, seeded.nextState)
  assert.equal(onError.isDone, false)
  assert.equal(onError.isFinal, false)
})

test('consumeStreamingAnswerChunk honors the alternate code error field', () => {
  const seeded = consumeStreamingAnswerChunk(
    createInitialStreamingAnswerState(),
    { code: 0, data: { answer: 'ok' } },
  )
  const onError = consumeStreamingAnswerChunk(seeded.nextState, {
    code: 500,
    data: { answer: '应被忽略' },
  })

  assert.equal(seeded.nextState.content, 'ok')
  assert.equal(onError.nextState, seeded.nextState)
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

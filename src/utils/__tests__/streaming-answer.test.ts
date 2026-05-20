import assert from 'node:assert/strict'
import test from 'node:test'
import {
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  finalizeStreamingAnswerState,
} from '../streaming-answer'

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

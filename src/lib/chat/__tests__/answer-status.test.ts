import assert from 'node:assert/strict'
import test from 'node:test'
import {
  answerStatusTone,
  resolveAnswerKind,
  type AnswerStatusKind,
} from '../answer-status'

test('answerStatusTone: stopping is neutral, an unconfirmed result warns, every failure is an error', () => {
  const tones: Record<AnswerStatusKind, string> = {
    stopped: 'neutral',
    unconfirmed: 'warning',
    network: 'error',
    timeout: 'error',
    unauthorized: 'error',
    rate_limited: 'error',
    server_error: 'error',
    business: 'error',
    failed: 'error',
  }
  for (const [kind, tone] of Object.entries(tones)) {
    assert.equal(answerStatusTone(kind as AnswerStatusKind), tone, kind)
  }
})

test('resolveAnswerKind: a verdict reached in the stream wins over how it ended', () => {
  assert.equal(resolveAnswerKind('completed', 'network'), null)
  assert.equal(resolveAnswerKind('business', 'stopped'), 'business')
  assert.equal(resolveAnswerKind(null, 'unconfirmed'), 'unconfirmed')
})

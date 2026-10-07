import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatRetrievalScore,
  readRetrievalScore,
} from '@/lib/knowledge/retrieval-score'

test('a real zero and in-range scores are usable', () => {
  assert.equal(readRetrievalScore(0), 0)
  assert.equal(readRetrievalScore(0.82), 0.82)
  assert.equal(readRetrievalScore(1), 1)
})

test('missing, non-numeric and out-of-range scores are unavailable, not zero', () => {
  for (const value of [
    undefined,
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    '0.8',
    '',
    true,
    {},
    1.5,
    -0.1,
    2,
  ]) {
    assert.equal(readRetrievalScore(value), null, String(value))
  }
})

test('floating-point noise at the bounds is clamped instead of rejected', () => {
  assert.equal(readRetrievalScore(1 + 1e-12), 1)
  assert.equal(readRetrievalScore(-1e-12), 0)
  assert.ok(Object.is(readRetrievalScore(-0), 0))
})

test('scores format as whole percentages in both product languages', () => {
  for (const locale of ['zh-CN', 'en-US']) {
    assert.equal(formatRetrievalScore(0, locale), '0%')
    assert.equal(formatRetrievalScore(0.824, locale), '82%')
    assert.equal(formatRetrievalScore(1, locale), '100%')
  }
})

test('a fixed number of decimals keeps close scores apart', () => {
  for (const locale of ['zh-CN', 'en-US']) {
    assert.equal(formatRetrievalScore(0, locale, 1), '0.0%')
    assert.equal(formatRetrievalScore(0.82, locale, 1), '82.0%')
    assert.equal(formatRetrievalScore(0.824, locale, 1), '82.4%')
    assert.equal(formatRetrievalScore(0.8189, locale, 1), '81.9%')
    assert.equal(formatRetrievalScore(1, locale, 1), '100.0%')
  }
})

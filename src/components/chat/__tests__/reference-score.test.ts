import assert from 'node:assert/strict'
import test from 'node:test'
import enUS from '@/locales/en-US/reference'
import zhCN from '@/locales/zh-CN/reference'
import { formatRetrievalScore, readRetrievalScore } from '../reference-score'

type Resource = Record<string, unknown>

const leafKeys = (node: Resource, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? leafKeys(value as Resource, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

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

test('zh-CN and en-US reference resources define the same keys', () => {
  assert.deepEqual(leafKeys(enUS).sort(), leafKeys(zhCN).sort())
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { spreadInitialPositions } from '../utils'

test('spreadInitialPositions: same count and seed returns identical coordinates', () => {
  assert.deepEqual(
    spreadInitialPositions(12, 'stable-graph'),
    spreadInitialPositions(12, 'stable-graph'),
  )
})

test('spreadInitialPositions: default seed is deterministic', () => {
  assert.deepEqual(spreadInitialPositions(8), spreadInitialPositions(8))
})

test('spreadInitialPositions: handles zero and single-node graphs', () => {
  assert.deepEqual(spreadInitialPositions(0), [])

  const [single] = spreadInitialPositions(1, 'single')
  assert.equal(Number.isFinite(single.x), true)
  assert.equal(Number.isFinite(single.y), true)
})

test('spreadInitialPositions: large graph coordinates stay within jitter bounds', () => {
  const nodeCount = 500
  const radius = Math.max(150, Math.sqrt(nodeCount) * 60)
  const limit = radius * 1.15

  for (const position of spreadInitialPositions(nodeCount, 'large-graph')) {
    assert.equal(Number.isFinite(position.x), true)
    assert.equal(Number.isFinite(position.y), true)
    assert.ok(Math.abs(position.x) <= limit, `x ${position.x} exceeds ${limit}`)
    assert.ok(Math.abs(position.y) <= limit, `y ${position.y} exceeds ${limit}`)
  }
})

test('spreadInitialPositions: different seeds affect deterministic jitter', () => {
  assert.notDeepEqual(
    spreadInitialPositions(10, 'graph-a'),
    spreadInitialPositions(10, 'graph-b'),
  )
})

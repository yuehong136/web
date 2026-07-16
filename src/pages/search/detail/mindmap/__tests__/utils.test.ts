import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMindmapNodeSizeMap, getMindmapNodeSize } from '../node-size'
import { normalizeMindmapTree } from '../utils'

test('getMindmapNodeSize preserves the existing minimum sizes', () => {
  assert.deepEqual(getMindmapNodeSize('short'), [60, 20])
  assert.deepEqual(getMindmapNodeSize('root', true), [100, 20])
})

test('getMindmapNodeSize sizes multiline labels by the longest line and line count', () => {
  assert.deepEqual(getMindmapNodeSize('1234567890\nabc'), [80, 40])
  assert.deepEqual(getMindmapNodeSize('12345\r\n123456789012345'), [110, 40])
})

test('getMindmapNodeSize caps exceptionally wide labels without collapsing their height', () => {
  assert.deepEqual(getMindmapNodeSize('x'.repeat(100)), [400, 20])
  assert.deepEqual(getMindmapNodeSize('a\nb\nc\nd'), [60, 80])
})

test('buildMindmapNodeSizeMap keeps layout sizes addressable by normalized node id', () => {
  const tree = normalizeMindmapTree({
    label: 'Root',
    children: [{ label: '1234567890\nchild' }],
  })
  assert.ok(tree)

  const sizes = buildMindmapNodeSizeMap(tree)
  assert.deepEqual(sizes.get('root'), [100, 20])
  assert.deepEqual(sizes.get('root-0'), [80, 40])
})

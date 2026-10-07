import assert from 'node:assert/strict'
import test from 'node:test'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import {
  mergeFrameReferences,
  readFrameReferences,
  reconcileReferences,
} from '../chat-reference-helpers'

const chunk = (
  index: number,
  overrides: Partial<ReferenceChunk> = {},
): ReferenceChunk => ({
  id: `chunk-${index}`,
  content: `片段 ${index}`,
  document_id: 'doc-1',
  document_name: 'harness.pdf',
  dataset_id: 'kb-1',
  similarity: 0.8,
  positions: [[1, 10, 20, 30, 40]],
  document_metadata: { year: 2024, tags: ['评测'] },
  ...overrides,
})

const snapshot = () => [chunk(0), chunk(1), chunk(2)]

test('readFrameReferences tells a frame without references from an explicit snapshot', () => {
  // 帧里没有引用字段：不是快照
  assert.equal(readFrameReferences(undefined), null)
  assert.equal(readFrameReferences(true), null)
  assert.equal(readFrameReferences({ answer: '正文' }), null)
  assert.equal(readFrameReferences({ answer: '正文', reference: null }), null)
  // 错误帧的 reference 是数组
  assert.equal(
    readFrameReferences({ answer: '**ERROR**: x', reference: [] }),
    null,
  )

  // 引用对象存在就是快照，可能为空（终帧无知识库时没有 chunks 键）
  assert.deepEqual(readFrameReferences({ reference: {} }), [])
  assert.deepEqual(readFrameReferences({ reference: { chunks: [] } }), [])
  assert.deepEqual(
    readFrameReferences({ reference: { chunks: snapshot() } }),
    snapshot(),
  )
  // 旧版 data.chunks
  assert.deepEqual(readFrameReferences({ chunks: snapshot() }), snapshot())
})

test('readFrameReferences keeps the shared keyed-map contract', () => {
  // 键乱序、缺号：按数字键排序，编号取自键
  const keyed = readFrameReferences({
    reference: { chunks: { '10': chunk(10), '0': chunk(0), '2': chunk(2) } },
  })
  assert.deepEqual(
    keyed?.map((item) => [item.id, item.reference_index, item.reference_key]),
    [
      ['chunk-0', 0, '0'],
      ['chunk-2', 2, '2'],
      ['chunk-10', 10, '10'],
    ],
  )
  // 非数字键没有 reference_index，只保留 reference_key
  const [hashed] =
    readFrameReferences({ reference: { chunks: { abc: chunk(9) } } }) ?? []
  assert.equal(hashed.reference_index, undefined)
  assert.equal(hashed.reference_key, 'abc')
  assert.equal(
    readFrameReferences({ chunks: { '1': chunk(1) } })?.[0].reference_index,
    1,
  )
})

test('mergeFrameReferences keeps references until an authoritative frame clears them', () => {
  const current = snapshot()

  assert.equal(mergeFrameReferences(current, null, false), current)
  assert.equal(mergeFrameReferences(current, null, true), current)
  // 增量帧的空数组表示没提供
  assert.equal(mergeFrameReferences(current, [], false), current)
  // 未失败的终帧明确为空：本轮没有引用
  assert.deepEqual(mergeFrameReferences(current, [], true), [])

  const empty: ReferenceChunk[] = []
  assert.equal(mergeFrameReferences(empty, [], true), empty)

  const replaced = [chunk(5)]
  assert.deepEqual(mergeFrameReferences(current, replaced, false), replaced)
})

test('reconcileReferences returns the same array for an identical snapshot', () => {
  const current = snapshot()
  // 新一帧解析出的是新对象：结构相同就沿用原数组
  assert.equal(reconcileReferences(current, structuredClone(current)), current)
  // 键序不同、值为 undefined 的键视同相同
  const reordered = structuredClone(current).map(
    ({ document_metadata, ...rest }) => ({
      document_metadata: { tags: ['评测'], year: 2024 },
      url: undefined,
      ...rest,
    }),
  )
  assert.equal(reconcileReferences(current, reordered), current)
})

const changes: Array<[string, Partial<ReferenceChunk>]> = [
  ['metadata', { document_metadata: { year: 2025, tags: ['评测'] } }],
  [
    'metadata list',
    { document_metadata: { year: 2024, tags: ['评测', '新'] } },
  ],
  ['score', { similarity: 0.91 }],
  ['vector score', { vector_similarity: 0.7 }],
  ['name', { document_name: 'harness-v2.pdf' }],
  ['positions', { positions: [[2, 10, 20, 30, 40]] }],
  ['image', { image_id: 'kb-1-img-1' }],
  ['doc type', { doc_type: 'image' }],
  ['url', { url: 'https://example.com/a' }],
]

for (const [field, change] of changes) {
  test(`reconcileReferences updates a ${field}-only change and keeps the others`, () => {
    const current = snapshot()
    const incoming = structuredClone(current)
    incoming[1] = { ...incoming[1], ...change }

    const next = reconcileReferences(current, incoming)

    assert.notEqual(next, current)
    assert.deepEqual(next[1], incoming[1])
    // 没变的条目沿用原对象
    assert.equal(next[0], current[0])
    assert.equal(next[2], current[2])
  })
}

test('reconcileReferences follows length and order changes', () => {
  const current = snapshot()
  const shorter = reconcileReferences(
    current,
    structuredClone(current.slice(0, 2)),
  )
  assert.deepEqual(shorter, current.slice(0, 2))
  assert.equal(shorter[0], current[0])

  const longer = reconcileReferences(current, [
    ...structuredClone(current),
    chunk(3),
  ])
  assert.equal(longer.length, 4)

  // 乱序：编号按位置对应，换位就是新快照
  const swapped = structuredClone([current[1], current[0], current[2]])
  const next = reconcileReferences(current, swapped)
  assert.deepEqual(
    next.map((item) => item.id),
    ['chunk-1', 'chunk-0', 'chunk-2'],
  )
  assert.equal(next[2], current[2])
})

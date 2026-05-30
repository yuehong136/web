import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSkeletonJson, SkeletonImportError } from '../designer/skeleton-io'

test('round-trips a skeleton preserving directives/annotation/role/theme', () => {
  const original = {
    title: 'Q3',
    titleDirective: { mode: 'llm', hint: 'derive from the source' },
    theme: { colorPalette: ['#1677ff'] },
    sections: [
      {
        id: 'sec-1',
        title: 'Metrics',
        layout: 'two-column',
        annotation: 'overall focus',
        blocks: [
          {
            id: 'blk-1',
            type: 'paragraph',
            fields: {},
            fieldDirectives: { content: { mode: 'llm' } },
            annotation: 'a',
            role: 'main',
          },
          {
            id: 'blk-2',
            type: 'open-region',
            fields: {},
            annotation: 'charts',
          },
        ],
      },
    ],
  }
  // 往返不丢任何作者数据(不走 AI 归一器)
  assert.deepEqual(parseSkeletonJson(JSON.stringify(original)), original)
})

test('backfills missing ids and defaults bad layout to full', () => {
  const parsed = parseSkeletonJson(
    JSON.stringify({
      title: 'T',
      sections: [{ layout: 'nope', blocks: [{ type: 'paragraph' }] }],
    }),
  )
  assert.equal(parsed.sections[0].layout, 'full')
  assert.ok(parsed.sections[0].id.length > 0)
  assert.ok(parsed.sections[0].blocks[0].id.length > 0)
})

test('drops blocks with invalid type', () => {
  const parsed = parseSkeletonJson(
    JSON.stringify({
      title: 'T',
      sections: [
        {
          id: 's',
          layout: 'full',
          blocks: [
            { id: 'b1', type: 'bogus' },
            { id: 'b2', type: 'table', headers: ['A'] },
          ],
        },
      ],
    }),
  )
  assert.equal(parsed.sections[0].blocks.length, 1)
  assert.equal(parsed.sections[0].blocks[0].id, 'b2')
})

test('rejects invalid JSON and wrong shape', () => {
  assert.throws(() => parseSkeletonJson('not json'), SkeletonImportError)
  assert.throws(() => parseSkeletonJson('{"title":"x"}'), SkeletonImportError)
  assert.throws(() => parseSkeletonJson('[]'), SkeletonImportError)
})

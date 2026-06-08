import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  parseReportJson,
  parseSkeletonJson,
  SkeletonImportError,
} from '../designer/skeleton-io'

test('round-trips a skeleton preserving directives/annotation/role/theme', () => {
  const original = {
    title: 'Q3',
    titleDirective: { mode: 'llm', hint: 'derive from the source' },
    layoutFirst: true,
    theme: { colorPalette: ['#1677ff'] },
    sections: [
      {
        id: 'sec-1',
        title: 'Metrics',
        titleDirective: { mode: 'llm', hint: 'rename by source' },
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

test('round-trips top-level subtitle + subtitleDirective (model mode)', () => {
  const original = {
    title: 'Q3',
    subtitle: '一句话概述',
    subtitleDirective: { mode: 'llm', hint: '按源文写一行概述' },
    sections: [{ id: 's', title: '概览', layout: 'full', blocks: [] }],
  }
  // 副标题及其模型态指令在导出→导入中保真,否则真实/手动报告丢副标题
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

test('parseReportJson keeps concrete blocks + title/theme/date/author', () => {
  const report = {
    title: '云岭市 2025 文旅报告',
    date: '2025-05-01',
    author: '文旅局',
    theme: { colorPalette: ['#1677ff'] },
    sections: [
      {
        id: 'sec-1',
        title: '城市概况',
        layout: 'full',
        blocks: [
          { id: 'b1', type: 'paragraph', content: 'hello' },
          {
            id: 'b2',
            type: 'stat-card-group',
            items: [{ label: '游客量', value: '6820 万' }],
          },
        ],
      },
    ],
  }
  const parsed = parseReportJson(JSON.stringify(report))
  assert.deepEqual(parsed, report)
})

test('parseReportJson drops open-region/invalid blocks, backfills ids/layout', () => {
  const parsed = parseReportJson(
    JSON.stringify({
      title: 'T',
      sections: [
        {
          layout: 'nope',
          blocks: [
            { type: 'open-region', annotation: 'x' },
            { type: 'bogus' },
            { type: 'table', headers: ['A'], rows: [['1']] },
          ],
        },
      ],
    }),
  )
  assert.equal(parsed.sections[0].layout, 'full')
  assert.ok(parsed.sections[0].id.length > 0)
  assert.equal(parsed.sections[0].blocks.length, 1)
  assert.equal(parsed.sections[0].blocks[0].type, 'table')
  assert.ok(parsed.sections[0].blocks[0].id.length > 0)
})

test('parseReportJson rejects invalid JSON and wrong shape', () => {
  assert.throws(() => parseReportJson('not json'), SkeletonImportError)
  assert.throws(() => parseReportJson('{"title":"x"}'), SkeletonImportError)
  assert.throws(() => parseReportJson('[]'), SkeletonImportError)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  parseSkeletonResponse,
  SkeletonParseError,
} from '../designer/ai-skeleton/parse'
import { buildReportHtml } from '../renderer/build-report-html'
import { mergeSkeleton, summarizeSkeleton } from '../skeleton-utils'
import type { SkeletonBlock } from '../types'

/** fields 是判别联合的 Partial,读取具体键时统一按弱类型读。 */
const fieldsOf = (block: SkeletonBlock) =>
  (block.fields ?? {}) as Record<string, unknown>

const minimal = (blocks: unknown[]) =>
  JSON.stringify({
    title: 'T',
    sections: [{ layout: 'full', blocks }],
  })

test('parses a fenced JSON block', () => {
  const raw =
    '```json\n' + minimal([{ type: 'paragraph', content: 'hi' }]) + '\n```'
  const s = parseSkeletonResponse(raw)
  assert.equal(s.title, 'T')
  assert.equal(s.sections.length, 1)
  assert.equal(s.sections[0].blocks[0].type, 'paragraph')
})

test('extracts JSON wrapped in prose', () => {
  const raw =
    'Sure! Here is the skeleton:\n' +
    minimal([{ type: 'heading', level: 2, content: 'H' }]) +
    '\nHope this helps.'
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].blocks[0].type, 'heading')
})

test('strips <think> blocks before locating JSON', () => {
  const raw =
    '<think>I will use a list { not json }</think>' +
    minimal([{ type: 'list', ordered: true, items: ['a', 'b'] }])
  const s = parseSkeletonResponse(raw)
  const block = s.sections[0].blocks[0]
  assert.equal(block.type, 'list')
  assert.deepEqual(fieldsOf(block).items, ['a', 'b'])
})

test('coerces invalid layout to full and unknown block type to paragraph', () => {
  const raw = JSON.stringify({
    title: 'T',
    sections: [{ layout: 'mosaic', blocks: [{ type: 'quote', content: 'x' }] }],
  })
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].layout, 'full')
  assert.equal(s.sections[0].blocks[0].type, 'paragraph')
  assert.equal(fieldsOf(s.sections[0].blocks[0]).content, 'x')
})

test('generates ids for sections and blocks', () => {
  const s = parseSkeletonResponse(
    minimal([{ type: 'paragraph', content: 'a' }]),
  )
  assert.match(s.sections[0].id, /^sec-/)
  assert.match(s.sections[0].blocks[0].id, /^blk-/)
})

test('keeps a valid chart and drops one with empty data', () => {
  const raw = minimal([
    {
      type: 'chart',
      chartType: 'bar',
      xAxisKey: 'm',
      series: [{ dataKey: 'v' }],
      data: [
        { m: 'Jan', v: 1 },
        { m: 'Feb', v: 2 },
      ],
    },
    { type: 'chart', chartType: 'pie', nameKey: 'n', valueKey: 'v', data: [] },
  ])
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].blocks.length, 1)
  assert.equal(s.sections[0].blocks[0].type, 'chart')
  assert.equal(summarizeSkeleton(s).charts, 1)
})

test('drops a cartesian chart missing its shape keys', () => {
  const raw = minimal([
    { type: 'chart', chartType: 'line', data: [{ m: 'Jan', v: 1 }] },
    { type: 'paragraph', content: 'keep me' },
  ])
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].blocks.length, 1)
  assert.equal(s.sections[0].blocks[0].type, 'paragraph')
})

test('assigns roles only under sidebar layouts', () => {
  const raw = JSON.stringify({
    title: 'T',
    sections: [
      {
        layout: 'sidebar-left',
        blocks: [
          { type: 'paragraph', content: 'main', role: 'main' },
          { type: 'paragraph', content: 'side', role: 'side' },
        ],
      },
      {
        layout: 'full',
        blocks: [{ type: 'paragraph', content: 'x', role: 'side' }],
      },
    ],
  })
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].blocks[0].role, 'main')
  assert.equal(s.sections[0].blocks[1].role, 'side')
  assert.equal(s.sections[1].blocks[0].role, undefined)
})

test('throws SkeletonParseError on malformed JSON', () => {
  assert.throws(
    () => parseSkeletonResponse('not json at all'),
    SkeletonParseError,
  )
  assert.throws(() => parseSkeletonResponse('{ "title": '), SkeletonParseError)
})

test('throws when no valid sections remain', () => {
  const raw = JSON.stringify({
    title: 'T',
    sections: [{ layout: 'full', blocks: [] }],
  })
  assert.throws(() => parseSkeletonResponse(raw), SkeletonParseError)
})

test('output feeds mergeSkeleton + buildReportHtml without error', () => {
  const raw = minimal([
    { type: 'heading', level: 1, content: 'Title' },
    {
      type: 'stat-card-group',
      items: [{ label: 'Rev', value: '$1M', trend: 'up' }],
    },
    {
      type: 'chart',
      chartType: 'pie',
      nameKey: 'name',
      valueKey: 'value',
      data: [
        { name: 'A', value: 60 },
        { name: 'B', value: 40 },
      ],
    },
  ])
  const s = parseSkeletonResponse(raw)
  const report = mergeSkeleton(s, {})
  const html = buildReportHtml(report)
  assert.ok(html.includes('<html'))
  assert.equal(summarizeSkeleton(s).blocks, 3)
})

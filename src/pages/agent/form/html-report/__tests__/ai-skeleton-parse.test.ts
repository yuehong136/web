import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  parseOutline,
  parseSection,
  parseSkeletonResponse,
  SkeletonParseError,
} from '../designer/ai-skeleton/parse'
import { buildPreviewSchema } from '../mock-fill'
import { buildReportHtml } from '../renderer/build-report-html'
import { summarizeSkeleton } from '../skeleton-utils'
import type { SkeletonBlock, SkeletonSchema } from '../types'

/** fields 是判别联合的 Partial,读取具体键时统一按弱类型读。 */
const fieldsOf = (block: SkeletonBlock) =>
  (block.fields ?? {}) as Record<string, unknown>

const dirOf = (block: SkeletonBlock, path: string) =>
  block.fieldDirectives?.[path]

const minimal = (blocks: unknown[]) =>
  JSON.stringify({ title: 'T', sections: [{ layout: 'full', blocks }] })

test('fenced JSON: content becomes an llm directive + block annotation', () => {
  const raw =
    '```json\n' +
    minimal([{ type: 'paragraph', hint: 'Summarize the quarter' }]) +
    '\n```'
  const s = parseSkeletonResponse(raw)
  assert.equal(s.title, 'T')
  assert.equal(s.sections.length, 1)
  const block = s.sections[0].blocks[0]
  assert.equal(block.type, 'paragraph')
  assert.equal(dirOf(block, 'content')?.mode, 'llm')
  assert.equal(dirOf(block, 'content')?.hint, 'Summarize the quarter')
  assert.equal(block.annotation, 'Summarize the quarter')
})

test('heading content stays static framework (no directive)', () => {
  const raw =
    'Sure! Here is the template:\n' +
    minimal([{ type: 'heading', level: 2, content: 'Executive Summary' }]) +
    '\nHope this helps.'
  const block = parseSkeletonResponse(raw).sections[0].blocks[0]
  assert.equal(block.type, 'heading')
  assert.equal(fieldsOf(block).content, 'Executive Summary')
  assert.equal(fieldsOf(block).level, 2)
  assert.equal(block.fieldDirectives, undefined)
})

test('strips <think>; list items kept as framework + per-item llm', () => {
  const raw =
    '<think>I will use a list { not json }</think>' +
    minimal([{ type: 'list', ordered: true, items: ['Growth', 'Risk'] }])
  const block = parseSkeletonResponse(raw).sections[0].blocks[0]
  assert.equal(block.type, 'list')
  assert.deepEqual(fieldsOf(block).items, ['Growth', 'Risk'])
  assert.equal(dirOf(block, 'items[0]')?.mode, 'llm')
  assert.equal(dirOf(block, 'items[1]')?.mode, 'llm')
})

test('coerces invalid layout to full and unknown block to paragraph', () => {
  const raw = JSON.stringify({
    title: 'T',
    sections: [{ layout: 'mosaic', blocks: [{ type: 'quote', hint: 'x' }] }],
  })
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].layout, 'full')
  const block = s.sections[0].blocks[0]
  assert.equal(block.type, 'paragraph')
  assert.equal(dirOf(block, 'content')?.mode, 'llm')
})

test('generates ids for sections and blocks', () => {
  const s = parseSkeletonResponse(minimal([{ type: 'paragraph', hint: 'a' }]))
  assert.match(s.sections[0].id, /^sec-/)
  assert.match(s.sections[0].blocks[0].id, /^blk-/)
})

test('chart kept as framework without data; data becomes a directive', () => {
  const raw = minimal([
    {
      type: 'chart',
      chartType: 'bar',
      xAxisKey: 'quarter',
      series: [{ dataKey: 'revenue', name: 'Revenue' }],
      hint: 'Revenue by quarter',
    },
  ])
  const s = parseSkeletonResponse(raw)
  const block = s.sections[0].blocks[0]
  assert.equal(block.type, 'chart')
  assert.equal(fieldsOf(block).chartType, 'bar')
  assert.equal(fieldsOf(block).xAxisKey, 'quarter')
  assert.equal(dirOf(block, 'data')?.mode, 'llm')
  assert.equal(summarizeSkeleton(s).charts, 1)
})

test('chart with missing shape keys falls back to defaults (never dropped)', () => {
  const raw = minimal([
    { type: 'chart', chartType: 'line', hint: 'trend' },
    { type: 'paragraph', hint: 'keep me' },
  ])
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].blocks.length, 2)
  assert.equal(s.sections[0].blocks[0].type, 'chart')
  assert.ok(fieldsOf(s.sections[0].blocks[0]).xAxisKey)
})

test('captures section annotation + stat-card-group label framework', () => {
  const raw = JSON.stringify({
    title: 'T',
    sections: [
      {
        layout: 'full',
        annotation: 'KPIs of the quarter',
        blocks: [
          {
            type: 'stat-card-group',
            items: [{ label: 'Revenue' }, { label: 'Churn' }],
            hint: 'values + change',
          },
        ],
      },
    ],
  })
  const s = parseSkeletonResponse(raw)
  assert.equal(s.sections[0].annotation, 'KPIs of the quarter')
  const block = s.sections[0].blocks[0]
  const items = fieldsOf(block).items as Array<{ label: string }>
  assert.deepEqual(
    items.map((i) => i.label),
    ['Revenue', 'Churn'],
  )
  assert.equal(dirOf(block, 'items[0].value')?.mode, 'llm')
  assert.equal(dirOf(block, 'items[1].value')?.mode, 'llm')
})

test('table headers are framework, rows become a directive', () => {
  const raw = minimal([
    { type: 'table', headers: ['Year', 'Count'], hint: 'enrollment by year' },
  ])
  const block = parseSkeletonResponse(raw).sections[0].blocks[0]
  assert.deepEqual(fieldsOf(block).headers, ['Year', 'Count'])
  assert.equal(dirOf(block, 'rows')?.mode, 'llm')
})

test('assigns roles only under sidebar layouts', () => {
  const raw = JSON.stringify({
    title: 'T',
    sections: [
      {
        layout: 'sidebar-left',
        blocks: [
          { type: 'paragraph', hint: 'main', role: 'main' },
          { type: 'paragraph', hint: 'side', role: 'side' },
        ],
      },
      {
        layout: 'full',
        blocks: [{ type: 'paragraph', hint: 'x', role: 'side' }],
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

test('template previews + renders, and reports pending fills', () => {
  const raw = minimal([
    { type: 'heading', level: 1, content: 'Annual Report' },
    { type: 'paragraph', hint: 'overview' },
    { type: 'stat-card-group', items: [{ label: 'Students' }], hint: 'totals' },
    {
      type: 'chart',
      chartType: 'pie',
      nameKey: 'name',
      valueKey: 'value',
      hint: 'distribution',
    },
    { type: 'table', headers: ['A', 'B'], hint: 'rows' },
  ])
  const s = parseSkeletonResponse(raw)
  const html = buildReportHtml(buildPreviewSchema(s))
  assert.ok(html.includes('<html'))
  assert.equal(summarizeSkeleton(s).blocks, 5)
  assert.ok(summarizeSkeleton(s).pending > 0)
})

// ---- outline (第①步) ----

test('parseOutline parses sections from fenced JSON', () => {
  const raw =
    '```json\n' +
    JSON.stringify({
      title: 'Annual Report',
      sections: [
        { title: 'Overview', layout: 'full', intent: 'intro' },
        { title: 'Data', layout: 'two-column', intent: 'the numbers' },
      ],
    }) +
    '\n```'
  const outline = parseOutline(raw)
  assert.equal(outline.title, 'Annual Report')
  assert.equal(outline.sections.length, 2)
  assert.equal(outline.sections[0].title, 'Overview')
  assert.equal(outline.sections[0].intent, 'intro')
  assert.equal(outline.sections[1].layout, 'two-column')
})

test('parseOutline coerces invalid layout to full', () => {
  const raw = JSON.stringify({
    title: 'T',
    sections: [{ title: 'X', layout: 'mosaic' }],
  })
  assert.equal(parseOutline(raw).sections[0].layout, 'full')
})

test('parseOutline throws when there are no sections', () => {
  assert.throws(
    () => parseOutline('{"title":"T","sections":[]}'),
    SkeletonParseError,
  )
  assert.throws(() => parseOutline('not json'), SkeletonParseError)
})

// ---- per-section (第②步) ----

test('parseSection builds a section from {blocks} + outline meta', () => {
  const raw = JSON.stringify({
    blocks: [
      { type: 'heading', level: 2, content: 'Scale' },
      { type: 'paragraph', hint: 'overview of scale' },
      { type: 'table', headers: ['Year', 'Count'], hint: 'enrollment by year' },
    ],
  })
  const section = parseSection(raw, {
    title: 'Scale',
    layout: 'full',
    intent: 'enrollment scale',
  })
  assert.match(section.id, /^sec-/)
  assert.equal(section.layout, 'full')
  assert.equal(section.title, 'Scale')
  assert.equal(section.annotation, 'enrollment scale')
  assert.equal(section.blocks.length, 3)
  // heading framework static, no directive
  assert.equal(fieldsOf(section.blocks[0]).content, 'Scale')
  assert.equal(section.blocks[0].fieldDirectives, undefined)
  // paragraph content -> llm
  assert.equal(section.blocks[1].fieldDirectives?.content?.mode, 'llm')
  // table headers static, rows -> llm
  assert.deepEqual(fieldsOf(section.blocks[2]).headers, ['Year', 'Count'])
  assert.equal(section.blocks[2].fieldDirectives?.rows?.mode, 'llm')
})

test('parseSection throws when no valid blocks', () => {
  assert.throws(
    () => parseSection('{"blocks":[]}', { layout: 'full' }),
    SkeletonParseError,
  )
  assert.throws(
    () => parseSection('not json', { layout: 'full' }),
    SkeletonParseError,
  )
})

test('parseSection output previews + renders', () => {
  const raw = JSON.stringify({
    blocks: [
      {
        type: 'chart',
        chartType: 'bar',
        xAxisKey: 'q',
        series: [{ dataKey: 'v' }],
        hint: 'quarterly',
      },
    ],
  })
  const section = parseSection(raw, { layout: 'full', intent: 'trend' })
  const skeleton: SkeletonSchema = { title: 'T', sections: [section] }
  const html = buildReportHtml(buildPreviewSchema(skeleton))
  assert.ok(html.includes('<html'))
})

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

test('paragraph: hint lands on the content directive, no block annotation', () => {
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
  // 单内容块:说明只在字段 hint 上,不再重复写进块级注解
  assert.equal(block.annotation, undefined)
})

test('AI generation drops heading blocks (section title is the heading)', () => {
  // 只有 heading 的节 → 无合法块 → 抛错
  assert.throws(
    () =>
      parseSkeletonResponse(
        minimal([{ type: 'heading', level: 2, content: 'Executive Summary' }]),
      ),
    SkeletonParseError,
  )
  // heading 与其他块混排 → heading 被剔除,其余保留
  const s = parseSkeletonResponse(
    minimal([
      { type: 'heading', level: 1, content: 'Title' },
      { type: 'paragraph', hint: 'overview' },
    ]),
  )
  assert.equal(s.sections[0].blocks.length, 1)
  assert.equal(s.sections[0].blocks[0].type, 'paragraph')
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
  // 多字段块:说明落到块级注解,字段 hint 留空(供手动细化 / 运行时回落)
  assert.equal(dirOf(block, 'data')?.hint, undefined)
  assert.equal(block.annotation, 'Revenue by quarter')
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
  assert.equal(summarizeSkeleton(s).blocks, 4)
  assert.ok(summarizeSkeleton(s).pending > 0)
})

test('preview fills model-mode enum directives with a valid enum value', () => {
  const s = parseSkeletonResponse(
    minimal([
      { type: 'callout', content: 'x', variant: 'warning' },
      { type: 'stat-card', label: 'Revenue' },
    ]),
  )
  // 模拟右栏把语义枚举切到「模型」:variant / trend 挂上 llm 指令
  const callout = s.sections[0].blocks[0]
  callout.fieldDirectives = {
    ...callout.fieldDirectives,
    variant: { mode: 'llm', hint: 'warn when risky' },
  }
  const stat = s.sections[0].blocks[1]
  stat.fieldDirectives = { ...stat.fieldDirectives, trend: { mode: 'llm' } }

  const schema = buildPreviewSchema(s)
  const renderedCallout = schema.sections[0].blocks[0]
  const renderedStat = schema.sections[0].blocks[1]
  assert.equal(renderedCallout.type, 'callout')
  assert.equal(renderedStat.type, 'stat-card')
  // 回落到合法枚举,而非把 hint 文案灌进 variant/trend
  if (renderedCallout.type === 'callout') {
    assert.equal(renderedCallout.variant, 'info')
  }
  if (renderedStat.type === 'stat-card') {
    assert.equal(renderedStat.trend, 'neutral')
  }
  assert.ok(buildReportHtml(schema).includes('<html'))
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
  assert.equal(section.blocks.length, 2)
  // paragraph content -> llm
  assert.equal(section.blocks[0].fieldDirectives?.content?.mode, 'llm')
  // table headers static, rows -> llm
  assert.deepEqual(fieldsOf(section.blocks[1]).headers, ['Year', 'Count'])
  assert.equal(section.blocks[1].fieldDirectives?.rows?.mode, 'llm')
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

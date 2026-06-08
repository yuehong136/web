import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ReportSchema } from '../../types'
import { buildReportHtml } from '../build-report-html'
import { chartMountId } from '../blocks'

function baseSchema(overrides: Partial<ReportSchema> = {}): ReportSchema {
  return {
    title: '测试报告',
    sections: [],
    ...overrides,
  }
}

test('emits a self-contained document with title and styles', () => {
  const html = buildReportHtml(baseSchema())
  assert.ok(html.startsWith('<!DOCTYPE html>'))
  assert.match(html, /<title>测试报告<\/title>/)
  // 自包含：内联 .rpt 样式，无外部 stylesheet/CDN
  assert.match(html, /<style>[\s\S]*\.rpt\b/)
  assert.doesNotMatch(html, /<link[^>]+stylesheet/)
})

test('renders each block type with its .rpt class', () => {
  const html = buildReportHtml(
    baseSchema({
      sections: [
        {
          id: 's1',
          layout: 'full',
          blocks: [
            { id: 'h', type: 'heading', level: 2, content: '小节' },
            { id: 'p', type: 'paragraph', content: '正文' },
            { id: 'c', type: 'callout', variant: 'warning', content: '注意' },
            { id: 'l', type: 'list', ordered: false, items: ['a', 'b'] },
            { id: 'sc', type: 'stat-card', label: 'KPI', value: '99' },
            {
              id: 't',
              type: 'table',
              headers: ['列'],
              rows: [['值']],
            },
          ],
        },
      ],
    }),
  )
  assert.match(html, /rpt-heading--2/)
  assert.match(html, /rpt-paragraph/)
  assert.match(html, /rpt-callout--warning/)
  assert.match(html, /<ul>/)
  assert.match(html, /rpt-stat-card__value/)
  assert.match(html, /rpt-table/)
})

test('hero renders eyebrow + subtitle when present', () => {
  const html = buildReportHtml(
    baseSchema({ eyebrow: '2025 年度报告', subtitle: '一句话概述' }),
  )
  assert.match(html, /rpt__eyebrow[^>]*>2025 年度报告</)
  assert.match(html, /rpt__subtitle[^>]*>一句话概述</)
})

test('hero omits eyebrow/subtitle markup when absent', () => {
  const html = buildReportHtml(baseSchema())
  // 断元素不存在（CSS 里有 .rpt__eyebrow 规则，故只查元素 class 属性，不查规则名）
  assert.doesNotMatch(html, /class="rpt__eyebrow"/)
  assert.doesNotMatch(html, /class="rpt__subtitle"/)
})

test('hero defaults to the campus header image when headerArt is unset', () => {
  // 全局默认:未设 headerArt → 回落「高校·默认」图文卡(内联底图)。
  // 查元素 class 属性 + 内联 data-URI,不查 CSS 规则名(.rpt__header--card 在 style 里也有)。
  const html = buildReportHtml(baseSchema())
  assert.match(html, /class="rpt__header rpt__header--card"/)
  assert.match(html, /data:image\/jpeg;base64/)
})

test("explicit headerArt 'none' suppresses the image and renders the text hero", () => {
  // 用户明确选「无」→ 纯文字 Hero。data-URI 是「有没有真内联图」的可靠判别(CSS 里没有)。
  const html = buildReportHtml(baseSchema({ headerArt: 'none' }))
  assert.match(html, /<header class="rpt__header">/)
  assert.doesNotMatch(html, /data:image\/jpeg;base64/)
})

test('only titled sections get an incrementing 01/02 index badge', () => {
  const html = buildReportHtml(
    baseSchema({
      sections: [
        { id: 'a', title: '第一节', layout: 'full', blocks: [] },
        // 无标题小节不计入编号、不出徽标
        { id: 'b', layout: 'full', blocks: [] },
        { id: 'c', title: '第二节', layout: 'full', blocks: [] },
      ],
    }),
  )
  assert.match(html, /rpt-section__index">01</)
  assert.match(html, /rpt-section__index">02</)
  assert.doesNotMatch(html, /rpt-section__index">03</)
})

test('stat card renders a colored icon circle with inline svg', () => {
  const html = buildReportHtml(
    baseSchema({
      sections: [
        {
          id: 's',
          layout: 'full',
          blocks: [
            { id: 'sc', type: 'stat-card', label: '游客总量', value: '6820' },
          ],
        },
      ],
    }),
  )
  assert.match(html, /rpt-stat-card__icon rpt-stat-card__icon--1/)
  assert.match(html, /<svg viewBox="0 0 24 24"/)
})

test('escapes HTML in user/LLM text to block injection', () => {
  const html = buildReportHtml(
    baseSchema({
      title: '<script>alert(1)</script>',
      sections: [
        {
          id: 's',
          layout: 'full',
          blocks: [
            { id: 'h', type: 'heading', level: 1, content: '<img onerror=x>' },
          ],
        },
      ],
    }),
  )
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /&lt;img onerror=x&gt;/)
})

test('inline markdown renders bold / italic / code in paragraphs', () => {
  const html = buildReportHtml(
    baseSchema({
      sections: [
        {
          id: 's',
          layout: 'full',
          blocks: [{ id: 'p', type: 'paragraph', content: '**粗** *斜* `码`' }],
        },
      ],
    }),
  )
  assert.match(html, /<strong>粗<\/strong>/)
  assert.match(html, /<em>斜<\/em>/)
  assert.match(html, /<code>码<\/code>/)
})

test('sidebar layout orders side/main columns correctly', () => {
  const sideFirst = buildReportHtml(
    baseSchema({
      sections: [
        {
          id: 's',
          layout: 'sidebar-left',
          blocks: [
            {
              id: 'm',
              type: 'heading',
              level: 2,
              content: 'MAIN',
              role: 'main',
            },
            {
              id: 'a',
              type: 'heading',
              level: 3,
              content: 'ASIDE',
              role: 'side',
            },
          ],
        },
      ],
    }),
  )
  // sidebar-left：窄(side)列在左 → ASIDE 应排在 MAIN 之前
  assert.ok(sideFirst.indexOf('ASIDE') < sideFirst.indexOf('MAIN'))
})

test('charts: no echarts inlined when omitted; mount + parseable specs when present', () => {
  const schema = baseSchema({
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'chart1',
            type: 'chart',
            chartType: 'bar',
            xAxisKey: 'x',
            series: [{ dataKey: 'y', name: 'Y' }],
            data: [
              { x: 'A', y: 1 },
              { x: 'B', y: 2 },
            ],
          },
        ],
      },
    ],
  })

  // 不提供 echartsScript：仍出挂载点和 init，但不内联库
  const noLib = buildReportHtml(schema)
  assert.match(noLib, new RegExp(`id="${chartMountId('chart1')}"`))
  assert.doesNotMatch(noLib, /echartsInlineMarker|exports\.echarts/)

  // 提供 echartsScript：内联进 <script>，且 specs JSON 可解析
  const withLib = buildReportHtml(schema, {
    echartsScript: '/*ECHARTS_LIB*/window.echarts={init:function(){}}',
  })
  assert.match(withLib, /ECHARTS_LIB/)
  const m = withLib.match(/var specs=(\[[\s\S]*?\]);var charts=/)
  assert.ok(m, 'specs array should be embedded')
  const specs = JSON.parse(m![1]) as { id: string; option: unknown }[]
  assert.equal(specs.length, 1)
  assert.equal(specs[0].id, chartMountId('chart1'))
})

test('reports with no charts contain no chart <script>', () => {
  const html = buildReportHtml(
    baseSchema({
      sections: [
        {
          id: 's',
          layout: 'full',
          blocks: [{ id: 'p', type: 'paragraph', content: 'text only' }],
        },
      ],
    }),
    { echartsScript: 'SHOULD_NOT_APPEAR' },
  )
  assert.doesNotMatch(html, /SHOULD_NOT_APPEAR/)
  assert.doesNotMatch(html, /var specs=/)
})

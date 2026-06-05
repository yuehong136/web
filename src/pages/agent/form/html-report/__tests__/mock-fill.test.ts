import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPreviewSchema } from '../mock-fill'
import { buildReportHtml } from '../renderer/build-report-html'
import type { BlockData, ChartDatum, Section, SkeletonSchema } from '../types'

// fields 是判别联合的 Partial,直接写字面量会触发多余属性检查;测试里统一 cast。
const fields = (value: Record<string, unknown>) => value as Partial<BlockData>

function firstBlock(sections: Section[]) {
  return sections[0].blocks[0] as unknown as Record<string, unknown>
}

test('llm scalar field falls back to its hint when present', () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'p',
            type: 'paragraph',
            fields: fields({ type: 'paragraph', content: '' }),
            fieldDirectives: {
              content: { mode: 'llm', hint: 'quarterly intro' },
            },
          },
        ],
      },
    ],
  }
  const schema = buildPreviewSchema(skeleton)
  assert.equal(firstBlock(schema.sections).content, 'quarterly intro')
})

test('variable scalar field renders the ref as a placeholder token', () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'sc',
            type: 'stat-card',
            fields: fields({ type: 'stat-card', label: 'Revenue', value: '' }),
            fieldDirectives: {
              value: { mode: 'variable', ref: 'n3.output.rev' },
            },
          },
        ],
      },
    ],
  }
  const schema = buildPreviewSchema(skeleton)
  assert.equal(firstBlock(schema.sections).value, '{n3.output.rev}')
})

test('chart with a data directive gets mock rows keyed by shape', () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'c',
            type: 'chart',
            fields: fields({
              type: 'chart',
              chartType: 'line',
              xAxisKey: 'month',
              series: [{ dataKey: 'rev' }],
              data: [],
            }),
            fieldDirectives: { data: { mode: 'llm' } },
          },
        ],
      },
    ],
  }
  const schema = buildPreviewSchema(skeleton)
  const data = firstBlock(schema.sections).data as ChartDatum[]
  assert.equal(data.length, 5)
  assert.ok('month' in data[0])
  assert.ok('rev' in data[0])
})

test('chart with no directive and empty data still gets mock rows (no empty chart)', () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'c',
            type: 'chart',
            fields: fields({
              type: 'chart',
              chartType: 'donut',
              nameKey: 'name',
              valueKey: 'value',
              data: [],
            }),
          },
        ],
      },
    ],
  }
  const schema = buildPreviewSchema(skeleton)
  const data = firstBlock(schema.sections).data as ChartDatum[]
  assert.equal(data.length, 5)
  assert.ok('name' in data[0])
  assert.ok('value' in data[0])
})

test('open-region is substituted by a callout placeholder in preview (no malformed block)', () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'open',
            type: 'open-region',
            annotation: 'First a paragraph, then a pie chart',
          },
        ],
      },
    ],
  }
  const schema = buildPreviewSchema(skeleton)
  const block = firstBlock(schema.sections)
  // 替身是合法 callout(非 open-region),brief 进正文,渲染不抛
  assert.equal(block.type, 'callout')
  assert.ok(String(block.content).includes('First a paragraph'))
  assert.ok(buildReportHtml(schema).includes('<html'))
})

test('hero eyebrow/subtitle + stat-card icon survive preview merge', () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    eyebrow: '2025 年度报告',
    subtitle: '一句话概述',
    headerArt: 'medical',
    headerLayout: 'card',
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'sc',
            type: 'stat-card',
            fields: fields({
              type: 'stat-card',
              label: '总营收',
              value: '745',
              icon: 'money',
            }),
          },
        ],
      },
    ],
  }
  const schema = buildPreviewSchema(skeleton)
  assert.equal(schema.eyebrow, '2025 年度报告')
  assert.equal(schema.subtitle, '一句话概述')
  // 设计器手选的头图 + 排布也须透传,否则预览看不到图文卡
  assert.equal(schema.headerArt, 'medical')
  assert.equal(schema.headerLayout, 'card')
  assert.equal(firstBlock(schema.sections).icon, 'money')
  const html = buildReportHtml(schema)
  // 显式 icon 落进渲染输出（对应的内联 svg 路径出现）
  assert.match(html, /rpt-stat-card__icon/)
  // 头图 + card 排布落进渲染输出（出图 + 图文卡 markup）
  assert.match(html, /rpt__header--card/)
  assert.match(html, /data:image\/jpeg;base64/)
})

test('preview schema renders to a chart-bearing document with parseable specs', () => {
  const skeleton: SkeletonSchema = {
    title: 'Preview',
    sections: [
      {
        id: 's',
        layout: 'full',
        blocks: [
          {
            id: 'c',
            type: 'chart',
            fields: fields({
              type: 'chart',
              chartType: 'bar',
              xAxisKey: 'x',
              series: [{ dataKey: 'y' }],
              data: [],
            }),
            fieldDirectives: { data: { mode: 'llm' } },
          },
        ],
      },
    ],
  }
  const html = buildReportHtml(buildPreviewSchema(skeleton), {
    echartsScript: '/*LIB*/window.echarts={init:function(){}}',
  })
  assert.match(html, /var specs=\[/)
})

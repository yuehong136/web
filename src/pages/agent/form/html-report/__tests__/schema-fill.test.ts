import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSkeletonResponse } from '../designer/ai-skeleton/parse'
import {
  buildFillSchema,
  collectFillPlan,
  fillKey,
  splitFillKey,
  type FillPlan,
} from '../prompt-builder'
import { fillSkeleton, FillError } from '../schema-fill'
import { buildReportHtml } from '../renderer/build-report-html'
import type { FieldDirective } from '../types'

const minimal = (blocks: unknown[]) =>
  JSON.stringify({ title: 'T', sections: [{ layout: 'full', blocks }] })

const LLM: FieldDirective = { mode: 'llm' }

const keyOf = (plan: FillPlan, path: string): string => {
  const item = plan.items.find((i) => i.path === path)
  if (!item) throw new Error(`no fill item for path ${path}`)
  return item.key
}

// ---- prompt-builder ----

test('fillKey / splitFillKey round-trip with bracketed paths', () => {
  const k = fillKey('blk-abc', 'items[0].value')
  assert.equal(k, 'blk-abc__items[0].value')
  assert.deepEqual(splitFillKey(k), {
    blockId: 'blk-abc',
    path: 'items[0].value',
  })
})

test('collectFillPlan: value specs by leaf (text / rows / chart-data)', () => {
  const s = parseSkeletonResponse(
    minimal([
      { type: 'paragraph', hint: 'overview' },
      { type: 'table', headers: ['Year', 'Count'], hint: 'rows' },
      {
        type: 'chart',
        chartType: 'bar',
        xAxisKey: 'year',
        series: [{ dataKey: 'count' }],
        hint: 'trend',
      },
    ]),
  )
  const plan = collectFillPlan(s.sections[0])
  const find = (p: string) => plan.items.find((i) => i.path === p)

  const content = find('content')
  assert.equal(content?.spec.kind, 'text')
  assert.equal(content?.description, 'overview') // 字段 hint

  const rows = find('rows')
  assert.equal(rows?.spec.kind, 'rows')
  if (rows && rows.spec.kind === 'rows') assert.equal(rows.spec.columns, 2)
  assert.equal(rows?.description, 'rows') // 无字段 hint → 回落块注解

  const data = find('data')
  assert.equal(data?.spec.kind, 'chartData')
  if (data && data.spec.kind === 'chartData') {
    assert.equal(data.spec.category, 'year')
    assert.deepEqual(data.spec.values, ['count'])
  }
})

test('collectFillPlan: variant/trend become enum specs with fallback', () => {
  const s = parseSkeletonResponse(
    minimal([
      { type: 'callout', content: 'x', variant: 'warning' },
      { type: 'stat-card', label: 'Revenue' },
    ]),
  )
  const callout = s.sections[0].blocks[0]
  callout.fieldDirectives = { ...callout.fieldDirectives, variant: LLM }
  const stat = s.sections[0].blocks[1]
  stat.fieldDirectives = { ...stat.fieldDirectives, trend: LLM }

  const plan = collectFillPlan(s.sections[0])
  const variant = plan.items.find((i) => i.path === 'variant')
  assert.equal(variant?.spec.kind, 'enum')
  if (variant && variant.spec.kind === 'enum') {
    assert.equal(variant.spec.fallback, 'info')
    assert.ok(variant.spec.options.includes('warning'))
  }
  const trend = plan.items.find((i) => i.path === 'trend')
  assert.equal(trend?.spec.kind, 'enum')
  if (trend && trend.spec.kind === 'enum') {
    assert.equal(trend.spec.fallback, 'neutral')
  }
})

test('buildFillSchema: table rows → string[][] with fixed columns', () => {
  const s = parseSkeletonResponse(
    minimal([{ type: 'table', headers: ['A', 'B', 'C'], hint: 'x' }]),
  )
  const plan = collectFillPlan(s.sections[0])
  const schema = buildFillSchema(plan)
  assert.equal(schema.type, 'object')
  assert.equal(schema.additionalProperties, false)
  const props = schema.properties as Record<string, Record<string, unknown>>
  const prop = props[keyOf(plan, 'rows')]
  assert.equal(prop.type, 'array')
  const inner = prop.items as Record<string, unknown>
  assert.equal(inner.minItems, 3)
  assert.equal(inner.maxItems, 3)
})

// ---- schema-fill ----

test('fillSkeleton: fills llm slots from model JSON, merges + renders', async () => {
  const s = parseSkeletonResponse(
    minimal([
      { type: 'heading', level: 2, content: 'Scale' },
      { type: 'paragraph', hint: 'overview' },
      { type: 'table', headers: ['Year', 'Count'], hint: 'rows' },
      {
        type: 'chart',
        chartType: 'bar',
        xAxisKey: 'year',
        series: [{ dataKey: 'count' }],
        hint: 'trend',
      },
    ]),
  )
  const plan = collectFillPlan(s.sections[0])
  const resp: Record<string, unknown> = {}
  for (const item of plan.items) {
    if (item.spec.kind === 'text') resp[item.key] = 'filled text'
    else if (item.spec.kind === 'rows')
      resp[item.key] = [
        ['2021', '12000'],
        ['2022', '15000'],
      ]
    else if (item.spec.kind === 'chartData')
      resp[item.key] = [
        { [item.spec.category]: '2021', [item.spec.values[0]]: 12000 },
      ]
  }

  let calls = 0
  const result = await fillSkeleton(s, {
    sourceText: 'enrollment grew from 12k to 15k...',
    resolveRef: () => undefined,
    callLLM: async () => {
      calls += 1
      return JSON.stringify(resp)
    },
  })

  assert.equal(calls, 1) // 单节 → 一次调用
  assert.equal(result.llmSections, 1)
  assert.equal(result.okSections, 1)
  assert.equal(result.errors.length, 0)

  const blocks = result.schema.sections[0].blocks
  const para = blocks[1]
  if (para.type === 'paragraph') assert.equal(para.content, 'filled text')
  const table = blocks[2]
  if (table.type === 'table') {
    assert.deepEqual(table.rows, [
      ['2021', '12000'],
      ['2022', '15000'],
    ])
  }
  const chart = blocks[3]
  if (chart.type === 'chart') {
    assert.equal(chart.data.length, 1)
    assert.equal(chart.data[0].year, '2021')
    assert.equal(chart.data[0].count, 12000)
  }
  assert.ok(buildReportHtml(result.schema).includes('<html'))
})

test('fillSkeleton: enum — invalid → fallback, missing → keeps skeleton static', async () => {
  const make = () => {
    const s = parseSkeletonResponse(
      minimal([{ type: 'callout', content: 'x', variant: 'warning' }]),
    )
    const c = s.sections[0].blocks[0]
    c.fieldDirectives = { ...c.fieldDirectives, variant: LLM }
    return s
  }

  // 非法值 → 回落 info
  const s1 = make()
  const vkey = keyOf(collectFillPlan(s1.sections[0]), 'variant')
  const r1 = await fillSkeleton(s1, {
    sourceText: 'x',
    resolveRef: () => undefined,
    callLLM: async () => JSON.stringify({ [vkey]: 'bogus' }),
  })
  const c1 = r1.schema.sections[0].blocks[0]
  if (c1.type === 'callout') assert.equal(c1.variant, 'info')

  // 缺键 → 保骨架静态 'warning'
  const s2 = make()
  const r2 = await fillSkeleton(s2, {
    sourceText: 'x',
    resolveRef: () => undefined,
    callLLM: async () => JSON.stringify({}),
  })
  const c2 = r2.schema.sections[0].blocks[0]
  if (c2.type === 'callout') assert.equal(c2.variant, 'warning')
})

test('fillSkeleton: variable fields resolved via resolveRef (no LLM)', async () => {
  const s = parseSkeletonResponse(minimal([{ type: 'paragraph', hint: 'x' }]))
  const p = s.sections[0].blocks[0]
  p.fieldDirectives = {
    content: { mode: 'variable', ref: '{n1.out.summary}' },
  }
  let llmCalled = false
  const r = await fillSkeleton(s, {
    sourceText: 'x',
    resolveRef: (ref) =>
      ref === '{n1.out.summary}' ? 'resolved value' : undefined,
    callLLM: async () => {
      llmCalled = true
      return '{}'
    },
  })
  assert.equal(llmCalled, false) // 无 llm 槽 → 不调模型
  assert.equal(r.llmSections, 0)
  const para = r.schema.sections[0].blocks[0]
  if (para.type === 'paragraph') assert.equal(para.content, 'resolved value')
})

test('fillSkeleton: a section with bad model output is recorded + skipped', async () => {
  const s = parseSkeletonResponse(
    JSON.stringify({
      title: 'T',
      sections: [
        { layout: 'full', blocks: [{ type: 'paragraph', hint: 'a' }] },
        { layout: 'full', blocks: [{ type: 'paragraph', hint: 'b' }] },
      ],
    }),
  )
  const key2 = keyOf(collectFillPlan(s.sections[1]), 'content')
  const responses = ['totally not json', JSON.stringify({ [key2]: 'second' })]
  let call = 0
  const r = await fillSkeleton(s, {
    sourceText: 'x',
    resolveRef: () => undefined,
    callLLM: async () => responses[call++],
  })

  assert.equal(r.llmSections, 2)
  assert.equal(r.okSections, 1)
  assert.equal(r.errors.length, 1)
  assert.ok(r.errors[0] instanceof FillError)
  const p2 = r.schema.sections[1].blocks[0]
  if (p2.type === 'paragraph') assert.equal(p2.content, 'second')
  const p1 = r.schema.sections[0].blocks[0]
  if (p1.type === 'paragraph') assert.equal(p1.content, undefined) // 失败节未填
})

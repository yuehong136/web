import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildReportHtml } from '../renderer/build-report-html'
import {
  collectPendingFills,
  getFieldValue,
  mergeBlock,
  mergeSkeleton,
  resolveDirective,
  setDirective,
  setFieldValue,
  summarizeSkeleton,
} from '../skeleton-utils'
import type { BlockData, SkeletonBlock, SkeletonSchema } from '../types'

// fields 是判别联合的 Partial,直接写字面量会触发多余属性检查;测试里统一 cast。
const fields = (value: Record<string, unknown>) => value as Partial<BlockData>

test('setFieldValue / getFieldValue round-trip nested array paths', () => {
  const a = setFieldValue({}, 'items[0].value', 'X')
  assert.equal(getFieldValue(a, 'items[0].value'), 'X')

  const b = setFieldValue(a, 'series[1].dataKey', 'rev')
  assert.equal(getFieldValue(b, 'series[1].dataKey'), 'rev')
  // 稀疏:series[0] 未写 → undefined
  assert.equal(getFieldValue(b, 'series[0].dataKey'), undefined)
})

test('setFieldValue is immutable', () => {
  const original = { title: 'a', items: [{ value: '1' }] }
  const next = setFieldValue(original, 'items[0].value', '2')
  assert.equal(original.items[0].value, '1')
  assert.equal(getFieldValue(next, 'items[0].value'), '2')
  assert.notEqual(original, next)
})

test('getFieldValue returns undefined on missing/typed-mismatch segments', () => {
  assert.equal(getFieldValue({ a: 1 }, 'a.b'), undefined)
  assert.equal(getFieldValue({ a: [1] }, 'a.b'), undefined)
  assert.equal(getFieldValue(undefined, 'x'), undefined)
})

test('resolveDirective defaults to static; setDirective adds and clears', () => {
  const block: SkeletonBlock = { id: 'b', type: 'stat-card' }
  assert.deepEqual(resolveDirective(block, 'value'), { mode: 'static' })

  const withLlm = setDirective(block, 'value', { mode: 'llm', hint: 'Q3' })
  assert.deepEqual(resolveDirective(withLlm, 'value'), {
    mode: 'llm',
    hint: 'Q3',
  })

  // static / null 均清回默认(从 map 移除)
  const cleared = setDirective(withLlm, 'value', { mode: 'static' })
  assert.equal(cleared.fieldDirectives?.value, undefined)
  assert.equal(
    setDirective(withLlm, 'value', null).fieldDirectives?.value,
    undefined,
  )
})

test('mergeBlock re-attaches role and overrides static fields with filled values', () => {
  const block: SkeletonBlock = {
    id: 'h1',
    type: 'heading',
    role: 'main',
    fields: fields({ type: 'heading', level: 2, content: 'static' }),
  }
  const merged = mergeBlock(block, { content: 'filled' })
  assert.deepEqual(merged, {
    type: 'heading',
    level: 2,
    content: 'filled',
    id: 'h1',
    role: 'main',
  })
})

test('mergeBlock injects chart data while keeping shape fields', () => {
  const chart: SkeletonBlock = {
    id: 'c1',
    type: 'chart',
    fields: fields({
      type: 'chart',
      chartType: 'bar',
      xAxisKey: 'm',
      series: [{ dataKey: 'v' }],
      data: [],
    }),
  }
  const merged = mergeBlock(chart, { data: [{ m: 'Jan', v: 10 }] }) as {
    chartType: string
    xAxisKey: string
    data: unknown[]
  }
  assert.equal(merged.chartType, 'bar')
  assert.equal(merged.xAxisKey, 'm')
  assert.deepEqual(merged.data, [{ m: 'Jan', v: 10 }])
})

function sampleSkeleton(): SkeletonSchema {
  return {
    title: 'T',
    sections: [
      {
        id: 's1',
        layout: 'full',
        blocks: [
          {
            id: 'h',
            type: 'heading',
            fields: fields({ type: 'heading', level: 2, content: 'Hello' }),
          },
          {
            id: 'p',
            type: 'paragraph',
            fields: fields({ type: 'paragraph', content: '' }),
            fieldDirectives: { content: { mode: 'llm', hint: 'intro' } },
          },
          {
            id: 'c',
            type: 'chart',
            fields: fields({
              type: 'chart',
              chartType: 'bar',
              xAxisKey: 'm',
              series: [{ dataKey: 'v' }],
              data: [],
            }),
            fieldDirectives: { data: { mode: 'llm' } },
          },
        ],
      },
    ],
  }
}

test('collectPendingFills gathers only non-static directives', () => {
  const fills = collectPendingFills(sampleSkeleton())
  assert.equal(fills.length, 2)
  assert.deepEqual(fills.map((f) => `${f.blockId}:${f.path}`).sort(), [
    'c:data',
    'p:content',
  ])
})

test('summarizeSkeleton counts sections/blocks/charts/openRegions/pending', () => {
  assert.deepEqual(summarizeSkeleton(sampleSkeleton()), {
    sections: 1,
    blocks: 3,
    charts: 1,
    openRegions: 0,
    pending: 2,
  })
})

test('mergeSkeleton output feeds buildReportHtml into a valid document', () => {
  const schema = mergeSkeleton(sampleSkeleton(), {
    p: { content: 'filled intro' },
    c: { data: [{ m: 'Jan', v: 10 }] },
  })
  const html = buildReportHtml(schema)
  assert.ok(html.startsWith('<!DOCTYPE html>'))
  assert.match(html, /rpt-heading--2/)
  assert.match(html, /filled intro/)
})

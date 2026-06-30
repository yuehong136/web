import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ChartBlock } from '../../types'
import { buildChartOption } from '../echarts-option'

function radarBlock(values: number[]): ChartBlock {
  return {
    id: 'c1',
    type: 'chart',
    chartType: 'radar',
    data: values.map((value, i) => ({ dimension: `维度${i + 1}`, value })),
    radarKeys: ['dimension'],
    series: [{ dataKey: 'value' }],
  }
}

type Indicator = { name: string; max: number }

function indicatorsOf(block: ChartBlock): Indicator[] {
  const option = buildChartOption(block) as {
    radar: { indicator: Indicator[] }
  }
  return option.radar.indicator
}

test('radar: all axes share one max so a 1-score cannot hit the outer ring', () => {
  // 回归:不设 max 时 ECharts 按轴各自定刻度,5/4/4/1/4 里 1 分轴会画到最外圈
  const indicators = indicatorsOf(radarBlock([5, 4, 4, 1, 4]))
  assert.equal(indicators.length, 5)
  for (const ind of indicators) assert.equal(ind.max, 5)
})

test('radar: shared max rounds up to a nice ceiling (percent scale -> 100)', () => {
  const indicators = indicatorsOf(radarBlock([98.2, 60, 75.5]))
  for (const ind of indicators) assert.equal(ind.max, 100)
})

test('radar: all-zero data still yields a positive max', () => {
  const indicators = indicatorsOf(radarBlock([0, 0, 0]))
  for (const ind of indicators) assert.equal(ind.max, 1)
})

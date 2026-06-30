/**
 * ChartBlock → ECharts `option` 对象。纯函数，零 DOM。
 *
 * 我们只写「配置 + 数据行 → option」的翻译，不手画 SVG；绘制交给
 * `build-report-html` 注入的 `echarts.init(dom,null,{renderer:'svg'}).setOption(option)`。
 *
 * 8 种 chartType 全覆盖（含 echarts 原生 funnel/radar）。
 */
import type { EChartsCoreOption } from 'echarts'
import type { ChartBlock, ChartDatum, ChartSeries, ThemeConfig } from '../types'
import { DEFAULT_THEME } from '../constants'

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function palette(theme?: ThemeConfig): string[] {
  return theme?.colorPalette && theme.colorPalette.length > 0
    ? theme.colorPalette
    : DEFAULT_THEME.colorPalette
}

const baseTooltip = (trigger: 'axis' | 'item') => ({ trigger })
const baseGrid = {
  left: '3%',
  right: '4%',
  bottom: '3%',
  top: 48,
  containLabel: true,
}

function cartesianOption(
  block: ChartBlock,
  theme: ThemeConfig | undefined,
  isArea: boolean,
  isLine: boolean,
): EChartsCoreOption {
  const data = block.data ?? []
  const series = block.series ?? []
  const categories = block.xAxisKey
    ? data.map((d) => d[block.xAxisKey as string])
    : []
  return {
    color: palette(theme),
    tooltip: baseTooltip('axis'),
    legend: { show: series.length > 1, top: 8 },
    grid: baseGrid,
    xAxis: { type: 'category', data: categories },
    yAxis: {
      type: 'value',
      name: block.yAxisLabel,
      nameLocation: 'end',
    },
    series: series.map((s: ChartSeries) => ({
      name: s.name ?? s.dataKey,
      type: isLine || isArea ? 'line' : 'bar',
      smooth: isLine || isArea,
      areaStyle: isArea ? {} : undefined,
      itemStyle: s.color ? { color: s.color } : undefined,
      data: data.map((d) => num(d[s.dataKey])),
    })),
  }
}

function proportionOption(
  block: ChartBlock,
  theme: ThemeConfig | undefined,
  isDonut: boolean,
): EChartsCoreOption {
  const data = block.data ?? []
  const seriesData = data.map((d) => ({
    name: String(d[block.nameKey as string] ?? ''),
    value: num(d[block.valueKey as string]),
  }))
  return {
    color: palette(theme),
    tooltip: baseTooltip('item'),
    legend: { show: true, bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: isDonut ? ['52%', '74%'] : '70%',
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        label: { formatter: '{b} {d}%' },
        data: seriesData,
      },
    ],
  }
}

function funnelOption(
  block: ChartBlock,
  theme: ThemeConfig | undefined,
): EChartsCoreOption {
  const data = block.data ?? []
  const seriesData = data.map((d) => ({
    name: String(d[block.nameKey as string] ?? ''),
    value: num(d[block.valueKey as string]),
  }))
  return {
    color: palette(theme),
    tooltip: baseTooltip('item'),
    legend: { show: true, bottom: 0 },
    series: [
      {
        type: 'funnel',
        left: '10%',
        right: '10%',
        top: 24,
        bottom: 32,
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside', formatter: '{b}: {c}' },
        data: seriesData,
      },
    ],
  }
}

/** 雷达轴统一刻度的上限:最大值向上取整到 1/2/5×10^k(1–5 分制 → 5,百分制 → 100)。 */
function niceCeil(value: number): number {
  if (value <= 0) return 1
  const base = 10 ** Math.floor(Math.log10(value))
  const unit = value / base
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * base
}

function radarOption(
  block: ChartBlock,
  theme: ThemeConfig | undefined,
): EChartsCoreOption {
  const data = block.data ?? []
  const series = block.series ?? []
  const dimensionKey = block.radarKeys?.[0]
  // 全轴必须共用同一 max:不设时 ECharts 按轴各自定刻度,低分轴(自动 max=自身值)
  // 会顶到最外圈,与高分轴等长,图形失真(5/4/4/1/4 画成近满五边形)。
  const max = niceCeil(
    Math.max(0, ...series.flatMap((s) => data.map((d) => num(d[s.dataKey])))),
  )
  const indicators = dimensionKey
    ? data.map((d) => ({ name: String(d[dimensionKey] ?? ''), max }))
    : []
  return {
    color: palette(theme),
    tooltip: baseTooltip('item'),
    legend: { show: series.length > 1, top: 8 },
    radar: { indicator: indicators, radius: '62%' },
    series: [
      {
        type: 'radar',
        data: series.map((s: ChartSeries) => ({
          name: s.name ?? s.dataKey,
          value: data.map((d) => num(d[s.dataKey])),
          itemStyle: s.color ? { color: s.color } : undefined,
        })),
      },
    ],
  }
}

function scatterOption(
  block: ChartBlock,
  theme: ThemeConfig | undefined,
): EChartsCoreOption {
  const data = block.data ?? []
  const series = block.series ?? []
  return {
    color: palette(theme),
    tooltip: baseTooltip('item'),
    legend: { show: series.length > 1, top: 8 },
    grid: baseGrid,
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: series.map((s: ChartSeries) => ({
      name: s.name ?? s.dataKey,
      type: 'scatter',
      itemStyle: s.color ? { color: s.color } : undefined,
      data: data.map((d: ChartDatum) => [
        num(d[s.xKey ?? '']),
        num(d[s.yKey ?? '']),
      ]),
    })),
  }
}

/**
 * ChartBlock → ECharts option。未知 chartType 退化为空柱状图。
 * @param theme 取自 ReportSchema 顶层，用于调色板。
 */
export function buildChartOption(
  block: ChartBlock,
  theme?: ThemeConfig,
): EChartsCoreOption {
  switch (block.chartType) {
    case 'bar':
      return cartesianOption(block, theme, false, false)
    case 'line':
      return cartesianOption(block, theme, false, true)
    case 'area':
      return cartesianOption(block, theme, true, true)
    case 'pie':
      return proportionOption(block, theme, false)
    case 'donut':
      return proportionOption(block, theme, true)
    case 'funnel':
      return funnelOption(block, theme)
    case 'radar':
      return radarOption(block, theme)
    case 'scatter':
      return scatterOption(block, theme)
    default:
      return {
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: [],
      }
  }
}

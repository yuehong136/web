/**
 * 新建 Block 的默认结构。chart 默认带一个 `data` 的 llm 指令(决策 #24:用户定形状、
 * LLM 填数据行);其余字段默认 static 空,由用户在 Inspector 决定填法。
 */
import { makeId } from '../skeleton-utils'
import type {
  BlockData,
  BlockKind,
  BlockRole,
  ChartType,
  FieldDirective,
  SkeletonBlock,
} from '../types'

type Fields = Partial<BlockData>

function chartFields(chartType: ChartType): Fields {
  const base = { type: 'chart', chartType, data: [] }
  if (chartType === 'pie' || chartType === 'donut' || chartType === 'funnel') {
    return { ...base, nameKey: 'name', valueKey: 'value' } as Fields
  }
  if (chartType === 'radar') {
    return {
      ...base,
      radarKeys: ['dimension'],
      series: [{ dataKey: 'value' }],
    } as Fields
  }
  if (chartType === 'scatter') {
    return {
      ...base,
      series: [{ dataKey: 'points', xKey: 'x', yKey: 'y' }],
    } as Fields
  }
  return { ...base, xAxisKey: 'x', series: [{ dataKey: 'y' }] } as Fields
}

const DEFAULT_FIELDS: Record<BlockKind, () => Fields> = {
  heading: () => ({ type: 'heading', level: 2, content: '' }) as Fields,
  paragraph: () => ({ type: 'paragraph', content: '' }) as Fields,
  callout: () => ({ type: 'callout', variant: 'info', content: '' }) as Fields,
  list: () => ({ type: 'list', ordered: false, items: [] }) as Fields,
  'stat-card': () => ({ type: 'stat-card', label: '', value: '' }) as Fields,
  'stat-card-group': () =>
    ({ type: 'stat-card-group', items: [{ label: '', value: '' }] }) as Fields,
  table: () => ({ type: 'table', headers: ['', ''], rows: [] }) as Fields,
  'comparison-matrix': () =>
    ({ type: 'comparison-matrix', items: ['', ''], criteria: [] }) as Fields,
  timeline: () => ({ type: 'timeline', items: [] }) as Fields,
  chart: () => chartFields('bar'),
}

export function createDefaultBlock(
  type: BlockKind,
  role?: BlockRole,
  chartType?: ChartType,
): SkeletonBlock {
  const block: SkeletonBlock = {
    id: makeId('blk'),
    type,
    fields:
      type === 'chart' && chartType
        ? chartFields(chartType)
        : DEFAULT_FIELDS[type](),
  }
  if (role) block.role = role
  if (type === 'chart') {
    const directive: FieldDirective = { mode: 'llm' }
    block.fieldDirectives = { data: directive }
  }
  return block
}

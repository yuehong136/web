/**
 * 新建 Block 的默认结构。"整段数据"型字段(chart 的 data、table 的 rows、
 * comparison 的 criteria)默认带一个 llm 指令(决策 #24:用户定形状/列头、LLM 填数据);
 * 其余字段默认 static 空,由用户在 Inspector 决定填法。
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

/** 按图表类型造默认形状字段(形状全 static,data 留空待指令填) */
export function buildChartFields(chartType: ChartType): Fields {
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
  chart: () => buildChartFields('bar'),
  // 生成区无固定字段:brief 存于 block.annotation,运行时由模型展开成真块。
  'open-region': () => ({}) as Fields,
}

/** 默认就交给模型填的"整段数据"字段路径(其余字段默认 static) */
const DEFAULT_LLM_PATH: Partial<Record<BlockKind, string>> = {
  chart: 'data',
  table: 'rows',
  'comparison-matrix': 'criteria',
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
        ? buildChartFields(chartType)
        : DEFAULT_FIELDS[type](),
  }
  if (role) block.role = role
  const llmPath = DEFAULT_LLM_PATH[type]
  if (llmPath) {
    const directive: FieldDirective = { mode: 'llm' }
    block.fieldDirectives = { [llmPath]: directive }
  }
  return block
}

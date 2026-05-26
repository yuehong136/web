/**
 * 把 LLM 给的「扁平块」JSON 归一成 {@link SkeletonBlock}(框架静态 / 内容 llm 指令)。
 * 从 parse.ts 拆出,供「整篇回退解析」与「逐节解析」共用,并控制各文件行数。
 *
 * 决策 B「纯模板」:结构性字段落 `fields` 静态;变量内容转 `fieldDirectives` 的 `llm` 指令。
 * 提示词(`hint`)按块归属落位、不重复:
 *  - 单内容块(段落/标注/单指标卡):落到该内容字段的 `llm.hint`,不写块级 `annotation`。
 *  - 多字段块(图表/表格/对比/指标卡组/时间线/列表):落到块级 `annotation`(整块说明),
 *    其整段/逐项指令留空 `llm()`(供右栏手动细化,或运行时回落到 annotation)。
 * 缺失框架用默认兜底,不丢弃块(尤其图表不再因缺数据被丢)。
 */
import { makeId } from '../../skeleton-utils'
import type {
  BlockData,
  BlockKind,
  FieldDirective,
  SkeletonBlock,
} from '../../types'
import { buildChartFields } from '../block-defaults'
import { ANNOTATABLE_BLOCKS } from '../block-meta'
import {
  BLOCK_KINDS,
  CARTESIAN,
  CHART_TYPES,
  type Dict,
  type Fields,
  isObj,
  level,
  oneOf,
  optEnum,
  optStr,
  PROPORTION,
  str,
  strArr,
  TRENDS,
  VARIANTS,
} from './coerce'

/** 内容字段的 llm 填充指令;hint 为空则省略(运行时回落到 block/section annotation)。 */
const llm = (hint?: string): FieldDirective =>
  hint && hint.trim() ? { mode: 'llm', hint } : { mode: 'llm' }

/** chart 系列的形状键(不含数据);保留命名键,丢弃非法项。 */
function normSeries(v: unknown): Fields[] {
  if (!Array.isArray(v)) return []
  return v.filter(isObj).map((s) => {
    const out: Fields = { dataKey: str(s.dataKey) }
    if (optStr(s.name)) out.name = s.name
    if (optStr(s.xKey)) out.xKey = s.xKey
    if (optStr(s.yKey)) out.yKey = s.yKey
    return out
  })
}

interface Built {
  fields: Fields
  directives: Record<string, FieldDirective>
}

/** chart:形状键静态(缺则 buildChartFields 兜底),data 作整段 llm 指令(说明落块注解)。 */
function buildChart(raw: Dict): Built {
  const chartType = optEnum(raw.chartType, CHART_TYPES) ?? 'bar'
  const fields = { ...(buildChartFields(chartType) as Fields) }
  if (optStr(raw.title)) fields.title = raw.title
  if (CARTESIAN.has(chartType)) {
    if (optStr(raw.xAxisKey)) fields.xAxisKey = raw.xAxisKey
    const series = normSeries(raw.series)
    if (series.length > 0) fields.series = series
  } else if (PROPORTION.has(chartType)) {
    if (optStr(raw.nameKey)) fields.nameKey = raw.nameKey
    if (optStr(raw.valueKey)) fields.valueKey = raw.valueKey
  } else if (chartType === 'radar') {
    const radarKeys = strArr(raw.radarKeys)
    if (radarKeys.length > 0) fields.radarKeys = radarKeys
    const series = normSeries(raw.series)
    if (series.length > 0) fields.series = series
  } else {
    const series = normSeries(raw.series).filter(
      (s) => typeof s.xKey === 'string' && typeof s.yKey === 'string',
    )
    if (series.length > 0) fields.series = series
  }
  return { fields, directives: { data: llm() } }
}

/** 按块类型造「框架 fields + 内容 directives」。 */
function buildBlock(type: BlockKind, raw: Dict, hint?: string): Built {
  switch (type) {
    case 'heading':
      return {
        fields: { type, level: level(raw.level), content: str(raw.content) },
        directives: {},
      }
    case 'callout': {
      const fields: Fields = {
        type,
        variant: oneOf(raw.variant, VARIANTS, 'info'),
      }
      if (optStr(raw.title)) fields.title = raw.title
      return { fields, directives: { content: llm(hint) } }
    }
    case 'list': {
      const items = strArr(raw.items)
      const slots = items.length > 0 ? items : ['']
      const fields: Fields = {
        type,
        ordered: raw.ordered === true,
        items: slots,
      }
      if (optStr(raw.title)) fields.title = raw.title
      const directives: Record<string, FieldDirective> = {}
      slots.forEach((txt, i) => (directives[`items[${i}]`] = llm(txt)))
      return { fields, directives }
    }
    case 'stat-card': {
      const fields: Fields = { type, label: str(raw.label) }
      const trend = optEnum(raw.trend, TRENDS)
      if (trend) fields.trend = trend
      return { fields, directives: { value: llm(hint) } }
    }
    case 'stat-card-group': {
      const raws = Array.isArray(raw.items) ? raw.items.filter(isObj) : []
      const items = (raws.length > 0 ? raws : [{} as Dict]).map((it) => {
        const card: Fields = { label: str(it.label) }
        const trend = optEnum(it.trend, TRENDS)
        if (trend) card.trend = trend
        return card
      })
      const directives: Record<string, FieldDirective> = {}
      items.forEach((_, i) => (directives[`items[${i}].value`] = llm()))
      return { fields: { type, items }, directives }
    }
    case 'table': {
      const headers = strArr(raw.headers)
      const fields: Fields = {
        type,
        headers: headers.length > 0 ? headers : ['', ''],
      }
      if (optStr(raw.title)) fields.title = raw.title
      return { fields, directives: { rows: llm() } }
    }
    case 'comparison-matrix': {
      const items = strArr(raw.items)
      const fields: Fields = {
        type,
        items: items.length > 0 ? items : ['', ''],
      }
      if (optStr(raw.title)) fields.title = raw.title
      return { fields, directives: { criteria: llm() } }
    }
    case 'timeline': {
      const raws = Array.isArray(raw.items) ? raw.items.filter(isObj) : []
      const items = (raws.length > 0 ? raws : [{} as Dict]).map((it) => ({
        date: str(it.date),
      }))
      const fields: Fields = { type, items }
      if (optStr(raw.title)) fields.title = raw.title
      const directives: Record<string, FieldDirective> = {}
      items.forEach((_, i) => (directives[`items[${i}].title`] = llm()))
      return { fields, directives }
    }
    case 'chart':
      return buildChart(raw)
    case 'paragraph':
    default:
      return {
        fields: { type: 'paragraph' },
        directives: { content: llm(hint) },
      }
  }
}

/** 扁平块 → SkeletonBlock;非对象返回 null(其余一律兜底,不丢)。 */
export function normalizeBlock(
  raw: unknown,
  sidebar: boolean,
): SkeletonBlock | null {
  if (!isObj(raw)) return null
  const type = oneOf(raw.type, BLOCK_KINDS, 'paragraph')
  const hint = optStr(raw.hint)
  const { fields, directives } = buildBlock(type, raw, hint)
  const block: SkeletonBlock = {
    id: makeId('blk'),
    type,
    fields: fields as Partial<BlockData>,
  }
  if (Object.keys(directives).length > 0) block.fieldDirectives = directives
  if (sidebar) block.role = raw.role === 'side' ? 'side' : 'main'
  // 多字段块:整块说明落 annotation(单内容块的 hint 已在字段指令上,避免重复)
  if (hint && ANNOTATABLE_BLOCKS.has(type)) block.annotation = hint
  return block
}

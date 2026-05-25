/**
 * 把 LLM 返回的文本解析、校验、归一化成合法 {@link SkeletonSchema}。
 *
 * LLM 的 JSON 不可靠:可能带 markdown 围栏/散文、字段缺失、枚举非法、图表形状不全。
 * 这里防御式处理——产出的骨架必须能直接喂进 Designer 画布与渲染器,不崩。
 * 决策 A「导入式」:全部内容落 `fields` 静态值,**不写任何 fieldDirectives**。
 */
import { DEFAULT_THEME } from '../../constants'
import { makeId } from '../../skeleton-utils'
import type {
  BlockData,
  BlockKind,
  SkeletonBlock,
  SkeletonSchema,
  SkeletonSection,
  ThemeConfig,
} from '../../types'
import {
  BLOCK_KINDS,
  CARTESIAN,
  CHART_TYPES,
  type Dict,
  type Fields,
  isObj,
  LAYOUTS,
  level,
  oneOf,
  optEnum,
  optStr,
  PROPORTION,
  SIDEBAR,
  str,
  strArr,
  TRENDS,
  VARIANTS,
} from './coerce'

/** 解析失败(无法定位/解析 JSON,或归一化后无任何合法 section)。 */
export class SkeletonParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SkeletonParseError'
  }
}

// ---- JSON 提取 ----
function extractJson(raw: string): unknown {
  // 推理模型会把思考写进 <think>…</think>(EnhancedSSEParser 注入),其中可能含 {}
  // 干扰下面的花括号定位,先整体剥掉(含未闭合的尾段)。
  let text = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new SkeletonParseError('no JSON object found in model output')
  }
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new SkeletonParseError('model output is not valid JSON')
  }
}

// ---- 子数组归一化 ----
function normStatItems(v: unknown): Fields[] {
  if (!Array.isArray(v)) return []
  return v.filter(isObj).map((it) => {
    const item: Fields = { label: str(it.label), value: str(it.value) }
    if (optStr(it.change)) item.change = it.change
    const trend = optEnum(it.trend, TRENDS)
    if (trend) item.trend = trend
    if (optStr(it.description)) item.description = it.description
    return item
  })
}

function normRows(v: unknown): string[][] {
  if (!Array.isArray(v)) return []
  return v.filter((r): r is unknown[] => Array.isArray(r)).map((r) => strArr(r))
}

function normCriteria(v: unknown): Fields[] {
  if (!Array.isArray(v)) return []
  return v
    .filter(isObj)
    .map((c) => ({ name: str(c.name), values: strArr(c.values) }))
}

function normTimeline(v: unknown): Fields[] {
  if (!Array.isArray(v)) return []
  return v.filter(isObj).map((it) => {
    const item: Fields = { date: str(it.date), title: str(it.title) }
    if (optStr(it.description)) item.description = it.description
    return item
  })
}

function normSeries(v: unknown): Fields[] {
  if (!Array.isArray(v)) return []
  return v.filter(isObj).map((s) => {
    const out: Fields = { dataKey: str(s.dataKey) }
    if (optStr(s.name)) out.name = s.name
    if (optStr(s.xKey)) out.xKey = s.xKey
    if (optStr(s.yKey)) out.yKey = s.yKey
    if (optStr(s.color)) out.color = s.color
    return out
  })
}

/** chart 数据行:仅保留对象行,值收敛为 string|number。 */
function normData(v: unknown): Record<string, string | number>[] {
  if (!Array.isArray(v)) return []
  const rows: Record<string, string | number>[] = []
  for (const r of v) {
    if (!isObj(r)) continue
    const row: Record<string, string | number> = {}
    for (const [k, val] of Object.entries(r)) {
      if (typeof val === 'number' && Number.isFinite(val)) row[k] = val
      else if (typeof val === 'string') row[k] = val
      else if (typeof val === 'boolean') row[k] = String(val)
    }
    rows.push(row)
  }
  return rows
}

// ---- 块归一化 ----
/** 非 chart 块的 fields。 */
function buildFields(type: BlockKind, raw: Dict): Fields {
  switch (type) {
    case 'heading':
      return { type, level: level(raw.level), content: str(raw.content) }
    case 'callout': {
      const f: Fields = {
        type,
        variant: oneOf(raw.variant, VARIANTS, 'info'),
        content: str(raw.content),
      }
      if (optStr(raw.title)) f.title = raw.title
      return f
    }
    case 'list': {
      const f: Fields = {
        type,
        ordered: raw.ordered === true,
        items: strArr(raw.items),
      }
      if (optStr(raw.title)) f.title = raw.title
      return f
    }
    case 'stat-card': {
      const f: Fields = { type, label: str(raw.label), value: str(raw.value) }
      if (optStr(raw.change)) f.change = raw.change
      const trend = optEnum(raw.trend, TRENDS)
      if (trend) f.trend = trend
      if (optStr(raw.description)) f.description = raw.description
      return f
    }
    case 'stat-card-group':
      return { type, items: normStatItems(raw.items) }
    case 'table': {
      const f: Fields = {
        type,
        headers: strArr(raw.headers),
        rows: normRows(raw.rows),
      }
      if (optStr(raw.title)) f.title = raw.title
      return f
    }
    case 'comparison-matrix': {
      const f: Fields = {
        type,
        items: strArr(raw.items),
        criteria: normCriteria(raw.criteria),
      }
      if (optStr(raw.title)) f.title = raw.title
      return f
    }
    case 'timeline': {
      const f: Fields = { type, items: normTimeline(raw.items) }
      if (optStr(raw.title)) f.title = raw.title
      return f
    }
    case 'paragraph':
    default:
      return { type: 'paragraph', content: str(raw.content) }
  }
}

/** chart 块的 fields;形状键/数据不全则返回 null(丢弃该块)。 */
function buildChart(raw: Dict): Fields | null {
  const chartType = optEnum(raw.chartType, CHART_TYPES)
  if (!chartType) return null
  const data = normData(raw.data)
  if (data.length === 0) return null

  const f: Fields = { type: 'chart', chartType, data }
  if (optStr(raw.title)) f.title = raw.title

  if (CARTESIAN.has(chartType)) {
    const xAxisKey = optStr(raw.xAxisKey)
    const series = normSeries(raw.series)
    if (!xAxisKey || series.length === 0) return null
    f.xAxisKey = xAxisKey
    f.series = series
    if (optStr(raw.yAxisLabel)) f.yAxisLabel = raw.yAxisLabel
  } else if (PROPORTION.has(chartType)) {
    const nameKey = optStr(raw.nameKey)
    const valueKey = optStr(raw.valueKey)
    if (!nameKey || !valueKey) return null
    f.nameKey = nameKey
    f.valueKey = valueKey
  } else if (chartType === 'radar') {
    const radarKeys = strArr(raw.radarKeys)
    const series = normSeries(raw.series)
    if (radarKeys.length === 0 || series.length === 0) return null
    f.radarKeys = radarKeys
    f.series = series
  } else {
    // scatter:每个系列必须带 xKey/yKey
    const series = normSeries(raw.series).filter(
      (s) => typeof s.xKey === 'string' && typeof s.yKey === 'string',
    )
    if (series.length === 0) return null
    f.series = series
  }
  return f
}

function normalizeBlock(raw: unknown, sidebar: boolean): SkeletonBlock | null {
  if (!isObj(raw)) return null
  const type = oneOf(raw.type, BLOCK_KINDS, 'paragraph')
  const fields = type === 'chart' ? buildChart(raw) : buildFields(type, raw)
  if (!fields) return null
  const block: SkeletonBlock = {
    id: makeId('blk'),
    type: fields.type as BlockKind,
    fields: fields as Partial<BlockData>,
  }
  if (sidebar) block.role = raw.role === 'side' ? 'side' : 'main'
  return block
}

function normalizeSection(raw: unknown): SkeletonSection | null {
  if (!isObj(raw)) return null
  const layout = oneOf(raw.layout, LAYOUTS, 'full')
  const sidebar = SIDEBAR.has(layout)
  const blocksRaw = Array.isArray(raw.blocks) ? raw.blocks : []
  const blocks = blocksRaw
    .map((b) => normalizeBlock(b, sidebar))
    .filter((b): b is SkeletonBlock => b !== null)
  if (blocks.length === 0) return null
  const section: SkeletonSection = { id: makeId('sec'), layout, blocks }
  const title = optStr(raw.title)
  if (title) section.title = title
  const subtitle = optStr(raw.subtitle)
  if (subtitle) section.subtitle = subtitle
  return section
}

function normalizeTheme(v: unknown): ThemeConfig {
  if (!isObj(v)) return { ...DEFAULT_THEME }
  const theme: ThemeConfig = {}
  const primaryColor = optStr(v.primaryColor)
  if (primaryColor) theme.primaryColor = primaryColor
  const palette = strArr(v.colorPalette)
  if (palette.length > 0) theme.colorPalette = palette
  return Object.keys(theme).length > 0 ? theme : { ...DEFAULT_THEME }
}

function normalizeSkeleton(obj: unknown): SkeletonSchema {
  if (!isObj(obj)) throw new SkeletonParseError('model output is not an object')
  const sectionsRaw = Array.isArray(obj.sections) ? obj.sections : []
  const sections = sectionsRaw
    .map(normalizeSection)
    .filter((s): s is SkeletonSection => s !== null)
  if (sections.length === 0) {
    throw new SkeletonParseError('model output has no valid sections')
  }
  const skeleton: SkeletonSchema = {
    title: str(obj.title),
    sections,
    theme: normalizeTheme(obj.theme),
  }
  const subtitle = optStr(obj.subtitle)
  if (subtitle) skeleton.subtitle = subtitle
  return skeleton
}

/** 文本 → 合法 SkeletonSchema;失败抛 {@link SkeletonParseError}。 */
export function parseSkeletonResponse(raw: string): SkeletonSchema {
  return normalizeSkeleton(extractJson(raw))
}

/**
 * 按节填值的提示词构建(纯函数,自包含——不依赖 designer/ 生成子模块,便于作后端 TS 参考)。
 *
 * 一节一调:collectFillPlan 收集本节所有 `llm` 空槽 → buildFillSchema 导出极小 JSON Schema →
 * buildFillMessages 拼「源料 + 本节框架可读清单 + 返回契约」。变量字段(`variable`)与静态字段
 * 不在此列——前者由 schema-fill 用 resolveRef 直接解析,后者就地取骨架值。
 *
 * 回填键扁平化:`${blockId}__${path}`(blockId 形如 blk-xxx、path 无 `__`,故可安全拆分)。
 */
import { chartRowKeys } from './skeleton-utils'
import type { SkeletonBlock, SkeletonSection } from './types'
import { FILL_SYSTEM } from './fill-doc'

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

/** 语义枚举的合法值(与 types 的字面量联合一致);fallback 为模型给非法值时的回落。 */
const VARIANT_VALUES = ['info', 'success', 'warning', 'insight'] as const
const TREND_VALUES = ['up', 'down', 'neutral'] as const

/** 某个空槽要模型产出的值的形状,决定 schema 与 schema-fill 的强转。 */
export type ValueSpec =
  | { kind: 'text' }
  | { kind: 'enum'; options: readonly string[]; fallback: string }
  | { kind: 'rows'; columns: number }
  | { kind: 'criteria'; columns: number }
  | { kind: 'chartData'; category: string; values: string[] }

export interface FillItem {
  /** 扁平回填键 `${blockId}__${path}` */
  key: string
  blockId: string
  path: string
  spec: ValueSpec
  /** 给模型的「这一槽要什么」:字段提示 → 块注解 逐级回落(小节注解走整节口径行) */
  description: string
}

export interface FillPlan {
  items: FillItem[]
}

const KEY_SEP = '__'
export const fillKey = (blockId: string, path: string): string =>
  `${blockId}${KEY_SEP}${path}`

/** 拆回填键;blockId 无分隔符,故按首个 `__` 切。 */
export function splitFillKey(key: string): { blockId: string; path: string } {
  const i = key.indexOf(KEY_SEP)
  return i === -1
    ? { blockId: key, path: '' }
    : { blockId: key.slice(0, i), path: key.slice(i + KEY_SEP.length) }
}

const readArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const leafOf = (path: string): string =>
  path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : path

/** 由 (块类型, 路径) 推出该空槽的值形状。 */
function specFor(block: SkeletonBlock, path: string): ValueSpec {
  const f = (block.fields ?? {}) as Record<string, unknown>
  if (block.type === 'table' && path === 'rows') {
    return { kind: 'rows', columns: readArr(f.headers).length || 1 }
  }
  if (block.type === 'comparison-matrix' && path === 'criteria') {
    return { kind: 'criteria', columns: readArr(f.items).length || 1 }
  }
  if (block.type === 'chart' && path === 'data') {
    const { category, values } = chartRowKeys(block)
    return { kind: 'chartData', category, values }
  }
  const leaf = leafOf(path)
  if (leaf === 'variant') {
    return { kind: 'enum', options: VARIANT_VALUES, fallback: 'info' }
  }
  if (leaf === 'trend') {
    return { kind: 'enum', options: TREND_VALUES, fallback: 'neutral' }
  }
  return { kind: 'text' }
}

/** 收集本节所有 `llm` 空槽 → 待填计划。 */
export function collectFillPlan(section: SkeletonSection): FillPlan {
  const items: FillItem[] = []
  for (const block of section.blocks) {
    const dirs = block.fieldDirectives ?? {}
    for (const path of Object.keys(dirs)) {
      if (dirs[path].mode !== 'llm') continue
      items.push({
        key: fillKey(block.id, path),
        blockId: block.id,
        path,
        spec: specFor(block, path),
        // 逐槽说明:字段提示 → 块注解。小节注解不在此兜底——它已作为整节口径
        // 出现在 buildFillMessages 的 (about: …) 行,避免每个空槽重复同一句。
        description: dirs[path].hint?.trim() || block.annotation?.trim() || '',
      })
    }
  }
  return { items }
}

// ============================================================
// 极小 JSON Schema（前端当 prompt 契约,后端当 response_format）
// ============================================================

function schemaForItem(item: FillItem): Record<string, unknown> {
  const desc = item.description ? { description: item.description } : {}
  const { spec } = item
  switch (spec.kind) {
    case 'text':
      return { type: 'string', ...desc }
    case 'enum':
      return { type: 'string', enum: [...spec.options], ...desc }
    case 'rows':
      return {
        type: 'array',
        ...desc,
        items: {
          type: 'array',
          items: { type: 'string' },
          minItems: spec.columns,
          maxItems: spec.columns,
        },
      }
    case 'criteria':
      return {
        type: 'array',
        ...desc,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'values'],
          properties: {
            name: { type: 'string' },
            values: {
              type: 'array',
              items: { type: 'string' },
              minItems: spec.columns,
              maxItems: spec.columns,
            },
          },
        },
      }
    case 'chartData': {
      const properties: Record<string, unknown> = {
        [spec.category]: { type: 'string' },
      }
      for (const v of spec.values) properties[v] = { type: 'number' }
      return {
        type: 'array',
        ...desc,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [spec.category, ...spec.values],
          properties,
        },
      }
    }
  }
}

export function buildFillSchema(plan: FillPlan): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  for (const item of plan.items) properties[item.key] = schemaForItem(item)
  return {
    type: 'object',
    additionalProperties: false,
    required: plan.items.map((i) => i.key),
    properties,
  }
}

// ============================================================
// 可读清单（让模型看见本节框架,而非一串裸键）
// ============================================================

function blockSummary(block: SkeletonBlock): string {
  const f = (block.fields ?? {}) as Record<string, unknown>
  const title = typeof f.title === 'string' && f.title ? ` "${f.title}"` : ''
  switch (block.type) {
    case 'callout':
      return `callout${title}`
    case 'list':
      return `${f.ordered ? 'numbered' : 'bulleted'} list${title}`
    case 'stat-card':
      return `stat-card "${String(f.label ?? '')}"`
    case 'stat-card-group':
      return 'stat-card group'
    case 'table':
      return `table${title}, columns [${readArr(f.headers).join(', ')}]`
    case 'comparison-matrix':
      return `comparison${title}, columns [${readArr(f.items).join(', ')}]`
    case 'timeline':
      return `timeline${title}`
    case 'chart':
      return `${String(f.chartType ?? 'bar')} chart${title}`
    default:
      return block.type
  }
}

const humanizePath = (path: string): string =>
  path
    .replace(/items\[(\d+)\]/g, (_, n) => `item ${Number(n) + 1}`)
    .replace(/\./g, ' ')

function slotHint(spec: ValueSpec): string {
  switch (spec.kind) {
    case 'enum':
      return ` (one of: ${spec.options.join(' / ')})`
    case 'rows':
      return ` (${spec.columns} cells per row)`
    case 'criteria':
      return ` (name + ${spec.columns} values)`
    case 'chartData':
      return ` (rows of {${[spec.category, ...spec.values].join(', ')}})`
    default:
      return ''
  }
}

/** 把本节有空槽的块列成「框架 + 槽位」可读清单。 */
export function describeSection(
  section: SkeletonSection,
  plan: FillPlan,
): string {
  const byBlock = new Map<string, FillItem[]>()
  for (const item of plan.items) {
    const list = byBlock.get(item.blockId)
    if (list) list.push(item)
    else byBlock.set(item.blockId, [item])
  }
  const lines: string[] = []
  for (const block of section.blocks) {
    const items = byBlock.get(block.id)
    if (!items?.length) continue
    lines.push(`- ${blockSummary(block)}:`)
    for (const item of items) {
      // 逐槽说明拼在 `—` 后,让模型在最常读的清单里就看到「这一槽要什么」
      const guide = item.description ? ` — ${item.description}` : ''
      lines.push(
        `    · [${item.key}] ${humanizePath(item.path)}${slotHint(item.spec)}${guide}`,
      )
    }
  }
  return lines.join('\n')
}

// ============================================================
// 消息
// ============================================================

export interface FillMessageInput {
  reportTitle: string
  section: SkeletonSection
  sourceText: string
  /** 全篇节标题目录(保全篇语气连贯,不带其他节已填内容) */
  tocTitles: string[]
  plan: FillPlan
  schema: Record<string, unknown>
}

export function buildFillMessages(input: FillMessageInput): ChatMessage[] {
  const { reportTitle, section, sourceText, tocTitles, plan, schema } = input
  const focus = section.title ? `"${section.title}"` : 'this section'
  const intent = section.annotation ? ` (about: ${section.annotation})` : ''
  const toc = tocTitles.length
    ? `Report sections: ${tocTitles.join(' / ')}\n`
    : ''
  const user = [
    `Source text:\n${sourceText.trim()}`,
    '---',
    `Report: "${reportTitle}"`,
    `${toc}Fill ONLY the section ${focus}${intent}.`,
    '',
    'Slots to fill:',
    describeSection(section, plan),
    '',
    'Return ONE JSON object with EXACTLY these keys and matching types:',
    JSON.stringify(schema),
  ].join('\n')
  return [
    { role: 'system', content: FILL_SYSTEM },
    { role: 'user', content: user },
  ]
}

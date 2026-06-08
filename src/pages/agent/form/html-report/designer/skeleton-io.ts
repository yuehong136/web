/**
 * 当前编排(SkeletonSchema)的导入/导出。
 *
 * 导出 = 原样 JSON(几 KB);导入 = JSON.parse + 轻量保真校验。刻意**不走** AI 归一器
 * (那会按生成规则改写结构,如剔除 heading),以保证导出→导入往返不丢 fieldDirectives /
 * 注解 / role / theme / 生成区等作者数据。无法识别的块(type 非法)才丢弃。
 */
import { makeId } from '../skeleton-utils'
import type {
  Block,
  BlockKind,
  FieldDirective,
  HeaderLayout,
  ReportSchema,
  Section,
  SkeletonBlock,
  SkeletonSchema,
  SkeletonSection,
  ThemeConfig,
} from '../types'
import { BLOCK_KINDS, isObj, LAYOUTS, oneOf } from './ai-skeleton/coerce'

export class SkeletonImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SkeletonImportError'
  }
}

/** 合法块类型(含生成区占位)。 */
const VALID_KINDS = new Set<string>([...BLOCK_KINDS, 'open-region'])

/** 合法头图排布(导入保真校验用)。与 types.ts 的 HeaderLayout 联合对齐。 */
const HEADER_LAYOUTS = new Set<string>([
  'card',
  'band',
  'cover',
  'split',
  'frosted',
])

const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined

function coerceBlock(raw: unknown): SkeletonBlock | null {
  if (!isObj(raw) || typeof raw.type !== 'string' || !VALID_KINDS.has(raw.type))
    return null
  // 整块透传(保留 fields / fieldDirectives / annotation / role / level …),仅补 id。
  return {
    ...(raw as Record<string, unknown>),
    id: str(raw.id) || makeId('blk'),
    type: raw.type as BlockKind,
  } as SkeletonBlock
}

function coerceSection(raw: unknown): SkeletonSection | null {
  if (!isObj(raw)) return null
  const blocksRaw = Array.isArray(raw.blocks) ? raw.blocks : []
  const blocks = blocksRaw
    .map(coerceBlock)
    .filter((b): b is SkeletonBlock => b !== null)
  return {
    ...(raw as Record<string, unknown>),
    id: str(raw.id) || makeId('sec'),
    layout: oneOf(raw.layout, LAYOUTS, 'full'),
    blocks,
  } as SkeletonSection
}

/** JSON 文本 → SkeletonSchema;形状不对则抛 {@link SkeletonImportError}。 */
export function parseSkeletonJson(text: string): SkeletonSchema {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new SkeletonImportError('invalid-json')
  }
  if (!isObj(parsed) || !Array.isArray(parsed.sections)) {
    throw new SkeletonImportError('invalid-shape')
  }
  const sections = parsed.sections
    .map(coerceSection)
    .filter((s): s is SkeletonSection => s !== null)

  const schema: SkeletonSchema = {
    title: str(parsed.title) ?? '',
    sections,
  }
  if (isObj(parsed.titleDirective))
    schema.titleDirective = parsed.titleDirective as unknown as FieldDirective
  // 副标题及其指令同 title:显式重建路径须保留,否则导出→导入丢副标题/模型态。
  if (typeof parsed.subtitle === 'string') schema.subtitle = parsed.subtitle
  if (isObj(parsed.subtitleDirective))
    schema.subtitleDirective =
      parsed.subtitleDirective as unknown as FieldDirective
  // 顶层 schema 是显式重建(非展开透传),故 layoutFirst 须显式保留;section.titleDirective
  // 走 coerceSection 的整段展开,天然保真。
  if (typeof parsed.layoutFirst === 'boolean')
    schema.layoutFirst = parsed.layoutFirst
  // Hero 头图(设计器手选)同样是显式重建,须保留,否则导出→导入丢
  if (typeof parsed.headerArt === 'string') schema.headerArt = parsed.headerArt
  if (
    typeof parsed.headerLayout === 'string' &&
    HEADER_LAYOUTS.has(parsed.headerLayout)
  )
    schema.headerLayout = parsed.headerLayout as HeaderLayout
  if (isObj(parsed.theme)) schema.theme = parsed.theme as ThemeConfig
  return schema
}

// ============================================================
// 已产出报告(ReportSchema)的导入 —— 供全屏预览直接渲染
// ============================================================

/** 已渲染报告里的合法块类型:必为具体块(不含生成区占位 open-region)。 */
const REPORT_KINDS = new Set<string>(BLOCK_KINDS)

/** 整块透传(保留所有已填字段),仅补 id;类型非法则丢弃。 */
function coerceReportBlock(raw: unknown): Block | null {
  if (
    !isObj(raw) ||
    typeof raw.type !== 'string' ||
    !REPORT_KINDS.has(raw.type)
  )
    return null
  return {
    ...(raw as Record<string, unknown>),
    id: str(raw.id) || makeId('blk'),
  } as Block
}

function coerceReportSection(raw: unknown): Section | null {
  if (!isObj(raw)) return null
  const blocksRaw = Array.isArray(raw.blocks) ? raw.blocks : []
  const blocks = blocksRaw
    .map(coerceReportBlock)
    .filter((b): b is Block => b !== null)
  return {
    ...(raw as Record<string, unknown>),
    id: str(raw.id) || makeId('sec'),
    layout: oneOf(raw.layout, LAYOUTS, 'full'),
    blocks,
  } as Section
}

/**
 * JSON 文本 → 已产出的 {@link ReportSchema}(运行/试运行的成品),用于全屏预览直接渲染。
 * 与 {@link parseSkeletonJson} 区别:这里是「已填好的具体块」,不含 fieldDirectives /
 * 生成区,直接喂渲染器。形状不对则抛 {@link SkeletonImportError}。
 */
export function parseReportJson(text: string): ReportSchema {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new SkeletonImportError('invalid-json')
  }
  if (!isObj(parsed) || !Array.isArray(parsed.sections)) {
    throw new SkeletonImportError('invalid-shape')
  }
  const sections = parsed.sections
    .map(coerceReportSection)
    .filter((s): s is Section => s !== null)

  const schema: ReportSchema = {
    title: str(parsed.title) ?? '',
    sections,
  }
  if (isObj(parsed.theme)) schema.theme = parsed.theme as ThemeConfig
  if (str(parsed.date)) schema.date = str(parsed.date)
  if (str(parsed.author)) schema.author = str(parsed.author)
  return schema
}

/** 文件名安全化:仅留常见字符,空则回落。 */
function safeFilename(title: string, fallback = 'report-skeleton'): string {
  const base = title
    .trim()
    .replace(/[^\w一-鿿-]+/g, '_')
    .slice(0, 60)
  return `${base || fallback}.json`
}

/** 当前编排 → 触发浏览器下载一份 .json。 */
export function downloadSkeleton(skeleton: SkeletonSchema): void {
  const json = JSON.stringify(skeleton, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeFilename(skeleton.title)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 试运行产物(已填的 ReportSchema)→ 下载一份 .json(导出原始生成结构)。 */
export function downloadReportSchema(schema: ReportSchema): void {
  const json = JSON.stringify(schema, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeFilename(schema.title, 'report-structure')
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

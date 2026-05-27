/**
 * 当前编排(SkeletonSchema)的导入/导出。
 *
 * 导出 = 原样 JSON(几 KB);导入 = JSON.parse + 轻量保真校验。刻意**不走** AI 归一器
 * (那会按生成规则改写结构,如剔除 heading),以保证导出→导入往返不丢 fieldDirectives /
 * 注解 / role / theme / 生成区等作者数据。无法识别的块(type 非法)才丢弃。
 */
import { makeId } from '../skeleton-utils'
import type {
  BlockKind,
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
  const subtitle = str(parsed.subtitle)
  if (subtitle) schema.subtitle = subtitle
  if (isObj(parsed.theme)) schema.theme = parsed.theme as ThemeConfig
  return schema
}

/** 文件名安全化:仅留常见字符,空则回落。 */
function safeFilename(title: string): string {
  const base = title
    .trim()
    .replace(/[^\w一-鿿-]+/g, '_')
    .slice(0, 60)
  return `${base || 'report-skeleton'}.json`
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

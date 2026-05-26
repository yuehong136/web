/**
 * 把 LLM 文本解析成模板结构。三个入口:
 * - {@link parseOutline}   —— 大纲调用的产物:有序的节(标题/布局/意图),不含块。
 * - {@link parseSection}   —— 单节调用的产物:`{blocks:[...]}` → 一个 {@link SkeletonSection}。
 * - {@link parseSkeletonResponse} —— 单次整篇生成的产物(大纲失败时的回退路径)。
 *
 * 块归一(框架静态 / 内容 llm 指令)共用 {@link normalizeBlock}(见 build-block.ts)。
 * LLM 的 JSON 不可靠:可能带 markdown 围栏/散文、字段缺失、枚举非法,这里防御式处理。
 */
import { DEFAULT_THEME } from '../../constants'
import { makeId } from '../../skeleton-utils'
import type {
  LayoutType,
  SkeletonBlock,
  SkeletonSchema,
  SkeletonSection,
  ThemeConfig,
} from '../../types'
import { normalizeBlock } from './build-block'
import { isObj, LAYOUTS, oneOf, optStr, SIDEBAR, str, strArr } from './coerce'

/** 解析失败(无法定位/解析 JSON,或归一化后无任何合法内容)。 */
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

// ============================================================
// 大纲(第①步)
// ============================================================

export interface OutlineSection {
  title?: string
  layout: LayoutType
  intent?: string
}

export interface ReportOutline {
  title: string
  sections: OutlineSection[]
}

/** 文本 → 报告大纲(有序的节);无合法节抛 {@link SkeletonParseError}。 */
export function parseOutline(raw: string): ReportOutline {
  const obj = extractJson(raw)
  if (!isObj(obj)) throw new SkeletonParseError('outline is not an object')
  const sectionsRaw = Array.isArray(obj.sections) ? obj.sections : []
  const sections = sectionsRaw.filter(isObj).map((s) => {
    const out: OutlineSection = { layout: oneOf(s.layout, LAYOUTS, 'full') }
    const title = optStr(s.title)
    if (title) out.title = title
    const intent = optStr(s.intent)
    if (intent) out.intent = intent
    return out
  })
  if (sections.length === 0) {
    throw new SkeletonParseError('outline has no sections')
  }
  return { title: str(obj.title), sections }
}

// ============================================================
// 单节(第②步)
// ============================================================

/** `{blocks:[...]}`(或裸数组)+ 大纲里的节信息 → 一个 SkeletonSection。 */
export function parseSection(
  raw: string,
  outline: OutlineSection,
): SkeletonSection {
  const obj = extractJson(raw)
  const blocksRaw = isObj(obj) && Array.isArray(obj.blocks) ? obj.blocks : []
  const sidebar = SIDEBAR.has(outline.layout)
  const blocks = blocksRaw
    .map((b) => normalizeBlock(b, sidebar))
    .filter((b): b is SkeletonBlock => b !== null)
  if (blocks.length === 0) {
    throw new SkeletonParseError('section has no valid blocks')
  }
  const section: SkeletonSection = {
    id: makeId('sec'),
    layout: outline.layout,
    blocks,
  }
  if (outline.title) section.title = outline.title
  if (outline.intent) section.annotation = outline.intent
  return section
}

// ============================================================
// 整篇(回退:大纲失败时单次生成)
// ============================================================

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
  const annotation = optStr(raw.annotation)
  if (annotation) section.annotation = annotation
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

/** 文本 → 合法 SkeletonSchema 模板(整篇);失败抛 {@link SkeletonParseError}。 */
export function parseSkeletonResponse(raw: string): SkeletonSchema {
  return normalizeSkeleton(extractJson(raw))
}

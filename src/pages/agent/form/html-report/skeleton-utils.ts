/**
 * 骨架内核:字段路径寻址 + directive 解析 + 确定性 merge + 汇总。
 *
 * 纯函数、零 React/DOM,被 Designer 预览(mock-fill)与运行时 schema-fill(Phase 4)
 * 共用。merge 不依赖随机/时间,保证「同一骨架 + 同一填充值」永远产出同一 ReportSchema。
 *
 * 字段路径约定(见 docs/html-report/README.md「字段路径约定」):
 *   'value' / 'title'        顶层字段
 *   'items[0].value'         数组下标 + 子字段
 *   'series[1].dataKey'      嵌套数组
 *   'data'                   chart 的整段数据数组(作为一个 llm directive)
 */
import type {
  Block,
  BlockData,
  BlockKind,
  FieldDirective,
  ReportSchema,
  SkeletonBlock,
  SkeletonSchema,
} from './types'

export type FieldPath = string

type PathSegment = string | number

/** 'items[0].value' -> ['items', 0, 'value'];全数字段视为数组下标 */
function parsePath(path: FieldPath): PathSegment[] {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter((segment) => segment.length > 0)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment))
}

/** 按路径读取;任一段缺失返回 undefined */
export function getFieldValue(target: unknown, path: FieldPath): unknown {
  let cur: unknown = target
  for (const segment of parsePath(path)) {
    if (cur == null) return undefined
    if (typeof segment === 'number') {
      if (!Array.isArray(cur)) return undefined
      cur = cur[segment]
    } else {
      if (typeof cur !== 'object' || Array.isArray(cur)) return undefined
      cur = (cur as Record<string, unknown>)[segment]
    }
  }
  return cur
}

function setIn(
  target: unknown,
  segments: PathSegment[],
  value: unknown,
): unknown {
  if (segments.length === 0) return value
  const [head, ...rest] = segments
  if (typeof head === 'number') {
    const arr = Array.isArray(target) ? (target as unknown[]).slice() : []
    arr[head] = setIn(arr[head], rest, value)
    return arr
  }
  const obj: Record<string, unknown> =
    target && typeof target === 'object' && !Array.isArray(target)
      ? { ...(target as Record<string, unknown>) }
      : {}
  obj[head] = setIn(obj[head], rest, value)
  return obj
}

/** 按路径不可变写入;按需创建中间数组/对象(稀疏数组允许),返回新对象 */
export function setFieldValue<T>(
  target: T,
  path: FieldPath,
  value: unknown,
): T {
  return setIn(target, parsePath(path), value) as T
}

const STATIC_DIRECTIVE: FieldDirective = { mode: 'static' }

/** 读取某字段的填充指令;未标注默认 static */
export function resolveDirective(
  block: SkeletonBlock,
  path: FieldPath,
): FieldDirective {
  return block.fieldDirectives?.[path] ?? STATIC_DIRECTIVE
}

/** 写入/清除某字段的指令;传 null 或 static 即清回默认(从 map 删除),返回新 block */
export function setDirective(
  block: SkeletonBlock,
  path: FieldPath,
  directive: FieldDirective | null,
): SkeletonBlock {
  const next = { ...(block.fieldDirectives ?? {}) }
  if (!directive || directive.mode === 'static') {
    delete next[path]
  } else {
    next[path] = directive
  }
  return { ...block, fieldDirectives: next }
}

export interface PendingFill {
  sectionId: string
  blockId: string
  path: FieldPath
  directive: FieldDirective
  blockType: BlockKind
}

/** 收集所有需运行时填充的字段(mode !== 'static');chart 的 data 也在其列 */
export function collectPendingFills(skeleton: SkeletonSchema): PendingFill[] {
  const fills: PendingFill[] = []
  for (const section of skeleton.sections) {
    for (const block of section.blocks) {
      for (const [path, directive] of Object.entries(
        block.fieldDirectives ?? {},
      )) {
        if (directive.mode === 'static') continue
        fills.push({
          sectionId: section.id,
          blockId: block.id,
          path,
          directive,
          blockType: block.type,
        })
      }
    }
  }
  return fills
}

/**
 * 单个骨架 Block + 填好的叶子值 → 运行时 Block。
 * 以 `block.fields`(钉死的静态结构)为底,按路径覆盖填充值,最后回挂 `role`
 * (渲染器侧栏布局靠 `block.role` 分主/侧列)。
 */
export function mergeBlock(
  block: SkeletonBlock,
  filled: Record<FieldPath, unknown>,
): Block {
  let result: Record<string, unknown> = {
    ...((block.fields ?? {}) as Partial<BlockData>),
    id: block.id,
    type: block.type,
  }
  for (const [path, value] of Object.entries(filled)) {
    result = setFieldValue(result, path, value)
  }
  if (block.role) result.role = block.role
  return result as unknown as Block
}

/** 整份骨架 + 各 Block 的填充值 → 完整 ReportSchema(annotation 不进运行时) */
export function mergeSkeleton(
  skeleton: SkeletonSchema,
  filledByBlock: Record<string, Record<FieldPath, unknown>>,
): ReportSchema {
  return {
    title: skeleton.title,
    subtitle: skeleton.subtitle,
    theme: skeleton.theme,
    sections: skeleton.sections.map((section) => ({
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      layout: section.layout,
      blocks: section.blocks.map((block) =>
        mergeBlock(block, filledByBlock[block.id] ?? {}),
      ),
    })),
  }
}

export interface SkeletonSummary {
  sections: number
  blocks: number
  charts: number
  pending: number
}

/** 摘要计数,供 FormSheet 摘要卡显示 */
export function summarizeSkeleton(skeleton: SkeletonSchema): SkeletonSummary {
  let blocks = 0
  let charts = 0
  for (const section of skeleton.sections) {
    blocks += section.blocks.length
    for (const block of section.blocks) {
      if (block.type === 'chart') charts += 1
    }
  }
  return {
    sections: skeleton.sections.length,
    blocks,
    charts,
    pending: collectPendingFills(skeleton).length,
  }
}

/** 生成 Section / Block 的稳定唯一 id(仅用于 Designer 新建,不进 merge) */
export function makeId(prefix: 'sec' | 'blk'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

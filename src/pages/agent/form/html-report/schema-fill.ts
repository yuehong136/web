/**
 * 运行时填值编排(纯,自包含)——骨架 + 源料 → 完整 ReportSchema。
 *
 * 按节、顺序:① 变量字段(`variable`)用 resolveRef 全局解析一次;② 逐节调 LLM 只补本节
 * `llm` 空槽(全篇源料 + 本节框架)→ 防御解析 + 按 valueSpec 强转 → 累积;③ 确定性
 * mergeSkeleton 回骨架。某节失败跳过保其余。
 *
 * `callLLM` / `resolveRef` 都注入:前端试运行注入 SSE + 样本值,后端注入真上游与自身 LLM,
 * 测试注入桩。本文件因此零 IO、可单测,也是后端按相同规则实现的 TS 参考。
 */
import { mergeSkeleton } from './skeleton-utils'
import type { ReportSchema, SkeletonSchema } from './types'
import {
  buildFillMessages,
  buildFillSchema,
  collectFillPlan,
  splitFillKey,
  type ChatMessage,
  type FillPlan,
  type ValueSpec,
} from './prompt-builder'

/** 填值阶段错误(解析不出合法 JSON 等);某节失败即记一条,跳过保其余。 */
export class FillError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FillError'
  }
}

export interface FillOptions {
  /** 上游传来的通读语料(节点主输入)。 */
  sourceText: string
  /** 解析 `variable` 字段的上游引用 → 真值;前端试运行给样本表,后端给真上游。 */
  resolveRef: (ref: string) => unknown
  /** 调一次 LLM 返回累计文本;前端注入 SSE,后端注入自身实现,测试注入桩。 */
  callLLM: (messages: ChatMessage[]) => Promise<string>
  /** 逐节进度(current 从 1 起),可选。 */
  onProgress?: (current: number, total: number) => void
}

export interface FillResult {
  schema: ReportSchema
  /** 解析失败、已跳过的节产生的错误 */
  errors: FillError[]
  /** 有 `llm` 空槽、需调模型的节数 */
  llmSections: number
  /** 其中成功填好的节数 */
  okSections: number
}

/** blockId → (path → 填好的值),喂给 mergeSkeleton。 */
type FilledByBlock = Record<string, Record<string, unknown>>

// ============================================================
// 防御解析 + 按 valueSpec 强转
// ============================================================

function extractJsonObject(raw: string): Record<string, unknown> {
  let text = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new FillError('no JSON object in model output')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new FillError('model output is not valid JSON')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new FillError('model output is not a JSON object')
  }
  return parsed as Record<string, unknown>
}

const toNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/** 把一行补齐/截断到固定列数,每格转字符串。 */
function fitRow(row: unknown[], columns: number): string[] {
  const cells = row.map((c) => String(c ?? ''))
  while (cells.length < columns) cells.push('')
  return cells.slice(0, columns)
}

/** 按 spec 强转模型给的原始值;无法采用(缺值/类型不符)返回 undefined → 留骨架原值。 */
function coerceValue(spec: ValueSpec, raw: unknown): unknown | undefined {
  switch (spec.kind) {
    case 'text':
      return raw == null ? undefined : String(raw)
    case 'enum': {
      const s = typeof raw === 'string' ? raw : ''
      if (!s) return undefined
      return spec.options.includes(s) ? s : spec.fallback
    }
    case 'rows':
      return Array.isArray(raw)
        ? raw
            .filter((r): r is unknown[] => Array.isArray(r))
            .map((r) => fitRow(r, spec.columns))
        : undefined
    case 'criteria': {
      if (!Array.isArray(raw)) return undefined
      const out: { name: string; values: string[] }[] = []
      for (const c of raw) {
        if (typeof c !== 'object' || c === null) continue
        const obj = c as Record<string, unknown>
        out.push({
          name: String(obj.name ?? ''),
          values: fitRow(
            Array.isArray(obj.values) ? obj.values : [],
            spec.columns,
          ),
        })
      }
      return out
    }
    case 'chartData': {
      if (!Array.isArray(raw)) return undefined
      const rows: Record<string, string | number>[] = []
      for (const r of raw) {
        if (typeof r !== 'object' || r === null) continue
        const obj = r as Record<string, unknown>
        const row: Record<string, string | number> = {
          [spec.category]: String(obj[spec.category] ?? ''),
        }
        for (const v of spec.values) row[v] = toNum(obj[v])
        rows.push(row)
      }
      return rows
    }
  }
}

/** 模型回的 JSON → 本节的 blockId→path→值;多余键忽略,缺键/非法跳过。 */
function applyFillJson(rawText: string, plan: FillPlan): FilledByBlock {
  const obj = extractJsonObject(rawText)
  const out: FilledByBlock = {}
  for (const item of plan.items) {
    const value = coerceValue(item.spec, obj[item.key])
    if (value === undefined) continue
    const { blockId, path } = splitFillKey(item.key)
    ;(out[blockId] ??= {})[path] = value
  }
  return out
}

// ============================================================
// 变量解析 + 编排
// ============================================================

/** 全骨架的 `variable` 字段 → resolveRef 取真值(不进 LLM)。 */
function resolveVariableFills(
  skeleton: SkeletonSchema,
  resolveRef: (ref: string) => unknown,
): FilledByBlock {
  const out: FilledByBlock = {}
  for (const section of skeleton.sections) {
    for (const block of section.blocks) {
      const dirs = block.fieldDirectives ?? {}
      for (const path of Object.keys(dirs)) {
        const directive = dirs[path]
        if (directive.mode !== 'variable' || !directive.ref) continue
        const value = resolveRef(directive.ref)
        if (value !== undefined) (out[block.id] ??= {})[path] = value
      }
    }
  }
  return out
}

function mergeInto(target: FilledByBlock, src: FilledByBlock): void {
  for (const blockId of Object.keys(src)) {
    target[blockId] = { ...(target[blockId] ?? {}), ...src[blockId] }
  }
}

/** 骨架 + 源料 → ReportSchema:变量全局解析 + 逐节 LLM 填空 + 确定性 merge。 */
export async function fillSkeleton(
  skeleton: SkeletonSchema,
  options: FillOptions,
): Promise<FillResult> {
  const { sourceText, resolveRef, callLLM, onProgress } = options
  const filled: FilledByBlock = {}
  mergeInto(filled, resolveVariableFills(skeleton, resolveRef))

  const tocTitles = skeleton.sections
    .map((s) => s.title)
    .filter((t): t is string => Boolean(t))
  const errors: FillError[] = []
  let llmSections = 0
  let okSections = 0
  const total = skeleton.sections.length

  for (let i = 0; i < total; i += 1) {
    onProgress?.(i + 1, total)
    const section = skeleton.sections[i]
    const plan = collectFillPlan(section)
    if (plan.items.length === 0) continue // 全静态/变量的节不调 LLM
    llmSections += 1
    const messages = buildFillMessages({
      reportTitle: skeleton.title,
      section,
      sourceText,
      tocTitles,
      plan,
      schema: buildFillSchema(plan),
    })
    try {
      mergeInto(filled, applyFillJson(await callLLM(messages), plan))
      okSections += 1
    } catch (err) {
      errors.push(err instanceof FillError ? err : new FillError(String(err)))
    }
  }

  return {
    schema: mergeSkeleton(skeleton, filled),
    errors,
    llmSections,
    okSections,
  }
}

/**
 * 生成区展开(纯,运行时前置 pass)——把骨架里的 `open-region` 占位块按其 brief 交给模型,
 * 展开成真块(模板块:框架静态、内容标 `llm`),产出一份「无生成区」的骨架,再交给
 * 原封不动的 {@link fillSkeleton} 填值。
 *
 * 复用既有逐节生成机器:`buildRegionMessages`(brief → 提示词)+ `parseSection`(文本 →
 * 一节的块,经 build-block 归一)。一个生成区 = 一次「单区域生成」,取回 `.blocks` 在原位置
 * splice 替换,继承占位块 role(sidebar 分列)。某区失败则丢弃该占位 + 记错,保其余。
 *
 * `callLLM` 注入式:前端试运行注入 SSE,后端注入自身实现,测试注入桩。本文件零 IO、可单测,
 * 也是后端按相同规则实现的 TS 参考。
 */
import { isOpenRegion } from '../../types'
import type {
  SkeletonBlock,
  SkeletonSchema,
  SkeletonSection,
} from '../../types'
import { SkeletonParseError, parseSection } from './parse'
import { buildRegionMessages, type ChatMessage } from './prompt'

/** 展开阶段错误(模型对某生成区没产出合法块等);某区失败即记一条,跳过保其余。 */
export class ExpandError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExpandError'
  }
}

export interface ExpandOptions {
  /** 上游传来的通读语料(节点主输入),与填值同一份。 */
  sourceText: string
  /** 调一次 LLM 返回累计文本;前端注入 SSE,后端注入自身实现,测试注入桩。 */
  callLLM: (messages: ChatMessage[]) => Promise<string>
  /** 逐区进度(current 从 1 起),可选。 */
  onProgress?: (current: number, total: number) => void
}

export interface ExpandResult {
  /** 已无 `open-region` 的骨架(成功区展开、失败区剔除) */
  skeleton: SkeletonSchema
  /** 展开失败、已剔除的区产生的错误 */
  errors: ExpandError[]
  /** 检测到的生成区总数 */
  openRegions: number
  /** 其中成功展开的区数 */
  okRegions: number
}

/** 数一份骨架里的生成区数量。 */
function countOpenRegions(skeleton: SkeletonSchema): number {
  let n = 0
  for (const section of skeleton.sections) {
    for (const block of section.blocks) if (isOpenRegion(block)) n += 1
  }
  return n
}

/** 骨架 + 源料 → 无生成区的骨架:逐个 open-region 调模型展开、按位置 splice 替换。 */
export async function expandOpenRegions(
  skeleton: SkeletonSchema,
  options: ExpandOptions,
): Promise<ExpandResult> {
  const { sourceText, callLLM, onProgress } = options
  const total = countOpenRegions(skeleton)
  if (total === 0) {
    return { skeleton, errors: [], openRegions: 0, okRegions: 0 }
  }

  const errors: ExpandError[] = []
  let done = 0
  let okRegions = 0
  const sections: SkeletonSection[] = []

  for (const section of skeleton.sections) {
    const blocks: SkeletonBlock[] = []
    for (const block of section.blocks) {
      if (!isOpenRegion(block)) {
        blocks.push(block)
        continue
      }
      done += 1
      onProgress?.(done, total)
      const brief = block.annotation?.trim() ?? ''
      try {
        const generated = parseSection(
          await callLLM(
            buildRegionMessages(sourceText, {
              sectionTitle: section.title,
              brief,
            }),
          ),
          { layout: section.layout, title: section.title, intent: brief },
        )
        // 继承占位块 role(sidebar 分列);丢弃 parseSection 自造的节标题/注解。
        for (const gen of generated.blocks) {
          blocks.push(block.role ? { ...gen, role: block.role } : gen)
        }
        okRegions += 1
      } catch (err) {
        // 失败:丢弃该占位块(不 push),保其余;SkeletonParseError 与其他错误一视同仁。
        const msg =
          err instanceof SkeletonParseError ? err.message : String(err)
        errors.push(new ExpandError(msg))
      }
    }
    sections.push({ ...section, blocks })
  }

  return {
    skeleton: { ...skeleton, sections },
    errors,
    openRegions: total,
    okRegions,
  }
}

/**
 * Designer「试运行」hook —— 瘦 SSE 客户端。
 *
 * 展开生成区 + 逐节填值的真逻辑已收口到后端 `POST /v1/report/fill`(report_skeleton.expand +
 * report_fill.fill,与真实工作流算子同一条路径 → 预览=生产)。本 hook 只:扫骨架里 variable
 * 字段的引用 → 用 resolveRef 取样本值拼成 variables map → 发一次请求 → 流式读 expand/fill 进度
 * + 末尾 ReportSchema。公共 API 与旧实现一致,故 run-dialog 无需改动。
 *
 * 判败口径与后端算子一致:有 llm 空槽要填(llmSections>0)却一个都没填成(okSections===0)→ error;
 * 生成区展开失败只作告警(failedRegions),不判败——同 html_report。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReportSchema, SkeletonSchema } from '../types'
import { type ReportProgress, streamReport } from './report-sse'

export type RunStatus = 'idle' | 'running' | 'done' | 'error'

export interface RunProgress {
  /** 当前阶段:先展开生成区,再逐节填值 */
  phase: 'expand' | 'fill'
  current: number
  total: number
}

export interface RunFillArgs {
  skeleton: SkeletonSchema
  /** 源料:试运行时用户粘的样本上游文本 */
  sourceText: string
  llmName: string
  /** 生成温度(取自节点配置;缺省时不传,用后端默认) */
  temperature?: number
  /** variable 字段的样本值解析(无变量则永远返回 undefined) */
  resolveRef: (ref: string) => unknown
}

const INITIAL_PROGRESS: RunProgress = { phase: 'expand', current: 0, total: 0 }

/** 扫骨架里所有 variable 指令的 ref,用 resolveRef 取样本值 → 发给后端的 variables map。 */
function collectVariableSamples(
  skeleton: SkeletonSchema,
  resolveRef: (ref: string) => unknown,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const section of skeleton.sections) {
    for (const block of section.blocks) {
      for (const directive of Object.values(block.fieldDirectives ?? {})) {
        if (directive.mode === 'variable' && directive.ref) {
          const value = resolveRef(directive.ref)
          if (value !== undefined) out[directive.ref] = value
        }
      }
    }
  }
  return out
}

export function useRunFill() {
  const [status, setStatus] = useState<RunStatus>('idle')
  const [progress, setProgress] = useState<RunProgress>(INITIAL_PROGRESS)
  const [result, setResult] = useState<ReportSchema | null>(null)
  /** 解析失败、被跳过的节数(部分成功时给用户的告警) */
  const [failedSections, setFailedSections] = useState(0)
  /** 展开失败、被剔除的生成区数 */
  const [failedRegions, setFailedRegions] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const teardown = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => teardown, [teardown])

  const cancel = useCallback(() => {
    teardown()
    setStatus('idle')
    setProgress(INITIAL_PROGRESS)
  }, [teardown])

  const run = useCallback(
    async ({
      skeleton,
      sourceText,
      llmName,
      temperature,
      resolveRef,
    }: RunFillArgs) => {
      teardown()
      const controller = new AbortController()
      abortRef.current = controller
      const live = () => abortRef.current === controller

      setStatus('running')
      setProgress(INITIAL_PROGRESS)
      setResult(null)
      setFailedSections(0)
      setFailedRegions(0)

      const body: Record<string, unknown> = {
        skeleton,
        source_text: sourceText,
        llm_name: llmName,
        variables: collectVariableSamples(skeleton, resolveRef),
      }
      if (temperature != null) body.temperature = temperature

      try {
        const res = await streamReport(
          '/fill',
          body,
          (p: ReportProgress) => {
            if (!live()) return
            const phase = p.phase === 'fill' ? 'fill' : 'expand'
            setProgress({ phase, current: p.current ?? 0, total: p.total ?? 0 })
          },
          controller.signal,
        )
        if (!live()) return
        setResult((res.schema as ReportSchema | undefined) ?? null)
        setFailedSections(Number(res.failedSections ?? 0))
        setFailedRegions(Number(res.failedRegions ?? 0))
        // 需调模型的节全军覆没 → 视为失败;否则完成(可能带部分告警),口径同后端算子。
        const llmSections = Number(res.llmSections ?? 0)
        const okSections = Number(res.okSections ?? 0)
        setStatus(llmSections > 0 && okSections === 0 ? 'error' : 'done')
      } catch (err) {
        if (!live()) return
        if ((err as Error)?.name === 'AbortError') return
        setStatus('error')
      } finally {
        if (live()) abortRef.current = null
      }
    },
    [teardown],
  )

  return {
    run,
    cancel,
    status,
    progress,
    result,
    failedSections,
    failedRegions,
  }
}

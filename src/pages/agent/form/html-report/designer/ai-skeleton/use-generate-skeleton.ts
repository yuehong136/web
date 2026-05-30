/**
 * 「AI 从报告文本生成骨架」hook —— 瘦 SSE 客户端。
 *
 * 编排/解析/拼装已收口到后端 `POST /v1/report/skeleton`(report_skeleton 包):本 hook 只发一次
 * 请求,流式读后端的结构化进度(phase=outline/sections)+ 末尾的 SkeletonSchema,回调出结果。
 * 公共 API 与旧实现一致(generate/cancel/status/progress/error),故对话框无需改动。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SkeletonSchema } from '../../types'
import { type ReportProgress, streamReport } from '../report-sse'

export type GenerateStatus = 'idle' | 'outline' | 'sections' | 'error'
/** 失败类别:解析失败(模型没吐合法 JSON)/ 通用(网络、上游报错) */
export type GenerateError = 'parse' | 'generic'

export interface GenerateProgress {
  phase: 'outline' | 'sections'
  /** 当前第几节(phase==='sections' 时有意义,从 1 起) */
  current: number
  total: number
}

const INITIAL_PROGRESS: GenerateProgress = {
  phase: 'outline',
  current: 0,
  total: 0,
}

export function useGenerateSkeleton(
  onResult: (skeleton: SkeletonSchema) => void,
  mode: 'detailed' | 'layout' = 'detailed',
) {
  const [status, setStatus] = useState<GenerateStatus>('idle')
  const [progress, setProgress] = useState<GenerateProgress>(INITIAL_PROGRESS)
  const [error, setError] = useState<GenerateError | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

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

  const generate = useCallback(
    async (reportText: string, llmName: string) => {
      teardown()
      const controller = new AbortController()
      abortRef.current = controller
      // 取消/被新一轮取代后,旧序列与旧回调不再生效
      const live = () => abortRef.current === controller

      setStatus('outline')
      setProgress(INITIAL_PROGRESS)
      setError(null)

      try {
        const out = await streamReport(
          '/skeleton',
          { report_text: reportText, llm_name: llmName, gen_conf: {}, mode },
          (p: ReportProgress) => {
            if (!live()) return
            const phase = p.phase === 'sections' ? 'sections' : 'outline'
            setStatus(phase)
            setProgress({ phase, current: p.current ?? 0, total: p.total ?? 0 })
          },
          controller.signal,
        )
        if (!live()) return
        const skeleton = (out.skeleton as SkeletonSchema | undefined) ?? null
        if (!skeleton) {
          setError('parse')
          setStatus('error')
          return
        }
        onResultRef.current(skeleton)
        setStatus('idle')
      } catch (err) {
        // 取消触发的 AbortError、或已被新一轮取代:静默退出,不报错
        if (!live() || (err as Error)?.name === 'AbortError') return
        // 后端解析失败信息含 parse/json/section;其余(网络、模型不可用)归通用。
        const msg = (err as Error)?.message ?? ''
        setError(/parse|json|section/i.test(msg) ? 'parse' : 'generic')
        setStatus('error')
      } finally {
        if (live()) abortRef.current = null
      }
    },
    [teardown, mode],
  )

  return { generate, cancel, status, progress, error }
}

/**
 * Designer「试运行」编排:把 `/v1/llm/enhanced_chat_sse` 包成 schema-fill 要的 `callLLM`,
 * 顺序逐节填值,出一份真 ReportSchema。镜像 use-generate-skeleton:复用一个 parser、
 * `live()` 让取消/被取代的旧序列失效、disconnect 收尾。
 *
 * 这一层只负责「调模型 + 状态机」;真正的提示词/解析/merge 在纯模块 schema-fill 里(可单测)。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EnhancedSSEParser,
  type SSEMessage,
  type SSEParserState,
} from '@/components/chat/EnhancedSSEParser'
import type { ChatMessage } from '../prompt-builder'
import { fillSkeleton } from '../schema-fill'
import type { ReportSchema, SkeletonSchema } from '../types'
import { expandOpenRegions } from './ai-skeleton/expand-regions'

const ENDPOINT = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`

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
  /** 生成温度(取自节点配置;缺省时不进 gen_conf,用后端默认) */
  temperature?: number
  /** variable 字段的样本值解析(无变量则永远返回 undefined) */
  resolveRef: (ref: string) => unknown
}

const INITIAL_PROGRESS: RunProgress = { phase: 'expand', current: 0, total: 0 }

export function useRunFill() {
  const [status, setStatus] = useState<RunStatus>('idle')
  const [progress, setProgress] = useState<RunProgress>(INITIAL_PROGRESS)
  const [result, setResult] = useState<ReportSchema | null>(null)
  /** 解析失败、被跳过的节数(部分成功时给用户的告警) */
  const [failedSections, setFailedSections] = useState(0)
  /** 展开失败、被剔除的生成区数 */
  const [failedRegions, setFailedRegions] = useState(0)
  const parserRef = useRef<EnhancedSSEParser | null>(null)

  const teardown = useCallback(() => {
    parserRef.current?.disconnect()
    parserRef.current = null
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
      const parser = new EnhancedSSEParser()
      parserRef.current = parser
      const live = () => parserRef.current === parser

      setStatus('running')
      setProgress(INITIAL_PROGRESS)
      setResult(null)
      setFailedSections(0)
      setFailedRegions(0)

      // 逐节调用:schema-fill 顺序 await,故复用同一 parser;取消时抛出让本节失败、
      // 后续节也立即失败,最终 live() 守卫丢弃整轮结果。
      const callLLM = async (messages: ChatMessage[]): Promise<string> => {
        if (!live()) throw new Error('cancelled')
        let text = ''
        let failed: Error | null = null
        const handle = (message: SSEMessage, state: SSEParserState) => {
          if (message.type === 'text' || message.type === 'complete') {
            text = state.accumulatedText
          } else if (message.type === 'error') {
            failed = new Error('stream error')
          }
        }
        await parser.connect(
          ENDPOINT,
          buildRequest(messages, llmName, temperature),
          handle,
          (err) => {
            failed = err
          },
        )
        if (failed) throw failed
        return text
      }

      try {
        // ① 展开生成区(若有)→ 无生成区的骨架;② 再逐节填值。两段复用同一 callLLM。
        const expanded = await expandOpenRegions(skeleton, {
          sourceText,
          callLLM,
          onProgress: (current, total) => {
            if (live()) setProgress({ phase: 'expand', current, total })
          },
        })
        if (!live()) return
        setFailedRegions(expanded.errors.length)

        const res = await fillSkeleton(expanded.skeleton, {
          sourceText,
          resolveRef,
          callLLM,
          onProgress: (current, total) => {
            if (live()) setProgress({ phase: 'fill', current, total })
          },
        })
        if (!live()) return
        setResult(res.schema)
        setFailedSections(res.errors.length)
        // 需调模型的工作(展开 + 填值)全军覆没 → 视为失败;否则完成(可能带部分告警)
        const modelWork = expanded.openRegions + res.llmSections
        const modelOk = expanded.okRegions + res.okSections
        setStatus(modelWork > 0 && modelOk === 0 ? 'error' : 'done')
      } catch {
        if (live()) setStatus('error')
      } finally {
        if (live()) parserRef.current = null
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

function buildRequest(
  messages: ChatMessage[],
  llmName: string,
  temperature?: number,
) {
  return {
    prompt: '',
    messages,
    llm_name: llmName,
    stream: true,
    gen_conf: temperature == null ? {} : { temperature },
  }
}

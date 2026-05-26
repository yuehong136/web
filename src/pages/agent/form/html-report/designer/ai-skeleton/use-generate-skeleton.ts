/**
 * 调 `/v1/llm/enhanced_chat_sse`,分两步把报告文本转成模板骨架:
 * ① 大纲调用拿到分节;② 逐节调用拿到每节的块——复用同一个 parser 顺序跑,拼成骨架。
 * 大纲解析失败 → 回退「单次整篇生成」;某节解析失败 → 跳过保其余;全失败 → 报错。
 *
 * 错误一律在回调里写 state(parser 吞 onMessage 异常、HTTP 错只走 onError、connect 不
 * reject);取消/卸载时 disconnect,`live()` 让旧回调与旧序列失效。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EnhancedSSEParser,
  type SSEMessage,
  type SSEParserState,
} from '@/components/chat/EnhancedSSEParser'
import { DEFAULT_THEME } from '../../constants'
import type { SkeletonSchema, SkeletonSection } from '../../types'
import {
  type OutlineSection,
  parseOutline,
  parseSection,
  parseSkeletonResponse,
  type ReportOutline,
  SkeletonParseError,
} from './parse'
import {
  buildOutlineMessages,
  buildSectionMessages,
  buildSkeletonMessages,
  type ChatMessage,
} from './prompt'

const ENDPOINT = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`

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
) {
  const [status, setStatus] = useState<GenerateStatus>('idle')
  const [progress, setProgress] = useState<GenerateProgress>(INITIAL_PROGRESS)
  const [error, setError] = useState<GenerateError | null>(null)
  const parserRef = useRef<EnhancedSSEParser | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

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

  const generate = useCallback(
    async (reportText: string, llmName: string) => {
      teardown()
      const parser = new EnhancedSSEParser()
      parserRef.current = parser
      // 取消/被新一轮取代后,旧序列与旧回调不再生效
      const live = () => parserRef.current === parser

      setStatus('outline')
      setProgress(INITIAL_PROGRESS)
      setError(null)

      const fail = (kind: GenerateError) => {
        if (!live()) return
        setError(kind)
        setStatus('error')
      }

      // 跑一段 SSE,返回累计文本;流/网络错抛出(调用方区分),取消则返回部分文本。
      const runCall = async (messages: ChatMessage[]): Promise<string> => {
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
          buildRequest(messages, llmName),
          handle,
          (err) => {
            failed = err
          },
        )
        if (failed) throw failed
        return text
      }

      try {
        // ① 大纲:解析失败 → 回退整篇;网络/流错 → 通用失败
        let outline: ReportOutline | null = null
        try {
          outline = parseOutline(
            await runCall(buildOutlineMessages(reportText)),
          )
        } catch (err) {
          if (!live()) return
          if (!(err instanceof SkeletonParseError)) throw err
          outline = null
        }
        if (!live()) return

        if (!outline) {
          const skeleton = parseSkeletonResponse(
            await runCall(buildSkeletonMessages(reportText)),
          )
          if (!live()) return
          onResultRef.current(skeleton)
          setStatus('idle')
          return
        }

        // ② 逐节
        setStatus('sections')
        const sections: SkeletonSection[] = []
        const total = outline.sections.length
        for (let i = 0; i < total; i += 1) {
          if (!live()) return
          setProgress({ phase: 'sections', current: i + 1, total })
          const os: OutlineSection = outline.sections[i]
          try {
            const section = parseSection(
              await runCall(buildSectionMessages(reportText, os)),
              os,
            )
            if (!live()) return
            sections.push(section)
          } catch (err) {
            if (!live()) return
            if (!(err instanceof SkeletonParseError)) throw err
            // 该节解析失败:跳过,保留其余节
          }
        }
        if (!live()) return
        if (sections.length === 0) {
          fail('parse')
          return
        }
        onResultRef.current({
          title: outline.title,
          sections,
          theme: { ...DEFAULT_THEME },
        })
        setStatus('idle')
      } catch (err) {
        if (live()) {
          fail(err instanceof SkeletonParseError ? 'parse' : 'generic')
        }
      } finally {
        if (live()) parserRef.current = null
      }
    },
    [teardown],
  )

  return { generate, cancel, status, progress, error }
}

function buildRequest(messages: ChatMessage[], llmName: string) {
  return {
    prompt: '',
    messages,
    llm_name: llmName,
    stream: true,
    gen_conf: {},
  }
}

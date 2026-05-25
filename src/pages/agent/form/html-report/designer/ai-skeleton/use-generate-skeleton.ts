/**
 * 调 `/v1/llm/enhanced_chat_sse` 把报告文本转成骨架。
 *
 * 复用 {@link EnhancedSSEParser}(自带 SSE 分帧、token、AbortController)。
 * 注意 parser 内部会**吞掉 onMessage 抛出的异常**且 HTTP 错误只走 onError(connect
 * 不 reject),所以错误一律在回调里写进 state,不靠抛错。文本→进度、complete→解析、
 * error/onError→失败;取消或卸载时 disconnect。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EnhancedSSEParser,
  type SSEMessage,
  type SSEParserState,
} from '@/components/chat/EnhancedSSEParser'
import type { SkeletonSchema } from '../../types'
import { parseSkeletonResponse, SkeletonParseError } from './parse'
import { buildSkeletonMessages } from './prompt'

const ENDPOINT = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`

export type GenerateStatus = 'idle' | 'streaming' | 'error'
/** 失败类别:解析失败(模型没吐合法 JSON)/ 通用(网络、上游报错) */
export type GenerateError = 'parse' | 'generic'

export function useGenerateSkeleton(
  onResult: (skeleton: SkeletonSchema) => void,
) {
  const [status, setStatus] = useState<GenerateStatus>('idle')
  const [progress, setProgress] = useState('')
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
    setProgress('')
  }, [teardown])

  const generate = useCallback(
    async (reportText: string, llmName: string) => {
      teardown()
      setStatus('streaming')
      setProgress('')
      setError(null)

      const parser = new EnhancedSSEParser()
      parserRef.current = parser
      // 取消/被新一轮取代后,旧回调不再生效
      const live = () => parserRef.current === parser

      const fail = (kind: GenerateError) => {
        if (!live()) return
        setError(kind)
        setStatus('error')
      }

      const handle = (message: SSEMessage, state: SSEParserState) => {
        if (!live()) return
        if (message.type === 'text') {
          setProgress(state.accumulatedText)
        } else if (message.type === 'error') {
          fail('generic')
        } else if (message.type === 'complete') {
          try {
            const skeleton = parseSkeletonResponse(state.accumulatedText)
            onResultRef.current(skeleton)
            setStatus('idle')
          } catch (err) {
            fail(err instanceof SkeletonParseError ? 'parse' : 'generic')
          }
        }
      }

      try {
        await parser.connect(
          ENDPOINT,
          buildRequest(reportText, llmName),
          handle,
          () => fail('generic'),
        )
      } catch {
        fail('generic')
      } finally {
        if (live()) parserRef.current = null
      }
    },
    [teardown],
  )

  return { generate, cancel, status, progress, error }
}

function buildRequest(reportText: string, llmName: string) {
  return {
    prompt: '',
    messages: buildSkeletonMessages(reportText),
    llm_name: llmName,
    stream: true,
    gen_conf: {},
  }
}

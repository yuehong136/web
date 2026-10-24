import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { streamStructuredChat } from '@/components/chat/structured-chat-stream'
import { getRunPhaseNotice, type StructuredChatState } from '@/lib/streaming'
import { toast } from '@/lib/toast'

/** Only complete, valid form output can replace user-edited fields. */
const extractFormJson = (text: string): Record<string, string> | null => {
  const candidates = [
    text.match(/\{[\s\S]*\}/)?.[0],
    text.replace(/```json|```/gi, '').trim(),
  ]
  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const parsed: unknown = JSON.parse(candidate)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        Object.values(parsed).every((value) => typeof value === 'string')
      ) {
        return parsed as Record<string, string>
      }
    } catch {
      /* try the next model-output representation */
    }
  }
  return null
}

export const useStructuredAIFill = (
  setIsLoading: (loading: boolean) => void,
) => {
  const { t } = useTranslation()
  const ownerRef = useRef<AbortController | null>(null)
  const [aiFilling, setAiFilling] = useState(false)
  const [aiRawOutput, setAiRawOutput] = useState('')
  useEffect(
    () => () => {
      if (ownerRef.current) {
        ownerRef.current.abort()
        setIsLoading(false)
      }
      ownerRef.current = null
    },
    [setIsLoading],
  )

  const fill = async (
    requestBody: unknown,
  ): Promise<Record<string, string> | null> => {
    if (ownerRef.current) return null
    const owner = new AbortController()
    ownerRef.current = owner
    let latestState: StructuredChatState | undefined
    setAiFilling(true)
    setIsLoading(true)
    setAiRawOutput('')
    try {
      const state = await streamStructuredChat({
        url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`,
        requestBody,
        signal: owner.signal,
        onMessage: () => {},
        onState: (next) => {
          latestState = next
          if (ownerRef.current === owner) setAiRawOutput(next.accumulatedText)
        },
      })
      if (ownerRef.current !== owner) return null
      if (state.phase !== 'completed') {
        toast.error(
          t(getRunPhaseNotice(state.phase) ?? 'chat.stream.interrupted'),
        )
        return null
      }
      const parsed = extractFormJson(state.accumulatedText)
      if (!parsed) toast.error(t('chat.stream.aiFillInvalid'))
      return parsed
    } catch {
      if (ownerRef.current === owner) {
        toast.error(
          t(
            getRunPhaseNotice(latestState?.phase ?? 'failed') ??
              'chat.stream.failed',
          ),
        )
      }
      return null
    } finally {
      if (ownerRef.current === owner) {
        ownerRef.current = null
        setAiFilling(false)
        setIsLoading(false)
      }
    }
  }
  return { aiFilling, aiRawOutput, fill }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import {
  assertSSEResponse,
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  getStreamingAnswerFailureNotice,
  readSSEStream,
  type SSEEnvelope,
} from '@/lib/streaming'
import type { PreviewMessage } from '../types'
import { buildPrologueMessages } from '../utils'

interface UseCreateAppPreviewOptions {
  dialogId: string | null
  quote: boolean
  prologue: string
}

export const useCreateAppPreview = ({
  dialogId,
  quote,
  prologue,
}: UseCreateAppPreviewOptions) => {
  const { t } = useTranslation()
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [previewConversationId, setPreviewConversationId] = useState<
    string | null
  >(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const resetInputs0 = [prologue]
  const [previousInputs0, setPreviousInputs0] = useState<unknown[] | null>(null)
  if (
    previousInputs0 === null ||
    resetInputs0.some(
      (value, index) => !Object.is(value, previousInputs0[index]),
    )
  ) {
    setPreviousInputs0(resetInputs0)

    setPreviewMessages(buildPrologueMessages(prologue))
  }

  const resetInputs1 = [dialogId]
  const [previousInputs1, setPreviousInputs1] = useState<unknown[] | null>(null)
  if (
    previousInputs1 === null ||
    resetInputs1.some(
      (value, index) => !Object.is(value, previousInputs1[index]),
    )
  ) {
    setPreviousInputs1(resetInputs1)

    setPreviewConversationId(null)
  }

  useEffect(
    () => () => {
      abortControllerRef.current?.abort()
    },
    [],
  )

  const getOrCreatePreviewConversation = useCallback(async () => {
    if (previewConversationId) {
      return previewConversationId
    }

    if (!dialogId) {
      toast.error('请先保存应用配置')
      return null
    }

    try {
      const newConversation = await conversationAPI.setConversation({
        dialog_id: dialogId,
        name: `预览会话 - ${new Date().toLocaleString()}`,
        is_new: true,
      })

      if (newConversation?.id) {
        setPreviewConversationId(newConversation.id)
        return newConversation.id
      }

      return null
    } catch (error) {
      console.error('Failed to create preview conversation:', error)
      toast.error('创建预览会话失败')
      return null
    }
  }, [dialogId, previewConversationId])

  const handleStopOutput = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const handleSendPreviewMessage = useCallback(
    async (userContent: string) => {
      if (!userContent.trim() || isStreaming) {
        return
      }

      const conversationId = await getOrCreatePreviewConversation()
      if (!conversationId) {
        return
      }

      const userMessage: PreviewMessage = {
        role: 'user',
        content: userContent.trim(),
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      }

      const assistantMessage: PreviewMessage = {
        role: 'assistant',
        content: '',
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        thinking: '',
      }

      setPreviewMessages((previousMessages) => [
        ...previousMessages,
        userMessage,
        assistantMessage,
      ])
      setIsStreaming(true)
      setInputValue('')
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const historyMessages = previewMessages
          .filter((message) => !message.id.startsWith('prologue-'))
          .map((message) => ({
            role: message.role,
            content: message.content,
          }))

        historyMessages.push({
          role: 'user',
          content: userContent.trim(),
        })

        const response = await conversationAPI.completion(
          {
            conversation_id: conversationId,
            messages: historyMessages,
            quote,
            stream: true,
          },
          { signal: abortController.signal },
        )

        await assertSSEResponse(response)

        let streamState = createInitialStreamingAnswerState()

        await readSSEStream<SSEEnvelope>(response, {
          signal: abortController.signal,
          onEvent: (data) => {
            const chunk = consumeStreamingAnswerChunk(streamState, data)
            streamState = chunk.nextState
            if (chunk.isDone) {
              return
            }
            // 失败且无正文时用固定文案占位，不展示后端错误原文
            const failureNotice = getStreamingAnswerFailureNotice(streamState)
            const content =
              failureNotice === 'chat.stream.failed'
                ? t(failureNotice)
                : streamState.content

            setPreviewMessages((previousMessages) => {
              const nextMessages = [...previousMessages]
              const lastIndex = nextMessages.length - 1
              if (
                lastIndex >= 0 &&
                nextMessages[lastIndex].role === 'assistant'
              ) {
                nextMessages[lastIndex] = {
                  ...nextMessages[lastIndex],
                  content,
                  thinking: streamState.thinking,
                }
              }
              return nextMessages
            })
          },
        })
        const streamFailure = getStreamingAnswerFailureNotice(streamState)
        if (streamFailure === 'chat.stream.interrupted') {
          toast.error(t(streamFailure))
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to send preview message:', error)
          setPreviewMessages((previousMessages) => {
            const nextMessages = [...previousMessages]
            const lastIndex = nextMessages.length - 1
            if (
              lastIndex >= 0 &&
              nextMessages[lastIndex].role === 'assistant'
            ) {
              nextMessages[lastIndex] = {
                ...nextMessages[lastIndex],
                content: '抱歉，发生了错误，请重试。',
              }
            }
            return nextMessages
          })
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [getOrCreatePreviewConversation, isStreaming, previewMessages, quote, t],
  )

  const handleResetPreview = useCallback(() => {
    handleStopOutput()
    setPreviewConversationId(null)
    setPreviewMessages(buildPrologueMessages(prologue))
  }, [handleStopOutput, prologue])

  return {
    previewMessages,
    inputValue,
    setInputValue,
    isStreaming,
    previewConversationId,
    handleSendPreviewMessage,
    handleStopOutput,
    handleResetPreview,
  }
}

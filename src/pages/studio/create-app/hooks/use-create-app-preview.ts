import { useCallback, useEffect, useRef, useState } from 'react'
import { EventSourceParserStream } from 'eventsource-parser/stream'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import { consumeStreamingAnswerChunk, createInitialStreamingAnswerState } from '@/utils/streaming-answer'
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
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [previewConversationId, setPreviewConversationId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setPreviewMessages(buildPrologueMessages(prologue))
  }, [prologue])

  useEffect(() => {
    setPreviewConversationId(null)
  }, [dialogId])

  useEffect(() => (
    () => {
      abortControllerRef.current?.abort()
    }
  ), [])

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

  const handleSendPreviewMessage = useCallback(async (userContent: string) => {
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

    setPreviewMessages((previousMessages) => [...previousMessages, userMessage, assistantMessage])
    setIsStreaming(true)
    setInputValue('')
    abortControllerRef.current = new AbortController()

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

      const response = await conversationAPI.completion({
        conversation_id: conversationId,
        messages: historyMessages,
        quote,
        stream: true,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream())
        .getReader()

      let streamState = createInitialStreamingAnswerState()

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          break
        }

        const { done, value } = await reader.read()
        if (done) {
          break
        }

        try {
          const jsonStr = value?.data
          if (!jsonStr) {
            continue
          }

          const data = JSON.parse(jsonStr)
          const chunk = consumeStreamingAnswerChunk(streamState, data)
          streamState = chunk.nextState
          if (chunk.isDone) {
            continue
          }

          setPreviewMessages((previousMessages) => {
            const nextMessages = [...previousMessages]
            const lastIndex = nextMessages.length - 1
            if (lastIndex >= 0 && nextMessages[lastIndex].role === 'assistant') {
              nextMessages[lastIndex] = {
                ...nextMessages[lastIndex],
                content: streamState.content,
                thinking: streamState.thinking,
              }
            }
            return nextMessages
          })
        } catch {
          // Ignore malformed chunks from the stream.
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to send preview message:', error)
        setPreviewMessages((previousMessages) => {
          const nextMessages = [...previousMessages]
          const lastIndex = nextMessages.length - 1
          if (lastIndex >= 0 && nextMessages[lastIndex].role === 'assistant') {
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
  }, [getOrCreatePreviewConversation, isStreaming, previewMessages, quote])

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

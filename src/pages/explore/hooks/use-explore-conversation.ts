import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { conversationAPI } from '@/api/conversation'
import type { UploadedFileInfo } from '@/config/chat'
import { useChatAbortController } from '@/hooks/use-chat-abort-controller'
import { chatKeys } from '@/hooks/use-chat-request'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ExploreMessage {
  role: 'user' | 'assistant'
  content: string
  id?: string
  references?: ReferenceChunk[]
  thinking?: string
  thinkingComplete?: boolean
  files?: UploadedFileInfo[]
}

interface ConversationDetail {
  id?: string
  name?: string
  message?: {
    role?: string
    content?: string
    id?: string
    reference?: { chunks?: ReferenceChunk[] }
    files?: UploadedFileInfo[]
  }[]
}

/** Own history and stream updates for exactly one selected conversation. */
export function useExploreConversation() {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ExploreMessage[]>([])
  const [selectedConversationDetail, setSelectedConversationDetail] =
    useState<ConversationDetail | null>(null)
  const [activeConversationKey, setActiveConversationKey] = useState<string>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const generation = useRef(0)
  const { createController, abort } = useChatAbortController()

  const captureSession = useCallback(() => {
    const current = generation.current
    return () => current === generation.current
  }, [])

  const abortChat = useCallback(() => {
    generation.current++
    abort()
    setIsStreaming(false)
  }, [abort])

  const resetConversation = useCallback(
    (id?: string) => {
      abortChat()
      setIsLoadingConversation(false)
      setActiveConversationKey(id)
      setSelectedConversationDetail(null)
      setMessages([])
    },
    [abortChat],
  )

  const fetchConversationDetail = useCallback(
    async (id: string) => {
      resetConversation(id)
      const isCurrent = captureSession()
      setIsLoadingConversation(true)
      try {
        const detail: ConversationDetail = await queryClient.fetchQuery({
          queryKey: [...chatKeys.conversationDetail(id), 'explore'],
          queryFn: () => conversationAPI.getConversationDetail(id),
          staleTime: 0,
        })
        if (!isCurrent() || (detail.id && detail.id !== id)) return
        setSelectedConversationDetail({ ...detail, id })
        setMessages(
          (detail.message ?? []).map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content ?? '',
            id: message.id,
            references: message.reference?.chunks ?? [],
            files: Array.isArray(message.files) ? message.files : [],
          })),
        )
      } catch {
        // A failed or stale history read must never clear another session.
        if (isCurrent()) setSelectedConversationDetail(null)
      } finally {
        if (isCurrent()) setIsLoadingConversation(false)
      }
    },
    [captureSession, queryClient, resetConversation],
  )

  useEffect(
    () => () => {
      generation.current++
      abort()
    },
    [abort],
  )

  return {
    messages,
    setMessages,
    selectedConversationDetail,
    setSelectedConversationDetail,
    activeConversationKey,
    setActiveConversationKey,
    isStreaming,
    setIsStreaming,
    isLoadingConversation,
    captureSession,
    resetConversation,
    fetchConversationDetail,
    createController,
    abortChat,
  }
}

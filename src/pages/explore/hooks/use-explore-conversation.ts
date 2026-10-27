import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { conversationAPI } from '@/api/conversation'
import type { UploadedFileInfo } from '@/config/chat'
import { useChatAbortController } from '@/hooks/use-chat-abort-controller'
import { chatKeys } from '@/hooks/use-chat-request'
import {
  isRunTerminal,
  transitionRunPhase,
  type RunPhase,
} from '@/lib/streaming'
import { useAuthStore } from '@/stores/auth'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ExploreMessage {
  role: 'user' | 'assistant'
  content: string
  id?: string
  references?: ReferenceChunk[]
  thinking?: string
  thinkingComplete?: boolean
  files?: UploadedFileInfo[]
  /** Missing on history when the server did not persist a confirmed outcome. */
  runPhase?: RunPhase
}

type ExploreRunUpdate = Partial<
  Pick<ExploreMessage, 'content' | 'thinking' | 'references' | 'runPhase'>
>

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
  const [historyScope] = useState(() => crypto.randomUUID())
  const identityGeneration = useRef(0)
  const activeRun = useRef<{
    messageId: string
    phase: RunPhase
    projection: ExploreRunUpdate
  } | null>(null)
  const { createController, abort } = useChatAbortController()

  const captureSession = useCallback(() => {
    const current = generation.current
    const identity = useAuthStore.getState()
    return () => {
      const latest = useAuthStore.getState()
      return (
        current === generation.current &&
        identity.token === latest.token &&
        identity.user?.id === latest.user?.id &&
        identity.user?.tenant_id === latest.user?.tenant_id &&
        identity.tenant?.id === latest.tenant?.id
      )
    }
  }, [])

  const invalidateSession = useCallback(() => {
    activeRun.current = null
    generation.current++
    abort()
  }, [abort])

  const abortChat = useCallback(() => {
    const run = activeRun.current
    if (run) {
      const projection = { ...run.projection }
      const phase = transitionRunPhase(run.phase, 'locallyStopped')
      setMessages((previous) =>
        previous.map((message) =>
          message.role === 'assistant' && message.id === run.messageId
            ? {
                ...message,
                ...projection,
                runPhase: transitionRunPhase(
                  message.runPhase ?? 'running',
                  phase as Exclude<RunPhase, 'running'>,
                ),
              }
            : message,
        ),
      )
    }
    invalidateSession()
    setIsStreaming(false)
  }, [invalidateSession])

  const beginRun = useCallback(
    (messageId: string) => {
      if (activeRun.current) return null
      generation.current++
      const run = {
        messageId,
        phase: 'running' as RunPhase,
        projection: {} as ExploreRunUpdate,
      }
      activeRun.current = run
      const controller = createController()
      const isCurrent = captureSession()
      setIsStreaming(true)
      return {
        controller,
        isCurrent,
        update: (next: ExploreRunUpdate) => {
          if (!isCurrent() || isRunTerminal(run.phase)) return
          run.phase = next.runPhase ?? run.phase
          run.projection = { ...run.projection, ...next }
          const projection = run.projection
          setMessages((previous) =>
            isCurrent()
              ? previous.map((message) =>
                  message.role === 'assistant' &&
                  message.id === messageId &&
                  (!message.runPhase || !isRunTerminal(message.runPhase))
                    ? { ...message, ...projection }
                    : message,
                )
              : previous,
          )
        },
        finish: () => {
          if (!isCurrent()) return
          activeRun.current = null
          setIsStreaming(false)
        },
      }
    },
    [captureSession, createController],
  )

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
          queryKey: [
            ...chatKeys.conversationDetail(id),
            'explore',
            historyScope,
            identityGeneration.current,
          ],
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
    [captureSession, historyScope, queryClient, resetConversation],
  )

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((current, previous) => {
      if (
        current.token !== previous.token ||
        current.user?.id !== previous.user?.id ||
        current.user?.tenant_id !== previous.user?.tenant_id ||
        current.tenant?.id !== previous.tenant?.id
      ) {
        identityGeneration.current++
        resetConversation()
      }
    })
    return () => {
      unsubscribe()
      invalidateSession()
    }
  }, [invalidateSession, resetConversation])

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
    beginRun,
  }
}

export type ExploreConversation = ReturnType<typeof useExploreConversation>

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import { streamStructuredChat } from '@/components/chat/structured-chat-stream'
import { useStreamBatcher } from '@/hooks/useStreamBatcher'
import {
  createInitialStructuredChatState,
  finalizeStructuredChatState,
  isRunTerminal,
  type StructuredChatState,
} from '@/lib/streaming'
import type { ChatMessage, ChatSession } from '@/types/mcp'

interface OwnedChatRun {
  controller: AbortController
  sessionId: string
  messageId: string
  state: StructuredChatState
  saved: boolean
}

interface McpChatRunOptions {
  sessionId: string | null
  setSessions: Dispatch<SetStateAction<ChatSession[]>>
  onProgress: () => void
}

/** Owns one local subscription; this endpoint has no server cancel contract. */
export const useMcpChatRun = ({
  sessionId,
  setSessions,
  onProgress,
}: McpChatRunOptions) => {
  const ownerRef = useRef<OwnedChatRun | null>(null)
  const mountedRef = useRef(true)
  const [state, setState] = useState(createInitialStructuredChatState)
  const [isStreaming, setIsStreaming] = useState(false)
  const { schedulePatch, flush, reset } = useStreamBatcher<{
    state: StructuredChatState
  }>(
    (patch) => {
      if (patch.state) setState(patch.state)
    },
    { maxDelayMs: 50 },
  )

  const finish = useCallback(
    (owner: OwnedChatRun, finalState: StructuredChatState) => {
      if (ownerRef.current !== owner || !mountedRef.current) return
      owner.state = finalState
      flush()
      reset()
      if (!owner.saved) {
        owner.saved = true
        const message: ChatMessage = {
          id: owner.messageId,
          role: 'assistant',
          content: finalState.accumulatedText,
          timestamp: new Date().toLocaleTimeString(),
          runPhase: finalState.phase,
          parsedToolCalls: finalState.toolCalls.map((call) => ({
            id: call.id,
            name: call.name,
            args: call.arguments,
            result: call.result,
            status: call.status,
            timestamp: call.timestamp,
          })),
        }
        setSessions((sessions) =>
          sessions.map((session) =>
            session.id === owner.sessionId
              ? { ...session, messages: [...session.messages, message] }
              : session,
          ),
        )
      }
      ownerRef.current = null
      setState(finalState)
      setIsStreaming(false)
      owner.controller.abort()
      onProgress()
    },
    [flush, reset, setSessions, onProgress],
  )

  const stop = useCallback(() => {
    const owner = ownerRef.current
    if (owner)
      finish(owner, finalizeStructuredChatState(owner.state, 'aborted'))
  }, [finish])

  useEffect(() => {
    if (ownerRef.current && ownerRef.current.sessionId !== sessionId) stop()
  }, [sessionId, stop])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      ownerRef.current?.controller.abort()
      ownerRef.current = null
    }
  }, [])

  const run = useCallback(
    async (targetSessionId: string, request: MCPChatServiceRequest) => {
      if (ownerRef.current) return
      const owner: OwnedChatRun = {
        controller: new AbortController(),
        sessionId: targetSessionId,
        messageId: crypto.randomUUID(),
        state: createInitialStructuredChatState(),
        saved: false,
      }
      ownerRef.current = owner
      reset()
      setState(owner.state)
      setIsStreaming(true)
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: request.messages.at(-1)?.content ?? '',
        timestamp: new Date().toLocaleTimeString(),
      }
      setSessions((sessions) =>
        sessions.map((session) =>
          session.id === targetSessionId
            ? { ...session, messages: [...session.messages, userMessage] }
            : session,
        ),
      )
      try {
        const finalState = await streamStructuredChat({
          url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`,
          requestBody: request,
          signal: owner.controller.signal,
          onMessage: () => {},
          onState: (next) => {
            if (ownerRef.current !== owner || !mountedRef.current) return
            owner.state = next
            if (isRunTerminal(next.phase)) finish(owner, next)
            else {
              schedulePatch({ state: next })
              onProgress()
            }
          },
        })
        finish(owner, finalState)
      } catch {
        // onState has already published a fixed failure outcome and kept partial content.
        finish(owner, finalizeStructuredChatState(owner.state, 'error'))
      }
    },
    [finish, onProgress, reset, schedulePatch, setSessions],
  )

  return { state, isStreaming, run, stop }
}

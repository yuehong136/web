import { useCallback, useState, type RefObject } from 'react'
import type { ChatMessage } from '../types'
import {
  resolveAnswerKind,
  settleAnswerMessage,
  type AnswerVerdict,
} from '../utils/answer-status'

export interface HomeLocalThread {
  id: string
  /** The first question, as the conversation header shows it. */
  title: string
  messages: ChatMessage[]
  /** When it was set aside, in milliseconds. */
  updatedAt: number
}

interface ShownThread {
  /** False while an app answers: its conversations live on the service. */
  enabled: boolean
  identity: string
  threadIdRef: RefObject<string>
  messagesRef: RefObject<ChatMessage[]>
  /** The request that owns the shown answer, if one is running. */
  requestRef: RefObject<{
    assistantMessageId: string | null
    verdict: AnswerVerdict
  } | null>
  /** Ends the shown request and shows an empty conversation with a new id. */
  clear: () => void
  show: (messages: ChatMessage[]) => void
}

const LIMIT = 20
const NONE: HomeLocalThread[] = []

/**
 * Model and MCP conversations are not saved by the service. A new chat sets
 * the shown one aside (a running answer settles as stopped) so it can be
 * reopened during this visit. The list belongs to one identity and is gone
 * when Home unmounts.
 */
export function useHomeLocalThreads({
  enabled,
  identity,
  threadIdRef,
  messagesRef,
  requestRef,
  clear,
  show,
}: ShownThread) {
  const [state, setState] = useState({ identity, threads: NONE })
  const threads = state.identity === identity ? state.threads : NONE

  const setAside = useCallback(() => {
    const request = requestRef.current
    const kind = request ? resolveAnswerKind(request.verdict, 'stopped') : null
    const messages = messagesRef.current.map((message) =>
      message.id === request?.assistantMessageId
        ? settleAnswerMessage(message, kind)
        : message,
    )
    const title = messages
      .find((message) => message.role === 'user')
      ?.content.trim()
    if (!enabled || !title) return
    const id = threadIdRef.current
    setState((previous) => ({
      identity,
      threads: [
        { id, title, messages, updatedAt: Date.now() },
        ...(previous.identity === identity ? previous.threads : NONE).filter(
          (thread) => thread.id !== id,
        ),
      ].slice(0, LIMIT),
    }))
  }, [enabled, identity, messagesRef, requestRef, threadIdRef])

  const startNewChat = useCallback(() => {
    setAside()
    clear()
  }, [setAside, clear])

  const openLocalThread = useCallback(
    (id: string) => {
      const thread = threads.find((item) => item.id === id)
      if (!enabled || !thread) return
      setState((previous) => ({
        identity,
        threads: previous.threads.filter((item) => item.id !== id),
      }))
      setAside()
      clear()
      threadIdRef.current = thread.id
      show(thread.messages)
    },
    [enabled, identity, threads, setAside, clear, threadIdRef, show],
  )

  return { threads, startNewChat, openLocalThread }
}

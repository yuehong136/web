import { useCallback, type RefObject } from 'react'
import type { ChatMessage } from '../types'

export interface HomeSendOptions {
  /** Replace the last answer: the server swaps its stored history too. */
  regenerate?: boolean
}

type Send = (
  inputValue: string,
  files?: string[],
  options?: HomeSendOptions,
) => Promise<void> | false

/**
 * Asks the last question again in place of an answer that failed or was cut
 * off: the failed question and answer leave the thread and the same question
 * is sent with the history before it. App conversations regenerate on the
 * server (branch history); direct model chats resend the same history.
 * Only the newest answer can be retried, and a rejected send restores it.
 */
export function useHomeRetry({
  messagesRef,
  updateMessages,
  send,
}: {
  messagesRef: RefObject<ChatMessage[]>
  updateMessages: (messages: ChatMessage[]) => void
  send: Send
}) {
  return useCallback(
    (assistantId: string): boolean => {
      const messages = messagesRef.current
      const answer = messages.findIndex((message) => message.id === assistantId)
      if (answer !== messages.length - 1) return false
      const question = messages.findLastIndex(
        (message, index) => index < answer && message.role === 'user',
      )
      if (question < 0) return false
      updateMessages(messages.slice(0, question))
      const accepted = send(messages[question].content, [], {
        regenerate: true,
      })
      if (accepted === false) updateMessages(messages)
      return accepted !== false
    },
    [messagesRef, updateMessages, send],
  )
}

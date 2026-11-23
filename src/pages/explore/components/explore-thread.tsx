import { useMemo, useRef } from 'react'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import {
  ChatTranscript,
  type TranscriptItem,
} from '@/components/chat/chat-transcript'
import { TurnRail, type ThreadTurn } from '@/components/chat/turn-rail'
import { ChatScrollViewport } from '@/components/patterns/chat/chat-scroll-viewport'
import { ExploreChatAnswer } from './explore-chat-answer'
import { ExploreRunNotice } from './explore-run-notice'
import { ExploreMessageAttachments } from './message-attachments'
import type { ExploreMessage } from '../hooks/use-explore-conversation'

const messageKey = (message: ExploreMessage, index: number) =>
  `${message.role}_${message.id || index}`

export interface ExploreThreadProps {
  messages: ExploreMessage[]
  isStreaming: boolean
  onCopy: (content: string) => void
  onRegenerate: (assistantIndex: number) => void
}

/**
 * Explore's thread, the same as Home's: one reading column, no avatars, the
 * model (logo and name) above each answer, actions under it (only the latest
 * keeps them visible). A sent question is anchored near the top while its
 * answer streams in below.
 */
export function ExploreThread({
  messages,
  isStreaming,
  onCopy,
  onRegenerate,
}: ExploreThreadProps) {
  const root = useRef<HTMLDivElement>(null)
  const lastAnswer = messages.findLastIndex(
    (message) => message.role === 'assistant',
  )
  const items = useMemo<TranscriptItem[]>(
    () =>
      messages.map((message, index) => {
        const user = message.role === 'user'
        const streaming =
          isStreaming &&
          !user &&
          index === lastAnswer &&
          (message.runPhase === 'running' ||
            message.runPhase === 'cancelRequested')
        const content = message.content || ''
        // Dots only until the first answer or reasoning text arrives.
        const waiting = streaming && !message.content && !message.thinking
        return {
          id: messageKey(message, index),
          role: message.role,
          phase: streaming ? 'running' : undefined,
          body: user ? (
            <>
              {content}
              <ExploreMessageAttachments files={message.files} />
            </>
          ) : waiting ? (
            <ChatBubbleLoading />
          ) : (
            <ExploreChatAnswer
              content={content}
              thinking={message.thinking}
              messageId={message.id}
              references={message.references}
              isStreaming={streaming}
              runPhase={message.runPhase}
              notice={
                <ExploreRunNotice
                  phase={message.runPhase}
                  onRetry={
                    !isStreaming && index === lastAnswer
                      ? () => onRegenerate(index)
                      : undefined
                  }
                />
              }
              identity={message.modelIdentity ?? {}}
            />
          ),
          actions:
            streaming || !content.trim() ? undefined : (
              <MessageActionsFooter
                className="flex"
                content={content}
                onCopy={() => onCopy(content)}
                onRegenerate={user ? undefined : () => onRegenerate(index)}
                showTTS={!user}
                showRegenerate={!user}
                showFeedback={false}
              />
            ),
        }
      }),
    [messages, isStreaming, lastAnswer, onCopy, onRegenerate],
  )
  const turns = useMemo<ThreadTurn[]>(
    () =>
      messages.flatMap((message, index) =>
        message.role === 'user'
          ? [{ id: messageKey(message, index), question: message.content }]
          : [],
      ),
    [messages],
  )
  return (
    <div
      ref={root}
      className="explore-chat-area app-chat-area relative flex h-full min-h-0 flex-col"
    >
      <ChatScrollViewport
        anchorKey={turns.at(-1)?.id}
        isStreaming={isStreaming}
        className="px-space-md sm:px-space-lg"
        contentClassName="mx-auto w-full max-w-2xl"
      >
        <ChatTranscript items={items} />
      </ChatScrollViewport>
      <TurnRail turns={turns} rootRef={root} />
    </div>
  )
}

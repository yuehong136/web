import { useLayoutEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Bubble, type BubbleListProps } from '@ant-design/x'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
import { MessageActionBar } from '@/components/chat/message-action-bar'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import { CHAT_BUBBLE_ROLES } from '@/components/chat/antx-chat-config'
import { TurnRail, type ThreadTurn } from '@/components/chat/turn-rail'
import { ChatJumpToLatest } from '@/components/patterns/chat/chat-jump-to-latest'
import { useChatScrollFollow } from '@/hooks/use-chat-scroll-follow'
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
 * Explore keeps antd-x Bubble.List, in the same thread look as Home: no
 * avatars, the model (logo and name) above each answer, actions under it
 * (only the latest keeps them visible).
 */
export function ExploreThread({
  messages,
  isStreaming,
  onCopy,
  onRegenerate,
}: ExploreThreadProps) {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const latestQuestion = messages.findLastIndex(
    (message) => message.role === 'user',
  )
  // Same scrolling as Home: the newest question is anchored near the top and
  // its answer streams in below; a loaded conversation opens at the latest.
  const scroll = useChatScrollFollow({
    anchorKey:
      latestQuestion < 0
        ? null
        : messageKey(messages[latestQuestion], latestQuestion),
    pending: isStreaming,
  })
  const { containerRef, contentRef } = scroll
  // Bubble.List hands its scroll box to its ref only after a second render;
  // the element itself is in the DOM from the first commit.
  useLayoutEffect(() => {
    const box = root.current?.querySelector<HTMLElement>(
      '.ant-bubble-list-scroll-box',
    )
    containerRef(box ?? null)
    contentRef(
      box?.querySelector<HTMLElement>(
        ':scope > .ant-bubble-list-scroll-content',
      ) ?? null,
    )
  }, [containerRef, contentRef])
  const lastAnswer = messages.findLastIndex(
    (message) => message.role === 'assistant',
  )
  const items = useMemo<BubbleListProps['items']>(
    () =>
      messages.map((message, index) => {
        const key = messageKey(message, index)
        const user = message.role === 'user'
        const streaming =
          isStreaming &&
          !user &&
          index === lastAnswer &&
          (message.runPhase === 'running' ||
            message.runPhase === 'cancelRequested')
        const content = message.content || ''
        return {
          key,
          role: message.role,
          content,
          streaming,
          // Dots only until the first answer or reasoning text arrives.
          loading: streaming && !message.content && !message.thinking,
          loadingRender: () => <ChatBubbleLoading />,
          contentRender: user
            ? () => (
                <div data-turn-id={key} aria-label={t('chat.transcript.user')}>
                  {content}
                  <ExploreMessageAttachments files={message.files} />
                </div>
              )
            : () => (
                <ExploreChatAnswer
                  content={content}
                  thinking={message.thinking}
                  messageId={message.id}
                  references={message.references}
                  isStreaming={streaming}
                  runPhase={message.runPhase}
                  notice={<ExploreRunNotice phase={message.runPhase} />}
                  identity={message.modelIdentity ?? {}}
                />
              ),
          footer:
            streaming || !content.trim() ? undefined : (
              <MessageActionBar persistent={index === lastAnswer}>
                <MessageActionsFooter
                  className="flex"
                  content={content}
                  onCopy={() => onCopy(content)}
                  onRegenerate={user ? undefined : () => onRegenerate(index)}
                  showTTS={!user}
                  showRegenerate={!user}
                  showFeedback={false}
                />
              </MessageActionBar>
            ),
        }
      }),
    [messages, isStreaming, lastAnswer, onCopy, onRegenerate, t],
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
      className="explore-chat-area app-chat-area relative h-full min-h-0"
    >
      {/* Full-width scroller (scrollbar at the edge), bubbles in the reading column. */}
      <Bubble.List
        items={items}
        autoScroll={false}
        className="h-full"
        // The reading column is set in app-chat-message.css (.explore-chat-area).
        classNames={{ scroll: 'px-space-md py-space-lg sm:px-space-lg' }}
        role={CHAT_BUBBLE_ROLES}
      />
      <TurnRail turns={turns} rootRef={root} />
      {!scroll.isFollowing && (
        <ChatJumpToLatest
          hasNewContent={scroll.hasNewContent}
          onJump={() => scroll.scrollToLatest('smooth')}
        />
      )}
    </div>
  )
}

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useChatScrollFollow } from '@/hooks/use-chat-scroll-follow'
import { ChatJumpToLatest } from './chat-jump-to-latest'
import './chat-scroll-viewport.css'

interface ChatScrollViewportProps {
  children: ReactNode
  /**
   * The newest question's id. When it changes while a reply is pending, the
   * question is anchored near the top; a loaded conversation opens at the
   * latest message instead. Questions carry `data-turn-id`.
   */
  anchorKey?: string | number | null
  /** A reply is being prepared or streamed. */
  pending?: boolean
  isStreaming?: boolean
  className?: string
  contentClassName?: string
}

/**
 * Scrollable chat log that owns anchoring and follow/read behaviour. While
 * the reader is scrolled away from the latest content nothing moves; a button
 * returns to the latest message instead.
 */
export function ChatScrollViewport({
  children,
  anchorKey,
  pending = false,
  isStreaming = false,
  className,
  contentClassName,
}: ChatScrollViewportProps) {
  const { t } = useTranslation()
  const {
    containerRef,
    contentRef,
    container,
    isFollowing,
    hasNewContent,
    scrollToLatest,
  } = useChatScrollFollow({ anchorKey, pending: pending || isStreaming })

  const jumpToLatest = () => {
    scrollToLatest('smooth')
    container?.focus({ preventScroll: true })
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        aria-busy={isStreaming || undefined}
        aria-label={t('chat.scroll.region')}
        // 跳回最新消息后接住焦点，避免按钮消失时焦点落到 body
        tabIndex={-1}
        className={cn(
          'chat-scroll-viewport min-h-0 flex-1 overflow-y-auto outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset',
          className,
        )}
      >
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
        {/* Room below a short answer so its question can stay at the top. */}
        <div
          aria-hidden="true"
          data-chat-anchor-space
          style={{ height: 'var(--chat-anchor-space, 0px)' }}
        />
      </div>
      {!isFollowing && (
        <ChatJumpToLatest hasNewContent={hasNewContent} onJump={jumpToLatest} />
      )}
    </div>
  )
}

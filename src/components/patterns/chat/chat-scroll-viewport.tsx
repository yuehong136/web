import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatScrollFollow } from '@/hooks/use-chat-scroll-follow'

interface ChatScrollViewportProps {
  children: ReactNode
  /** A new value re-attaches the view to the latest content, e.g. after a send. */
  followKey?: string | number | null
  isStreaming?: boolean
  className?: string
  contentClassName?: string
}

/**
 * Scrollable chat log that owns follow/read behaviour. While the reader is
 * scrolled up, new content does not move the view; a button returns to the
 * latest message instead.
 */
export function ChatScrollViewport({
  children,
  followKey,
  isStreaming = false,
  className,
  contentClassName,
}: ChatScrollViewportProps) {
  const { t } = useTranslation()
  const {
    containerRef,
    contentRef,
    isFollowing,
    hasNewContent,
    handleScroll,
    scrollToLatest,
  } = useChatScrollFollow()

  useEffect(() => {
    scrollToLatest()
  }, [followKey, scrollToLatest])

  const jumpToLatest = () => {
    scrollToLatest('smooth')
    containerRef.current?.focus({ preventScroll: true })
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
        onScroll={handleScroll}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-inset',
          className,
        )}
      >
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </div>
      {!isFollowing && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-space-md left-1/2 flex -translate-x-1/2 items-center gap-space-xs rounded-radius-full border border-border-default bg-components-card-bg px-space-md py-space-xs text-sm text-text-secondary shadow-elevation-medium outline-hidden transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus"
        >
          <ArrowDown className="size-icon-sm" aria-hidden="true" />
          <span>
            {hasNewContent
              ? t('chat.scroll.newContent')
              : t('chat.scroll.latest')}
          </span>
        </button>
      )}
    </div>
  )
}

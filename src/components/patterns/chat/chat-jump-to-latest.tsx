import { useTranslation } from 'react-i18next'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The floating "back to latest" button of a chat log. Shown while the end of
 * the conversation is out of view; says when new content arrived below.
 */
export function ChatJumpToLatest({
  hasNewContent,
  onJump,
  className,
}: {
  hasNewContent: boolean
  onJump: () => void
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onJump}
      data-chat-jump-to-latest
      className={cn(
        'absolute bottom-space-md left-1/2 z-10 flex -translate-x-1/2 items-center gap-space-xs rounded-radius-full border border-border-default bg-components-card-bg px-space-md py-space-xs text-sm text-text-secondary shadow-elevation-medium outline-hidden transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus',
        className,
      )}
    >
      <ArrowDown className="size-icon-sm" aria-hidden="true" />
      <span>
        {hasNewContent ? t('chat.scroll.newContent') : t('chat.scroll.latest')}
      </span>
    </button>
  )
}

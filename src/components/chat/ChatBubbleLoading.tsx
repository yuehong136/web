import * as React from 'react'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/components/chat/app-chat-message.css'

/** The answer has not started yet: one quiet “Thinking…” line. */
export const ChatBubbleLoading = React.memo(() => {
  const { t } = useTranslation()
  return (
    <output
      className="inline-flex min-h-[var(--control-height-sm)] items-center gap-space-xs text-sm text-text-secondary"
      aria-label={t('common.loading')}
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-icon-sm animate-spin text-text-tertiary motion-reduce:animate-none"
      />
      <span className="chat-shimmer">{t('chat.thread.thinking')}</span>
    </output>
  )
})

ChatBubbleLoading.displayName = 'ChatBubbleLoading'

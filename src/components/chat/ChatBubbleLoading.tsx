import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { BrandGlyph } from '@/components/layout/brand-glyph'
import '@/components/chat/app-chat-message.css'

/**
 * The answer has not started yet: one quiet “Thinking…” line. Pass
 * `showGlyph={false}` where the answer's identity row already shows the
 * thinking glyph.
 */
export const ChatBubbleLoading = React.memo(
  ({ showGlyph = true }: { showGlyph?: boolean }) => {
    const { t } = useTranslation()
    return (
      <output
        className="inline-flex min-h-[var(--control-height-sm)] items-center gap-space-xs text-sm text-fg-muted"
        aria-label={t('common.loading')}
      >
        {showGlyph && (
          <BrandGlyph state="thinking" className="size-icon-md text-fg" />
        )}
        <span className="text-shimmer">{t('chat.thread.thinking')}</span>
      </output>
    )
  },
)

ChatBubbleLoading.displayName = 'ChatBubbleLoading'

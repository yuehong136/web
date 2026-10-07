import * as React from 'react'
import { useTranslation } from 'react-i18next'

export const ChatBubbleLoading = React.memo(() => {
  const { t } = useTranslation()
  return (
    <output
      className="inline-flex items-center gap-1 px-space-xs py-space-xs"
      aria-label={t('common.loading')}
    >
      <span className="ant-bubble-dot-item size-1.5 animate-bounce rounded-radius-full [animation-delay:-0.2s] motion-reduce:animate-none" />
      <span className="ant-bubble-dot-item size-1.5 animate-bounce rounded-radius-full [animation-delay:-0.1s] motion-reduce:animate-none" />
      <span className="ant-bubble-dot-item size-1.5 animate-bounce rounded-radius-full motion-reduce:animate-none" />
    </output>
  )
})

ChatBubbleLoading.displayName = 'ChatBubbleLoading'

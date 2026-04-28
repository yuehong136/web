import React from 'react'

export const ChatBubbleLoading = React.memo(() => (
  <span
    className="inline-flex items-center gap-1 px-space-xs py-space-xs"
    aria-label="Loading"
  >
    <span className="ant-bubble-dot-item size-1.5 rounded-radius-full animate-bounce [animation-delay:-0.2s]" />
    <span className="ant-bubble-dot-item size-1.5 rounded-radius-full animate-bounce [animation-delay:-0.1s]" />
    <span className="ant-bubble-dot-item size-1.5 rounded-radius-full animate-bounce" />
  </span>
))

ChatBubbleLoading.displayName = 'ChatBubbleLoading'

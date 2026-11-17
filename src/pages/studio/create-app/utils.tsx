import type { ReactNode } from 'react'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'
import { DEFAULT_PROLOGUE } from './constants'
import type { PreviewMessage } from './types'

/**
 * The system prompt preview, on the same Markdown renderer as chat answers.
 * Raw HTML (often prompt markup such as `<context>`) is shown as text, never
 * parsed, so the preview matches what the model receives.
 */
export const renderMarkdown = (content: string | ReactNode) => {
  if (!content || typeof content !== 'string') {
    return content
  }

  return (
    <StreamingXMarkdown
      content={content}
      isStreaming={false}
      escapeRawHtml
      className="markdown-content text-sm"
    />
  )
}

export const buildPrologueMessages = (prologue?: string): PreviewMessage[] => {
  const content = prologue || DEFAULT_PROLOGUE

  if (!content) {
    return []
  }

  return [
    {
      role: 'assistant',
      content,
      id: `prologue-${Date.now()}`,
    },
  ]
}

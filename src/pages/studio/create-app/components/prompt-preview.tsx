import type { ReactNode } from 'react'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'

/**
 * The system prompt preview, on the same Markdown renderer as chat answers.
 * Raw HTML (often prompt markup such as `<context>`) is shown as text, never
 * parsed, so the preview matches what the model receives. Kept apart from
 * `../utils` so the preview hooks don't load the Markdown renderer.
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

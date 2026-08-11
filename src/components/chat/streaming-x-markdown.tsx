import { memo, useEffect, useRef, useState } from 'react'
import XMarkdown, { type XMarkdownProps } from '@ant-design/x-markdown'
import { getMarkdownStreamingOptions } from './MarkdownCodeBlock'

export interface StreamingXMarkdownProps extends Omit<
  XMarkdownProps,
  'children' | 'content' | 'streaming'
> {
  content: string
  isStreaming: boolean
}

function useFrameThrottledContent(
  content: string,
  isStreaming: boolean,
): string {
  const latestContentRef = useRef(content)
  const [renderedContent, setRenderedContent] = useState(content)

  useEffect(() => {
    latestContentRef.current = content

    if (!isStreaming) {
      setRenderedContent(content)
      return undefined
    }

    // XMarkdown mirrors streaming input into its own effect-driven state.
    // Coalesce SSE bursts so that chain cannot exceed React's update-depth limit.
    const rafId = requestAnimationFrame(() => {
      setRenderedContent(latestContentRef.current)
    })

    return () => cancelAnimationFrame(rafId)
  }, [content, isStreaming])

  return isStreaming ? renderedContent : content
}

export const StreamingXMarkdown = memo(
  ({ content, isStreaming, ...props }: StreamingXMarkdownProps) => {
    const renderedContent = useFrameThrottledContent(content, isStreaming)

    return (
      <XMarkdown
        {...props}
        streaming={getMarkdownStreamingOptions(isStreaming)}
      >
        {renderedContent}
      </XMarkdown>
    )
  },
)

StreamingXMarkdown.displayName = 'StreamingXMarkdown'

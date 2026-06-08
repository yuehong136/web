import { memo, useEffect, useRef, useState } from 'react'
import XMarkdown from '@ant-design/x-markdown'
import {
  getMarkdownStreamingOptions,
  markdownConfig,
  type MarkdownComponents,
  useMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'

interface StableMarkdownProps {
  content: string
  components?: Partial<MarkdownComponents>
}

export const StableMarkdown = memo(
  ({ content, components }: StableMarkdownProps) => {
    const stableContentRef = useRef(content)
    const [stableContent, setStableContent] = useState(content)
    const markdownComponents = useMarkdownComponents(components)

    useEffect(() => {
      if (content !== stableContentRef.current) {
        stableContentRef.current = content
        const rafId = requestAnimationFrame(() => {
          setStableContent(content)
        })
        return () => cancelAnimationFrame(rafId)
      }
      return undefined
    }, [content])

    if (!stableContent || !stableContent.trim()) {
      return null
    }

    return (
      <div className="bubble-copy-text markdown-content prose prose-sm max-w-none">
        <XMarkdown
          paragraphTag="div"
          config={markdownConfig}
          components={markdownComponents}
          streaming={getMarkdownStreamingOptions(false)}
        >
          {stableContent}
        </XMarkdown>
      </div>
    )
  },
  (prevProps, nextProps) => {
    if (
      prevProps.content === nextProps.content &&
      prevProps.components === nextProps.components
    )
      return true
    const diff = Math.abs(
      (nextProps.content?.length || 0) - (prevProps.content?.length || 0),
    )
    return diff < 10 && nextProps.content?.startsWith(prevProps.content || '')
  },
)

StableMarkdown.displayName = 'StableMarkdown'

interface StreamingMarkdownProps {
  content: string
  isStreaming: boolean
  components?: Partial<MarkdownComponents>
}

export const StreamingMarkdown = memo(
  ({ content, isStreaming, components }: StreamingMarkdownProps) => {
    const markdownComponents = useMarkdownComponents(components)

    if (!content || !content.trim()) {
      return null
    }

    return (
      <div className="bubble-copy-text markdown-content prose prose-sm max-w-none">
        <XMarkdown
          paragraphTag="div"
          config={markdownConfig}
          components={markdownComponents}
          streaming={getMarkdownStreamingOptions(isStreaming)}
        >
          {content}
        </XMarkdown>
      </div>
    )
  },
)

StreamingMarkdown.displayName = 'StreamingMarkdown'

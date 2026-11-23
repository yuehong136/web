import { memo, useEffect, useMemo, useRef, useState } from 'react'
import XMarkdown, { type XMarkdownProps } from '@ant-design/x-markdown'
import { getMarkdownStreamingOptions } from './MarkdownCodeBlock'
import { MATH_FORMULA_TAG } from './latex-extension'
import { MathFormula } from './math-formula'

type Components = NonNullable<XMarkdownProps['components']>
const MATH_COMPONENTS: Components = { [MATH_FORMULA_TAG]: MathFormula }

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

  const [previousStreaming, setPreviousStreaming] = useState(isStreaming)
  if (previousStreaming !== isStreaming) {
    setPreviousStreaming(isStreaming)
    setRenderedContent(content)
  }

  useEffect(() => {
    latestContentRef.current = content

    if (!isStreaming) {
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
  ({ content, isStreaming, components, ...props }: StreamingXMarkdownProps) => {
    const renderedContent = useFrameThrottledContent(content, isStreaming)
    // Every surface renders the TeX placeholders the chat config writes.
    const withMath = useMemo(
      () =>
        components ? { ...MATH_COMPONENTS, ...components } : MATH_COMPONENTS,
      [components],
    )

    return (
      <XMarkdown
        {...props}
        components={withMath}
        streaming={getMarkdownStreamingOptions(isStreaming)}
      >
        {renderedContent}
      </XMarkdown>
    )
  },
)

StreamingXMarkdown.displayName = 'StreamingXMarkdown'

import { useEffect, useRef, useState } from 'react'

/** Same frame policy as current StreamingXMarkdown; candidate gets no timing shortcut. */
export function useMatchedFramePolicy(
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
    if (!isStreaming) return undefined
    const rafId = requestAnimationFrame(() =>
      setRenderedContent(latestContentRef.current),
    )
    return () => cancelAnimationFrame(rafId)
  }, [content, isStreaming])
  return isStreaming ? renderedContent : content
}

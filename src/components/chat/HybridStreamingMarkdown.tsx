import React, { useEffect, useRef, useState } from 'react'
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown'
import { getMarkdownStreamingOptions, markdownCodeComponents, markdownConfig } from '@/components/chat/MarkdownCodeBlock'

interface HybridStreamingMarkdownProps {
  content: string
  isStreaming: boolean
  components?: Record<string, React.ComponentType<ComponentProps>>
}

const MarkdownBlock = React.memo(
  ({ content, components }: { content: string; components?: Record<string, React.ComponentType<ComponentProps>> }) => {
    if (!content || !content.trim()) return null
    return (
      <XMarkdown
        paragraphTag="div"
        config={markdownConfig}
        components={{ ...markdownCodeComponents, ...components }}
        streaming={getMarkdownStreamingOptions(false)}
      >
        {content}
      </XMarkdown>
    )
  }
)

const PlainTail = React.memo(({ content }: { content: string }) => {
  if (!content || !content.trim()) return null
  return (
    <div className="bubble-copy-text text-sm whitespace-pre-wrap break-words leading-6 text-text-primary">
      {content}
    </div>
  )
})

const extractStableBoundary = (input: string, initialInCodeBlock: boolean) => {
  let inCodeBlock = initialInCodeBlock
  let scanIndex = 0
  let lastStableIndex = 0

  while (scanIndex < input.length) {
    const lineEnd = input.indexOf('\n', scanIndex)
    if (lineEnd === -1) break

    const line = input.slice(scanIndex, lineEnd + 1)
    const trimmed = line.trim()

    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock
      if (!inCodeBlock) {
        lastStableIndex = lineEnd + 1
      }
    } else if (!inCodeBlock && trimmed === '') {
      lastStableIndex = lineEnd + 1
    }

    scanIndex = lineEnd + 1
  }

  return {
    stableIndex: lastStableIndex,
    inCodeBlock,
  }
}

export const HybridStreamingMarkdown = React.memo(
  ({ content, isStreaming, components }: HybridStreamingMarkdownProps) => {
    const previousContentRef = useRef('')
    const stablePrefixRef = useRef('')
    const pendingTailRef = useRef('')
    const inCodeBlockRef = useRef(false)

    const [stablePrefix, setStablePrefix] = useState('')
    const [pendingTail, setPendingTail] = useState(content)

    useEffect(() => {
      if (!isStreaming) {
        previousContentRef.current = content
        stablePrefixRef.current = ''
        pendingTailRef.current = ''
        inCodeBlockRef.current = false
        setStablePrefix('')
        setPendingTail(content)
        return
      }

      const previousContent = previousContentRef.current
      const isAppendUpdate = !!previousContent && content.startsWith(previousContent)
      const delta = isAppendUpdate ? content.slice(previousContent.length) : content

      let workingTail = isAppendUpdate ? pendingTailRef.current + delta : content
      let workingStable = isAppendUpdate ? stablePrefixRef.current : ''
      let codeBlockState = isAppendUpdate ? inCodeBlockRef.current : false

      const { stableIndex, inCodeBlock } = extractStableBoundary(workingTail, codeBlockState)
      codeBlockState = inCodeBlock

      if (stableIndex > 0) {
        workingStable += workingTail.slice(0, stableIndex)
        workingTail = workingTail.slice(stableIndex)
      }

      previousContentRef.current = content
      stablePrefixRef.current = workingStable
      pendingTailRef.current = workingTail
      inCodeBlockRef.current = codeBlockState

      setStablePrefix(workingStable)
      setPendingTail(workingTail)
    }, [content, isStreaming])

    if (!content || !content.trim()) return null

    if (!isStreaming) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert bubble-copy-text">
          <MarkdownBlock content={content} components={components} />
        </div>
      )
    }

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert bubble-copy-text">
        {stablePrefix && <MarkdownBlock content={stablePrefix} components={components} />}
        {pendingTail && <PlainTail content={pendingTail} />}
      </div>
    )
  }
)

HybridStreamingMarkdown.displayName = 'HybridStreamingMarkdown'

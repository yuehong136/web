import { memo, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { markdownConfig, useMarkdownComponents } from './MarkdownCodeBlock'
import { ChatBubbleLoading } from './ChatBubbleLoading'
import { RetrievalProgress } from './retrieval-progress'
import { ThinkWrapper } from './ThinkWrapper'
import { CarouselWrapper } from './CarouselWrapper'
import { ReferenceImageList } from './ReferenceImageList'
import { createReferenceMarkerComponent } from './ReferenceMarker'
import { ReferencePanel } from './ReferencePanel'
import { StreamingXMarkdown } from './streaming-x-markdown'
import { RunTimeline } from './run-timeline'
import {
  isRunTerminal,
  type AgentTimelineNode,
  type RunPhase,
} from '@/lib/streaming'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import {
  convertReferencesToSup,
  processContentForCarousel,
} from '@/utils/message-utils'
import { extractThinkContent } from '@/utils/think-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import '@/components/chat/app-chat-message.css'

const NO_REFERENCES: ReferenceChunk[] = []
export interface MessagePartsProps {
  content: string
  thinking?: string
  messageId?: string
  references?: ReferenceChunk[]
  run: { phase: RunPhase; steps?: AgentTimelineNode[] }
  notice?: ReactNode
  onViewReference: (chunk: ReferenceChunk, references: ReferenceChunk[]) => void
}

/** Text, reasoning, observed tool steps and citations share one rendering path. */
export const MessageParts = memo(function MessageParts({
  content,
  thinking,
  messageId,
  references = NO_REFERENCES,
  run,
  notice,
  onViewReference,
}: MessagePartsProps) {
  const { t } = useTranslation()
  const isStreaming = !isRunTerminal(run.phase)
  const fallback = extractThinkContent(content)
  const nodes = run.steps ?? []
  const lastNode = nodes.at(-1)
  const trailingReasoning =
    lastNode?.kind === 'reasoning' && typeof lastNode.content === 'string'
      ? lastNode.content
      : ''
  const chainNodes = trailingReasoning ? nodes.slice(0, -1) : nodes
  const hasToolFlow = chainNodes.some((node) =>
    ['tool', 'mcp', 'skill', 'system'].includes(node.kind),
  )
  const thinkContent =
    trailingReasoning || (nodes.length ? '' : thinking || fallback.thinkContent)
  const mainContent = fallback.mainContent
  const citationComponents = useMemo(
    () => ({
      sup: createReferenceMarkerComponent(references, {
        onViewDetail: (chunk) => onViewReference(chunk, references),
        onCopy: (text) =>
          void copyToClipboardWithFeedback(
            text,
            t('common.copied'),
            t('common.copyFailed'),
          ),
      }),
    }),
    [references, onViewReference, t],
  )
  const markdownComponents = useMarkdownComponents(citationComponents)
  const { content: processedContent, carouselGroups } = useMemo(
    () => processContentForCarousel(mainContent, references),
    [mainContent, references],
  )
  const markdown = references.length
    ? convertReferencesToSup(processedContent)
    : processedContent
  const renderPart = (part: string, key?: string) => (
    <StreamingXMarkdown
      key={key}
      paragraphTag="div"
      config={markdownConfig}
      components={markdownComponents}
      content={part}
      isStreaming={isStreaming}
    />
  )
  const parts: ReactNode[] = []
  if (carouselGroups.length) {
    markdown
      .split(/<carousel-placeholder[^>]*><\/carousel-placeholder>/g)
      .forEach((part, index) => {
        if (part.trim()) parts.push(renderPart(part, `text-${index}`))
        if (index < carouselGroups.length)
          parts.push(
            <CarouselWrapper
              key={`carousel-${index}`}
              group={carouselGroups[index]}
              chunks={references}
            />,
          )
      })
  }
  return (
    <div className="message-parts space-y-space-md" data-run-phase={run.phase}>
      {hasToolFlow && <RunTimeline nodes={chainNodes} phase={run.phase} />}
      <RetrievalProgress result={fallback} isStreaming={isStreaming} />
      {thinkContent && (
        <ThinkWrapper
          status={
            isStreaming &&
            (trailingReasoning
              ? lastNode?.status === 'loading'
              : Boolean(thinking) || fallback.status === 'thinking')
              ? 'thinking'
              : 'complete'
          }
          messageId={messageId}
          titles={
            run.phase === 'completed'
              ? undefined
              : { complete: t('chat.thinking.details') }
          }
        >
          <section
            aria-label={t('chat.thinking.details')}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- long reasoning is keyboard scrollable
            tabIndex={0}
            className="max-h-64 overflow-y-auto overscroll-contain whitespace-pre-wrap text-text-secondary"
          >
            {thinkContent}
          </section>
        </ThinkWrapper>
      )}
      {mainContent && (
        <div className="bubble-copy-text markdown-content prose max-w-none">
          {carouselGroups.length ? parts : renderPart(markdown)}
        </div>
      )}
      {isStreaming &&
        !mainContent &&
        !thinkContent &&
        !nodes.length &&
        fallback.retrievalStatus === 'none' && <ChatBubbleLoading />}
      {notice}
      {!!references.length && !isStreaming && (
        <>
          <ReferenceImageList
            referenceChunks={references}
            messageContent={mainContent}
            onImageClick={(chunk) => onViewReference(chunk, references)}
          />
          <ReferencePanel
            chunks={references}
            variant="inline"
            onChunkClick={(chunk) => onViewReference(chunk, references)}
            defaultVisiblePerDoc={2}
            className="mt-space-xs"
          />
        </>
      )}
    </div>
  )
})

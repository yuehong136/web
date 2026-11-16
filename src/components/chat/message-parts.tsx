import { memo, useId, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { markdownConfig, useMarkdownComponents } from './MarkdownCodeBlock'
import { ChatBubbleLoading } from './ChatBubbleLoading'
import { RetrievalProgress } from './retrieval-progress'
import { ReasoningDisclosure } from './reasoning-disclosure'
import { CarouselWrapper } from './CarouselWrapper'
import { ReferenceImageList } from './ReferenceImageList'
import { createReferenceMarkerComponent } from './ReferenceMarker'
import { SourceStrip } from './source-strip'
import { StreamingXMarkdown } from './streaming-x-markdown'
import { RunTimeline } from './run-timeline'
import { getCitedChunks } from './citation-utils'
import type { EvidenceOptions } from './chat-workspace-context'
import { ArtifactMessageContext } from '@/components/chat/artifact-message-context'
import { ContextManifestSummary } from '@/components/chat/context-manifest-summary'
import type { ContextManifest } from '@/lib/ai-workspace/contracts'
import type { AgentTimelineNode, RunPhase } from '@/lib/streaming'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import {
  convertReferencesToSup,
  processContentForCarousel,
} from '@/utils/message-utils'
import { extractThinkContent } from '@/utils/think-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { hasCitationMarkers } from '@/utils/reference-utils'
import '@/components/chat/app-chat-message.css'

const NO_REFERENCES: ReferenceChunk[] = []
export interface MessagePartsProps {
  content: string
  thinking?: string
  messageId?: string
  contextManifest?: ContextManifest
  references?: ReferenceChunk[]
  run: { phase?: RunPhase; steps?: AgentTimelineNode[] }
  notice?: ReactNode
  /** `options.messageId` is this message's id, so one stable handler serves every message. */
  onViewReference: (
    chunk: ReferenceChunk,
    references: ReferenceChunk[],
    options?: EvidenceOptions & { messageId?: string },
  ) => void
}

/** Text, reasoning, observed tool steps and citations share one rendering path. */
export const MessageParts = memo(function MessageParts({
  content,
  thinking,
  messageId,
  contextManifest,
  references = NO_REFERENCES,
  run,
  notice,
  onViewReference,
}: MessagePartsProps) {
  const { t } = useTranslation()
  const generatedMessageId = useId()
  const isStreaming = run.phase === 'running' || run.phase === 'cancelRequested'
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
  // Stable while streaming text grows, so the citation markers keep their identity.
  const citedKey = getCitedChunks(mainContent, references)
    .map((chunk) => references.indexOf(chunk))
    .join(',')
  const cited = useMemo(
    () =>
      citedKey ? citedKey.split(',').map((index) => references[+index]) : [],
    [citedKey, references],
  )
  // 已结束却没有引用数据（终帧前停止、历史对不上）时 [ID:n] 也转成角标，解析不到的
  // 渲染为不可交互的上标；流式中等终帧引用，正文不带 [ID:n] 时不接管模型自己写的 <sup>
  const hasCitations =
    references.length > 0 || (!isStreaming && hasCitationMarkers(mainContent))
  const citationComponents = useMemo(
    () =>
      hasCitations
        ? {
            sup: createReferenceMarkerComponent(references, {
              onViewDetail: (chunk) =>
                onViewReference(chunk, references, { cited, messageId }),
              onCopy: (text) =>
                void copyToClipboardWithFeedback(
                  text,
                  t('common.copied'),
                  t('common.copyFailed'),
                ),
            }),
          }
        : undefined,
    [hasCitations, references, cited, messageId, onViewReference, t],
  )
  const markdownComponents = useMarkdownComponents(citationComponents)
  const { content: processedContent, carouselGroups } = useMemo(
    () => processContentForCarousel(mainContent, references),
    [mainContent, references],
  )
  const markdown = hasCitations
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
  const showSources = references.length > 0 && !isStreaming
  const openChunks = () =>
    onViewReference(cited[0] ?? references[0], references, {
      view: 'chunks',
      cited,
      messageId,
    })
  return (
    <ArtifactMessageContext value={messageId ?? generatedMessageId}>
      <div
        className="message-parts space-y-space-sm"
        data-run-phase={run.phase}
      >
        {contextManifest && (
          <ContextManifestSummary manifest={contextManifest} />
        )}
        {hasToolFlow && run.phase && (
          <RunTimeline nodes={chainNodes} phase={run.phase} />
        )}
        <RetrievalProgress result={fallback} isStreaming={isStreaming} />
        {thinkContent && (
          <ReasoningDisclosure
            key={messageId}
            content={thinkContent}
            thinking={
              isStreaming &&
              (trailingReasoning
                ? lastNode?.status === 'loading'
                : Boolean(thinking) || fallback.status === 'thinking')
            }
          />
        )}
        {showSources && !hasToolFlow && (
          <button
            type="button"
            data-retrieval-summary
            onClick={openChunks}
            className="inline-flex min-h-[var(--control-height-sm)] max-w-full items-center gap-space-xs rounded-radius-sm text-start text-sm text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus"
          >
            <Search
              aria-hidden="true"
              className="size-icon-sm shrink-0 text-text-tertiary"
            />
            {cited.length
              ? t('chat.thread.retrievedCited', {
                  count: references.length,
                  cited: cited.length,
                })
              : t('chat.thread.retrieved', { count: references.length })}
          </button>
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
        {showSources && (
          <>
            <ReferenceImageList
              referenceChunks={references}
              messageContent={mainContent}
              onImageClick={(chunk) =>
                onViewReference(chunk, references, { cited, messageId })
              }
            />
            <SourceStrip
              references={references}
              cited={cited}
              onOpen={(chunk) =>
                onViewReference(chunk, references, { cited, messageId })
              }
              onShowAll={openChunks}
            />
          </>
        )}
      </div>
    </ArtifactMessageContext>
  )
})

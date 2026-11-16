import { memo, useId, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { markdownConfig, useMarkdownComponents } from './MarkdownCodeBlock'
import { ChatBubbleLoading } from './ChatBubbleLoading'
import { ReasoningDisclosure } from './reasoning-disclosure'
import { CarouselWrapper } from './CarouselWrapper'
import { ReferenceImageList } from './ReferenceImageList'
import { createCitationChipComponent } from './citation-chip'
import { SourceStrip } from './source-strip'
import { StreamingXMarkdown } from './streaming-x-markdown'
import { RunTimeline, type RetrievalStepData } from './run-timeline'
import { AnswerIdentity, type AnswerIdentityProps } from './answer-identity'
import { getCitedChunks, groupAdjacentCitations } from './citation-utils'
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
  /** Who answered (provider logo, model name) and when, shown above the answer. */
  identity?: AnswerIdentityProps
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

/** Identity, observed steps, reasoning, text and citations share one rendering path. */
export const MessageParts = memo(function MessageParts({
  content,
  thinking,
  messageId,
  identity,
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
  // Stable while streaming text grows, so the citation chips keep their identity.
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
            sup: createCitationChipComponent(references, {
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
    ? groupAdjacentCitations(convertReferencesToSup(processedContent))
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
  const retrieval: RetrievalStepData | null =
    fallback.retrievalStatus === 'none'
      ? null
      : {
          status:
            fallback.retrievalStatus === 'complete'
              ? 'complete'
              : isStreaming
                ? 'loading'
                : 'interrupted',
          content: fallback.retrievalContent.replace(/<\/?br\s*\/?>/gi, '\n'),
          hits: references.length || undefined,
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
        {identity && <AnswerIdentity {...identity} />}
        {contextManifest && (
          <ContextManifestSummary manifest={contextManifest} />
        )}
        <RunTimeline
          nodes={hasToolFlow ? chainNodes : []}
          phase={run.phase}
          retrieval={retrieval}
        />
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

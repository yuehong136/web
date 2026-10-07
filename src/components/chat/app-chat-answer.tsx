import { memo, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  markdownConfig,
  useMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
import { ThinkWrapper } from '@/components/chat/ThinkWrapper'
import { CarouselWrapper } from '@/components/chat/CarouselWrapper'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import {
  convertReferencesToSup,
  processContentForCarousel,
} from '@/utils/message-utils'
import { extractThinkContent } from '@/utils/think-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

const NO_REFERENCES: ReferenceChunk[] = []
export interface AppChatAnswerProps {
  content: string
  thinking?: string
  messageId?: string
  references?: ReferenceChunk[]
  isStreaming: boolean
  onViewReference: (chunk: ReferenceChunk, references: ReferenceChunk[]) => void
}

/** The same reasoning, Markdown, charts and citations on both application surfaces. */
export const AppChatAnswer = memo(function AppChatAnswer({
  content,
  thinking,
  messageId,
  references = NO_REFERENCES,
  isStreaming,
  onViewReference,
}: AppChatAnswerProps) {
  const { t } = useTranslation()
  const fallback = extractThinkContent(content)
  const thinkContent = thinking || fallback.thinkContent
  const mainContent = thinking ? content : fallback.mainContent
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
    <div className="space-y-space-sm">
      {thinkContent && (
        <ThinkWrapper
          status={isStreaming ? 'thinking' : 'complete'}
          messageId={messageId}
        >
          <section
            aria-label={t('chat.thinking.details')}
            // Keyboard focus lets users scroll reasoning without moving the conversation.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="max-h-64 overflow-y-auto overscroll-contain text-sm whitespace-pre-wrap text-text-secondary"
          >
            {thinkContent}
          </section>
        </ThinkWrapper>
      )}
      {mainContent && (
        <div className="bubble-copy-text markdown-content prose prose-sm max-w-none leading-relaxed">
          {carouselGroups.length ? parts : renderPart(markdown)}
        </div>
      )}
      {isStreaming && !mainContent && !thinkContent && <ChatBubbleLoading />}
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

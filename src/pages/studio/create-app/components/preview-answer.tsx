import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  markdownConfig,
  useMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { convertReferencesToSup } from '@/utils/message-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

const NO_REFERENCES: ReferenceChunk[] = []

interface PreviewAnswerProps {
  content: string
  references?: ReferenceChunk[]
  isStreaming: boolean
  onViewReference: (chunk: ReferenceChunk, references: ReferenceChunk[]) => void
}

/** A preview answer with the citation markers and sources Home and Explore render. */
export const PreviewAnswer = memo(function PreviewAnswer({
  content,
  references = NO_REFERENCES,
  isStreaming,
  onViewReference,
}: PreviewAnswerProps) {
  const { t } = useTranslation()
  const hasReferences = references.length > 0

  const citationComponents = useMemo(
    () =>
      hasReferences
        ? {
            sup: createReferenceMarkerComponent(references, {
              onViewDetail: (chunk) => onViewReference(chunk, references),
              onCopy: (text) =>
                void copyToClipboardWithFeedback(
                  text,
                  t('common.copied'),
                  t('common.copyFailed'),
                ),
            }),
          }
        : undefined,
    [hasReferences, onViewReference, references, t],
  )
  const markdownComponents = useMarkdownComponents(citationComponents)

  return (
    <>
      <div className="bubble-copy-text markdown-content prose prose-sm max-w-none">
        <StreamingXMarkdown
          paragraphTag="div"
          config={markdownConfig}
          components={markdownComponents}
          content={hasReferences ? convertReferencesToSup(content) : content}
          isStreaming={isStreaming}
        />
      </div>
      {hasReferences && !isStreaming ? (
        <>
          <ReferenceImageList
            referenceChunks={references}
            messageContent={content}
            onImageClick={(chunk) => onViewReference(chunk, references)}
          />
          <ReferencePanel
            chunks={references}
            onChunkClick={(chunk) => onViewReference(chunk, references)}
            className="mt-space-xs"
          />
        </>
      ) : null}
    </>
  )
})

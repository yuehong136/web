import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  markdownConfig,
  mergeMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'
import { Sparkles } from 'lucide-react'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { RetrievalProgress } from '@/components/chat/retrieval-progress'
import { ThinkWrapper } from '@/components/chat/ThinkWrapper'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ChunkResult } from '@/types/search'
import { convertReferencesToSup } from '@/utils/message-utils'
import { extractThinkContent, type ThinkingStatus } from '@/utils/think-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

interface SearchSummaryCardProps {
  summary: string
  thinking?: string
  isStreaming: boolean
  completed?: boolean
  references: ChunkResult[]
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

const toReferenceChunk = (chunk: ChunkResult): ReferenceChunk => ({
  id: chunk.chunk_id,
  content: chunk.content_with_weight || chunk.highlight || chunk.text,
  document_id: chunk.doc_id,
  document_name: chunk.docnm_kwd,
  document_metadata: chunk.document_metadata,
  dataset_id: chunk.kb_id,
  image_id: chunk.img_id,
  doc_type: chunk.doc_type_kwd,
  positions: chunk.positions,
  similarity: chunk.similarity,
  vector_similarity: chunk.vector_similarity,
  term_similarity: chunk.term_similarity,
})

const SearchSummaryCard = ({
  summary,
  thinking = '',
  completed = false,
  isStreaming,
  references,
  onViewDetail,
}: SearchSummaryCardProps) => {
  const { t } = useTranslation()
  const referenceChunks = useMemo(
    () => references.map(toReferenceChunk),
    [references],
  )
  const parsedSummary = useMemo(() => extractThinkContent(summary), [summary])
  const thinkContent = thinking || parsedSummary.thinkContent
  const displaySummary = parsedSummary.mainContent
  const thinkingStatus: ThinkingStatus = thinkContent
    ? isStreaming && (thinking || parsedSummary.status === 'thinking')
      ? 'thinking'
      : completed
        ? 'complete'
        : 'none'
    : 'none'
  const summaryWithSup = useMemo(
    () => convertReferencesToSup(displaySummary),
    [displaySummary],
  )

  const handleViewReferenceDetail = useCallback(
    (referenceChunk: ReferenceChunk) => {
      const sourceChunk = references.find(
        (chunk) => chunk.chunk_id === referenceChunk.id,
      )
      if (!sourceChunk) return
      onViewDetail(sourceChunk, references)
    },
    [onViewDetail, references],
  )

  const SupComponent = useMemo(
    () =>
      createReferenceMarkerComponent(referenceChunks, {
        onViewDetail: handleViewReferenceDetail,
        onCopy: async (content) => {
          try {
            await copyToClipboard(content)
            toast.success(t('sources.copied'))
          } catch {
            toast.error(t('sources.copyFailed'))
          }
        },
      }),
    [handleViewReferenceDetail, referenceChunks, t],
  )
  const markdownComponents = useMemo(
    () =>
      mergeMarkdownComponents(
        referenceChunks.length > 0 ? { sup: SupComponent } : undefined,
      ),
    [referenceChunks.length, SupComponent],
  )

  if (
    !displaySummary.trim() &&
    !thinkContent &&
    parsedSummary.retrievalStatus === 'none' &&
    !isStreaming
  )
    return null

  return (
    <div
      className="min-w-0 bg-background-surface"
      aria-live="polite"
      aria-busy={isStreaming}
    >
      <div className="p-space-base">
        <div className="mb-space-sm flex items-center gap-space-xs">
          <Sparkles className="h-4 w-4 text-text-accent" />
          <span className="text-sm font-semibold text-text-accent">
            {t('searchPage.workspace.summary')}
          </span>
        </div>

        <div className="space-y-space-sm text-text-primary">
          <RetrievalProgress result={parsedSummary} isStreaming={isStreaming} />
          {thinkContent ? (
            <ThinkWrapper status={thinkingStatus} messageId="search-summary">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
                {thinkContent}
              </div>
            </ThinkWrapper>
          ) : null}

          {displaySummary ? (
            <>
              <div className="bubble-copy-text search-summary-markdown max-w-none text-sm leading-7 text-text-primary [&_h1]:mt-space-sm [&_h1]:mb-space-sm [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-text-primary [&_h2]:mt-space-sm [&_h2]:mb-space-sm [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:mt-space-sm [&_h3]:mb-space-xs [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_li]:my-space-xs [&_li]:leading-7 [&_li]:text-text-primary [&_ol]:my-space-sm [&_p]:my-space-sm [&_p]:leading-7 [&_p]:text-text-primary [&_strong]:font-semibold [&_strong]:text-text-primary [&_ul]:my-space-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <style>{`
                  .search-summary-markdown {
                    color: var(--color-text-primary) !important;
                  }
                  .search-summary-markdown a {
                    color: var(--color-components-button-primary-bg) !important;
                  }
                  .search-summary-markdown table:not(pre) {
                    border-collapse: collapse !important;
                    display: block !important;
                    width: max-content !important;
                    max-width: 100% !important;
                    overflow: auto !important;
                    border: 1px solid var(--color-border-default) !important;
                    border-radius: 8px !important;
                    margin: 8px 0 16px 0 !important;
                    background-color: var(--color-surface-primary) !important;
                  }
                  .search-summary-markdown th,
                  .search-summary-markdown td {
                    border: 1px solid var(--color-border-default) !important;
                    padding: 8px 12px !important;
                    text-align: left !important;
                    vertical-align: top !important;
                  }
                  .search-summary-markdown th {
                    color: var(--color-text-primary) !important;
                    background-color: var(--color-surface-secondary) !important;
                    font-weight: 600 !important;
                  }
                  .search-summary-markdown td {
                    color: var(--color-text-primary) !important;
                    background-color: var(--color-surface-primary) !important;
                  }
                  .search-summary-markdown code {
                    background-color: var(--color-background-subtle) !important;
                    color: var(--color-text-primary) !important;
                  }
                  .search-summary-markdown pre {
                    background-color: var(--color-components-pre-bg) !important;
                    border-color: var(--color-components-pre-border) !important;
                  }
                  .search-summary-markdown pre code {
                    color: var(--color-components-pre-text) !important;
                  }
                  .search-summary-markdown .ant-mermaid-graph {
                    height: auto !important;
                    min-height: 220px !important;
                    max-height: 70vh !important;
                  }
                  .search-summary-markdown .ant-mermaid-code {
                    height: auto !important;
                    min-height: 220px !important;
                    max-height: 70vh !important;
                  }
                `}</style>
                <StreamingXMarkdown
                  paragraphTag="div"
                  config={markdownConfig}
                  components={markdownComponents}
                  content={
                    referenceChunks.length > 0 ? summaryWithSup : displaySummary
                  }
                  isStreaming={isStreaming}
                />
              </div>
              {referenceChunks.length > 0 && !isStreaming ? (
                <>
                  <ReferenceImageList
                    referenceChunks={referenceChunks}
                    messageContent={displaySummary}
                    onImageClick={handleViewReferenceDetail}
                  />
                  <ReferencePanel
                    chunks={referenceChunks}
                    onChunkClick={handleViewReferenceDetail}
                    className="mt-space-xs"
                  />
                </>
              ) : null}
              {isStreaming ? (
                <span className="mt-1 inline-block h-4 w-1.5 animate-pulse rounded-radius-sm bg-text-accent" />
              ) : null}
            </>
          ) : !thinkContent &&
            parsedSummary.retrievalStatus === 'none' &&
            isStreaming ? (
            <div className="space-y-space-xs">
              <div className="h-4 w-full animate-pulse rounded-radius-md bg-background-subtle" />
              <div className="h-4 w-4/5 animate-pulse rounded-radius-md bg-background-subtle" />
              <div className="h-4 w-3/5 animate-pulse rounded-radius-md bg-background-subtle" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default memo(SearchSummaryCard)

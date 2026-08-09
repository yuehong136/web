import { memo, useCallback, useMemo } from 'react'
import XMarkdown from '@ant-design/x-markdown'
import {
  getMarkdownStreamingOptions,
  markdownConfig,
  mergeMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { Sparkles } from 'lucide-react'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
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
  references: ChunkResult[]
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

const toReferenceChunk = (chunk: ChunkResult): ReferenceChunk => ({
  id: chunk.chunk_id,
  content: chunk.content_with_weight || chunk.highlight || chunk.text,
  document_id: chunk.doc_id,
  document_name: chunk.docnm_kwd,
  dataset_id: chunk.kb_id,
  image_id: chunk.img_id,
  positions: chunk.positions,
  similarity: chunk.similarity,
  vector_similarity: chunk.vector_similarity,
  term_similarity: chunk.term_similarity,
})

const SearchSummaryCard = ({
  summary,
  thinking = '',
  isStreaming,
  references,
  onViewDetail,
}: SearchSummaryCardProps) => {
  const referenceChunks = useMemo(
    () => references.map(toReferenceChunk),
    [references],
  )
  const parsedSummary = useMemo(() => extractThinkContent(summary), [summary])
  const thinkContent = thinking || parsedSummary.thinkContent
  const displaySummary = thinking ? summary : parsedSummary.mainContent
  const thinkingStatus: ThinkingStatus = thinkContent
    ? isStreaming || parsedSummary.status === 'thinking'
      ? 'thinking'
      : 'complete'
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
            toast.success('已复制到剪贴板')
          } catch {
            toast.error('复制失败')
          }
        },
      }),
    [handleViewReferenceDetail, referenceChunks],
  )
  const markdownComponents = useMemo(
    () =>
      mergeMarkdownComponents(
        referenceChunks.length > 0 ? { sup: SupComponent } : undefined,
      ),
    [referenceChunks.length, SupComponent],
  )

  if (!displaySummary.trim() && !thinkContent && !isStreaming) return null

  return (
    <div className="rounded-radius-xl bg-surface-primary overflow-hidden border border-border-default">
      <div className="h-1 bg-gradient-to-r from-text-accent via-status-info to-status-success" />
      <div className="p-space-base">
        <div className="mb-space-sm gap-space-xs flex items-center">
          <Sparkles className="h-4 w-4 text-text-accent" />
          <span className="text-sm font-semibold text-text-accent">
            AI 摘要
          </span>
        </div>

        <div className="space-y-space-sm text-text-primary">
          {thinkContent ? (
            <ThinkWrapper
              status={thinkingStatus}
              messageId="search-summary"
              autoCollapseDelay={isStreaming ? 0 : 800}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {thinkContent}
              </div>
            </ThinkWrapper>
          ) : null}

          {displaySummary ? (
            <>
              <div className="bubble-copy-text search-summary-markdown [&_h1]:mb-space-sm [&_h1]:mt-space-sm [&_h2]:mb-space-sm [&_h2]:mt-space-sm [&_h3]:mb-space-xs [&_h3]:mt-space-sm [&_li]:my-space-xs [&_ol]:my-space-sm [&_p]:my-space-sm [&_ul]:my-space-sm max-w-none text-sm leading-7 text-text-primary [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-text-primary [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_li]:leading-7 [&_li]:text-text-primary [&_p]:leading-7 [&_p]:text-text-primary [&_strong]:font-semibold [&_strong]:text-text-primary">
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
                <XMarkdown
                  paragraphTag="div"
                  config={markdownConfig}
                  components={markdownComponents}
                  streaming={getMarkdownStreamingOptions(isStreaming)}
                >
                  {referenceChunks.length > 0 ? summaryWithSup : displaySummary}
                </XMarkdown>
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
                <span className="rounded-radius-sm mt-1 inline-block h-4 w-1.5 animate-pulse bg-text-accent" />
              ) : null}
            </>
          ) : !thinkContent && isStreaming ? (
            <div className="space-y-space-xs">
              <div className="rounded-radius-md h-4 w-full animate-pulse bg-background-subtle" />
              <div className="rounded-radius-md h-4 w-4/5 animate-pulse bg-background-subtle" />
              <div className="rounded-radius-md h-4 w-3/5 animate-pulse bg-background-subtle" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default memo(SearchSummaryCard)

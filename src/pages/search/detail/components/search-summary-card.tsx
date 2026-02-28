import React, { memo, useCallback, useMemo } from 'react'
import XMarkdown from '@ant-design/x-markdown'
import { markdownConfig, markdownStreamingComponents } from '@/components/chat/MarkdownCodeBlock'
import { Sparkles } from 'lucide-react'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ChunkResult } from '@/types/search'
import { convertReferencesToSup } from '@/utils/message-utils'
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

const SearchSummaryCard: React.FC<SearchSummaryCardProps> = ({
  summary,
  thinking = '',
  isStreaming,
  references,
  onViewDetail,
}) => {
  const referenceChunks = useMemo(() => references.map(toReferenceChunk), [references])
  const summaryWithSup = useMemo(() => convertReferencesToSup(summary), [summary])

  const handleViewReferenceDetail = useCallback(
    (referenceChunk: ReferenceChunk) => {
      const sourceChunk = references.find((chunk) => chunk.chunk_id === referenceChunk.id)
      if (!sourceChunk) return
      onViewDetail(sourceChunk, references)
    },
    [onViewDetail, references]
  )

  const SupComponent = useMemo(
    () =>
      createReferenceMarkerComponent(referenceChunks, {
        onViewDetail: handleViewReferenceDetail,
        onCopy: (content) => {
          copyToClipboard(content)
          toast.success('已复制到剪贴板')
        },
      }),
    [handleViewReferenceDetail, referenceChunks]
  )

  if (!summary && !isStreaming) return null

  return (
    <div className="overflow-hidden rounded-radius-xl border border-border-default bg-surface-primary">
      <div className="h-1 bg-gradient-to-r from-text-accent via-state-info to-state-success" />
      <div className="p-space-base">
        <div className="mb-space-sm flex items-center gap-space-xs">
          <Sparkles className="h-4 w-4 text-text-accent" />
          <span className="text-sm font-semibold text-text-accent">AI 摘要</span>
        </div>

        {summary ? (
          <div className="space-y-space-sm text-text-primary">
            <div className="bubble-copy-text search-summary-markdown max-w-none text-sm leading-7 text-text-primary [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:mb-space-sm [&_h1]:mt-space-sm [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-text-primary [&_h2]:mb-space-sm [&_h2]:mt-space-sm [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:mb-space-xs [&_h3]:mt-space-sm [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_li]:my-space-xs [&_li]:leading-7 [&_li]:text-text-primary [&_ol]:my-space-sm [&_p]:my-space-sm [&_p]:leading-7 [&_p]:text-text-primary [&_strong]:font-semibold [&_strong]:text-text-primary [&_ul]:my-space-sm">
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
                components={{ ...markdownStreamingComponents, ...(referenceChunks.length > 0 ? { sup: SupComponent } : {}) }}
                streaming={isStreaming ? { hasNextChunk: true, enableAnimation: true } : undefined}
              >
                {referenceChunks.length > 0 ? summaryWithSup : summary}
              </XMarkdown>
            </div>
            {referenceChunks.length > 0 && !isStreaming ? (
              <>
                <ReferenceImageList
                  referenceChunks={referenceChunks}
                  messageContent={summary}
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
              <span className="inline-block mt-1 h-4 w-1.5 rounded-radius-sm bg-text-accent animate-pulse" />
            ) : null}
          </div>
        ) : isStreaming && thinking ? (
          <div className="rounded-radius-lg border border-border-default bg-surface-secondary px-space-sm py-space-sm">
            <p className="text-xs text-text-tertiary mb-space-xs">思考中</p>
            <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{thinking}</p>
          </div>
        ) : (
          <div className="space-y-space-xs">
            <div className="h-4 rounded-radius-md bg-background-subtle animate-pulse w-full" />
            <div className="h-4 rounded-radius-md bg-background-subtle animate-pulse w-4/5" />
            <div className="h-4 rounded-radius-md bg-background-subtle animate-pulse w-3/5" />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(SearchSummaryCard)

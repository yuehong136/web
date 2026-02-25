import React, { memo, useCallback, useMemo } from 'react'
import XMarkdown from '@ant-design/x-markdown'
import { markdownCodeComponents, markdownConfig } from '@/components/chat/MarkdownCodeBlock'
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
    <div className="rounded-radius-xl border border-border-default bg-surface-primary overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-text-accent via-state-info to-state-success" />
      <div className="p-space-base">
        <div className="flex items-center gap-2 mb-space-sm">
          <Sparkles className="h-4 w-4 text-text-accent" />
          <span className="text-sm font-medium text-text-accent">AI 摘要</span>
        </div>

        {summary ? (
          <div className="space-y-space-sm text-text-primary">
            <div className="prose prose-sm max-w-none bubble-copy-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <XMarkdown
                paragraphTag="div"
                config={markdownConfig}
                components={{ ...markdownCodeComponents, ...(referenceChunks.length > 0 ? { sup: SupComponent } : {}) }}
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
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-6">{thinking}</p>
          </div>
        ) : (
          <div className="space-y-2">
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

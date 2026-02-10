import React, { memo, useMemo } from 'react'
import { SearchExecutionPhase, type ChunkResult, type SearchTurn } from '@/types/search'
import SearchChunkList from './search-chunk-list'
import SearchDocFilterRail from './search-doc-filter-rail'
import SearchRelatedQuestions from './search-related-questions'
import SearchSummaryCard from './search-summary-card'

interface SearchTurnItemProps {
  index: number
  turn: SearchTurn
  selectedDocIds: string[]
  onDocFilterChange: (turnId: string, docIds: string[]) => void
  onAskRelated: (question: string) => void
  onViewChunkDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

const SearchTurnItem: React.FC<SearchTurnItemProps> = ({
  index,
  turn,
  selectedDocIds,
  onDocFilterChange,
  onAskRelated,
  onViewChunkDetail,
}) => {
  const filteredChunks = useMemo(() => {
    if (!selectedDocIds.length) return turn.chunks
    return turn.chunks.filter((chunk) => selectedDocIds.includes(chunk.doc_id))
  }, [selectedDocIds, turn.chunks])

  return (
    <section className="rounded-radius-xl border border-border-default bg-surface-primary p-space-base space-y-space-sm">
      <div className="flex items-start justify-between gap-space-sm">
        <div>
          <p className="text-xs text-text-tertiary">第 {index + 1} 轮查询</p>
          <h3 className="text-base font-semibold text-text-primary mt-1">{turn.query}</h3>
        </div>
        <span className="text-xs text-text-tertiary">
          {turn.phase === SearchExecutionPhase.ERROR
            ? '执行失败'
            : turn.phase === SearchExecutionPhase.COMPLETE
              ? '完成'
              : '进行中'}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-space-sm">
        <div className="space-y-space-sm min-w-0">
          <SearchSummaryCard summary={turn.summary} isStreaming={turn.isStreaming} />
          <SearchChunkList
            chunks={filteredChunks}
            total={turn.total}
            isLoading={turn.phase === SearchExecutionPhase.RETRIEVING && filteredChunks.length === 0}
            onViewDetail={onViewChunkDetail}
          />
          {!turn.isStreaming ? (
            <SearchRelatedQuestions questions={turn.relatedQuestions} onSelect={onAskRelated} />
          ) : null}
          {turn.errorMessage ? (
            <div className="rounded-radius-md border border-state-error/30 bg-state-error/10 px-3 py-2 text-sm text-state-error">
              {turn.errorMessage}
            </div>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-0 h-fit">
          <SearchDocFilterRail
            docAggs={turn.docAggs}
            selectedDocIds={selectedDocIds}
            onSelectionChange={(docIds) => onDocFilterChange(turn.id, docIds)}
          />
        </div>
      </div>
    </section>
  )
}

export default memo(SearchTurnItem)

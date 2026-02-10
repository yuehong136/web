import React, { memo, useMemo } from 'react'
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { SearchExecutionPhase, type ChunkResult, type SearchTurn } from '@/types/search'
import { cn } from '@/lib/utils'
import SearchChunkList from './search-chunk-list'
import SearchDocFilterRail from './search-doc-filter-rail'
import SearchRelatedQuestions from './search-related-questions'
import SearchSummaryCard from './search-summary-card'

interface SearchTurnItemProps {
  index: number
  isLatest: boolean
  expanded: boolean
  turn: SearchTurn
  selectedDocIds: string[]
  onToggleExpand: () => void
  onDocFilterChange: (turnId: string, docIds: string[]) => void
  onAskRelated: (question: string) => void
  onViewChunkDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

const SearchTurnItem: React.FC<SearchTurnItemProps> = ({
  index,
  isLatest,
  expanded,
  turn,
  selectedDocIds,
  onToggleExpand,
  onDocFilterChange,
  onAskRelated,
  onViewChunkDetail,
}) => {
  const filteredChunks = useMemo(() => {
    if (!selectedDocIds.length) return turn.chunks
    return turn.chunks.filter((chunk) => selectedDocIds.includes(chunk.doc_id))
  }, [selectedDocIds, turn.chunks])

  const statusLabel =
    turn.phase === SearchExecutionPhase.ERROR
      ? '执行失败'
      : turn.phase === SearchExecutionPhase.COMPLETE
        ? '完成'
        : '进行中'

  const statusClassName =
    turn.phase === SearchExecutionPhase.ERROR
      ? 'bg-state-error/10 text-state-error border-state-error/30'
      : turn.phase === SearchExecutionPhase.COMPLETE
        ? 'bg-state-success/10 text-state-success border-state-success/30'
        : 'bg-state-info/10 text-state-info border-state-info/30'

  const summaryPreview = useMemo(() => {
    const plainSummary = (turn.summary || turn.thinking || '').replace(/\s+/g, ' ').trim()
    if (!plainSummary) return '已收起本轮查询，点击上方问题可展开查看完整内容。'
    return plainSummary.length > 120 ? `${plainSummary.slice(0, 120)}...` : plainSummary
  }, [turn.summary, turn.thinking])

  return (
    <section className="rounded-radius-xl border border-border-default bg-surface-primary p-space-base space-y-space-sm">
      <div className="space-y-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <span className="inline-flex items-center rounded-radius-full border border-border-default bg-surface-secondary px-space-sm py-space-xs text-sm font-semibold text-text-secondary shadow-elevation-low">
              第 {index + 1} 轮查询
            </span>
            <span className="hidden md:inline text-xs text-text-tertiary truncate">
              命中 {turn.total} 条 · 来源 {turn.docAggs.length} 篇
            </span>
            {isLatest ? (
              <span className="hidden md:inline text-xs text-text-accent">当前轮次</span>
            ) : null}
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-accent transition-colors"
              aria-expanded={expanded}
              title={expanded ? '收起本轮' : '展开本轮'}
            >
              {expanded ? '收起' : '展开'}
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <span className={cn('text-xs px-space-xs py-space-xs rounded-radius-full border font-medium', statusClassName)}>
              {statusLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="w-full rounded-radius-xl border border-border-accent bg-surface-accent-subtle px-space-md py-space-sm shadow-elevation-medium text-left transition-colors hover:bg-[var(--color-state-focus-10)]"
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-space-sm">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-radius-full border border-border-accent bg-surface-primary text-text-accent shadow-elevation-low">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-text-tertiary">用户提问</p>
              <h3 className="mt-space-xs text-xl font-semibold leading-tight text-text-primary break-words">{turn.query}</h3>
            </div>
          </div>
        </button>

        {!expanded ? (
          <div className="rounded-radius-lg border border-border-default bg-surface-secondary px-space-sm py-space-xs text-sm text-text-secondary leading-relaxed">
            {summaryPreview}
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="space-y-space-sm min-w-0">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-space-sm items-start">
            <SearchSummaryCard
              summary={turn.summary}
              thinking={turn.thinking}
              isStreaming={turn.isStreaming}
              references={turn.chunks}
              onViewDetail={onViewChunkDetail}
            />
            <SearchDocFilterRail
              docAggs={turn.docAggs}
              selectedDocIds={selectedDocIds}
              onSelectionChange={(docIds) => onDocFilterChange(turn.id, docIds)}
            />
          </div>

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
      ) : null}
    </section>
  )
}

export default memo(SearchTurnItem)

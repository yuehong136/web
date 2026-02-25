import React, { memo, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, User } from 'lucide-react'
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
  const [showChunks, setShowChunks] = useState(() => !turn.summaryEnabled)
  const filteredChunks = useMemo(() => {
    if (!selectedDocIds.length) return turn.chunks
    return turn.chunks.filter((chunk) => selectedDocIds.includes(chunk.doc_id))
  }, [selectedDocIds, turn.chunks])

  const statusLabel =
    turn.phase === SearchExecutionPhase.ERROR
      ? '失败'
      : turn.phase === SearchExecutionPhase.COMPLETE
        ? '完成'
        : '进行中'

  const statusClassName =
    turn.phase === SearchExecutionPhase.ERROR
      ? 'bg-state-error/10 text-state-error'
      : turn.phase === SearchExecutionPhase.COMPLETE
        ? 'bg-state-success/10 text-state-success'
        : 'bg-state-info/10 text-state-info'

  const summaryPreview = useMemo(() => {
    const plainSummary = (turn.summary || turn.thinking || '').replace(/\s+/g, ' ').trim()
    if (!plainSummary) return '已收起本轮查询，点击上方问题可展开查看完整内容。'
    return plainSummary.length > 180 ? `${plainSummary.slice(0, 180)}...` : plainSummary
  }, [turn.summary, turn.thinking])

  const executionSnapshot = useMemo(
    () => [
      { key: 'summary', label: 'AI总结', enabled: turn.summaryEnabled },
      { key: 'related', label: '相关问题', enabled: turn.relatedEnabled },
      { key: 'mindmap', label: '思维导图', enabled: turn.mindmapEnabled },
      { key: 'rerank', label: turn.rerankModelName ? `Rerank(${turn.rerankModelName})` : 'Rerank', enabled: turn.rerankEnabled },
    ],
    [turn.mindmapEnabled, turn.relatedEnabled, turn.rerankEnabled, turn.rerankModelName, turn.summaryEnabled]
  )
  const enabledExecutionLabels = useMemo(
    () => executionSnapshot.filter((item) => item.enabled).map((item) => item.label),
    [executionSnapshot]
  )

  const progressSummary = useMemo(() => {
    const retrievedText = `检索 ${turn.total} 条`
    const rerankText = turn.rerankEnabled ? '已重排' : '未重排'
    const generatedText = turn.summaryEnabled ? '已生成摘要' : '未生成摘要'
    return `${retrievedText} · ${rerankText} · ${generatedText}`
  }, [turn.rerankEnabled, turn.summaryEnabled, turn.total])

  const phasePill = useMemo(() => {
    if (turn.phase === SearchExecutionPhase.ERROR) {
      return {
        label: '执行失败',
        className: 'border-state-error/30 bg-state-error/10 text-state-error',
      }
    }
    if (turn.phase === SearchExecutionPhase.RETRIEVING) {
      return {
        label: '检索中',
        className: 'border-state-info/30 bg-state-info/10 text-state-info',
      }
    }
    if (turn.phase === SearchExecutionPhase.SUMMARIZING) {
      return {
        label: '生成摘要中',
        className: 'border-state-info/30 bg-state-info/10 text-state-info',
      }
    }
    if (turn.phase === SearchExecutionPhase.RELATED) {
      return {
        label: '生成相关问题',
        className: 'border-state-info/30 bg-state-info/10 text-state-info',
      }
    }
    return {
      label: '已完成',
      className: 'border-state-success/30 bg-state-success/10 text-state-success',
    }
  }, [turn.phase])

  return (
    <section className="rounded-radius-xl border border-border-default bg-surface-primary overflow-hidden">
      {isLatest ? (
        <div className="h-0.5 bg-gradient-to-r from-text-accent via-state-info to-state-success" />
      ) : null}
      <div className="p-space-base space-y-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <span
              className={cn(
                'inline-flex items-center rounded-radius-full border px-space-sm py-space-xs text-xs font-semibold',
                isLatest
                  ? 'border-border-accent bg-surface-accent-subtle text-text-accent'
                  : 'border-border-default bg-surface-secondary text-text-secondary'
              )}
            >
              Round {index + 1}
              {isLatest ? ' · Current' : ''}
            </span>
            <span className="hidden md:inline text-xs text-text-tertiary truncate">
              命中 {turn.total} 条 · 来源 {turn.docAggs.length} 篇
            </span>
          </div>

          <div className="flex items-center gap-space-sm shrink-0">
            {expanded && enabledExecutionLabels.length ? (
              <div className="hidden xl:flex items-center gap-space-sm">
                {enabledExecutionLabels.map((label) => (
                  <span key={label} className="text-xs font-medium text-text-secondary">
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
            <span
              className={cn(
                'inline-flex items-center gap-space-xs rounded-radius-full px-space-sm py-space-xs text-xs font-medium',
                statusClassName
              )}
            >
              <span className="h-1.5 w-1.5 rounded-radius-full bg-current" />
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center justify-center rounded-radius-sm text-text-tertiary hover:text-text-primary"
              aria-expanded={expanded}
              title={expanded ? '收起本轮' : '展开本轮'}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className={cn(
            'w-full rounded-radius-lg border text-left transition-colors',
            expanded
              ? 'border-border-default bg-surface-primary px-space-md py-space-sm'
              : 'border-border-default bg-surface-secondary px-space-md py-space-sm hover:bg-surface-primary'
          )}
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-space-sm">
            {expanded ? (
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-radius-full bg-surface-accent-subtle text-text-accent">
                <User className="h-4 w-4" />
              </span>
            ) : (
              <User className="h-4 w-4 mt-0.5 text-text-tertiary shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-text-tertiary">用户提问</p>
              <h3
                className={cn(
                  'mt-space-xs text-text-primary break-words',
                  expanded ? 'text-xl font-semibold leading-snug' : 'text-lg font-medium leading-snug'
                )}
              >
                {turn.query}
              </h3>
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
        <div className="space-y-space-sm min-w-0 px-space-base pb-space-base">

          {turn.summaryEnabled ? (
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
          ) : (
            <SearchDocFilterRail
              docAggs={turn.docAggs}
              selectedDocIds={selectedDocIds}
              onSelectionChange={(docIds) => onDocFilterChange(turn.id, docIds)}
            />
          )}

          <button
            type="button"
            onClick={() => setShowChunks((prev) => !prev)}
            className="w-full rounded-radius-lg border border-border-default bg-surface-secondary px-space-sm py-space-xs text-left"
            aria-expanded={showChunks}
          >
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs min-w-0">
                {showChunks ? (
                  <ChevronDown className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                )}
                <span className="text-xs font-medium text-text-secondary">{showChunks ? '收起检索片段' : '查看检索片段'}</span>
                <span className="text-xs text-text-tertiary">({filteredChunks.length} 条)</span>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-radius-full border px-space-sm py-space-xs text-xs font-medium',
                  phasePill.className
                )}
              >
                {phasePill.label}
              </span>
            </div>
            <p className="mt-space-xs truncate text-xs text-text-tertiary">{progressSummary}</p>
          </button>

          {showChunks ? (
            <SearchChunkList
              chunks={filteredChunks}
              total={turn.total}
              isLoading={turn.phase === SearchExecutionPhase.RETRIEVING && filteredChunks.length === 0}
              onViewDetail={onViewChunkDetail}
            />
          ) : null}

          {turn.relatedEnabled && !turn.isStreaming ? (
            <SearchRelatedQuestions questions={turn.relatedQuestions} onSelect={onAskRelated} />
          ) : null}
          {turn.errorMessage ? (
            <div className="rounded-radius-md border border-state-error/30 bg-state-error/10 px-space-sm py-space-xs text-sm text-state-error">
              {turn.errorMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default memo(SearchTurnItem)

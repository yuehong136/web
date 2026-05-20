import React, { memo, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, User } from 'lucide-react'
import {
  SearchExecutionPhase,
  type ChunkResult,
  type SearchTurn,
} from '@/types/search'
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
      ? 'bg-status-error/10 text-status-error'
      : turn.phase === SearchExecutionPhase.COMPLETE
        ? 'bg-status-success/10 text-status-success'
        : 'bg-status-info/10 text-status-info'

  const summaryPreview = useMemo(() => {
    const plainSummary = (turn.summary || turn.thinking || '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!plainSummary) return '已收起本轮查询，点击上方问题可展开查看完整内容。'
    return plainSummary.length > 180
      ? `${plainSummary.slice(0, 180)}...`
      : plainSummary
  }, [turn.summary, turn.thinking])

  const executionSnapshot = useMemo(
    () => [
      { key: 'summary', label: 'AI总结', enabled: turn.summaryEnabled },
      { key: 'related', label: '相关问题', enabled: turn.relatedEnabled },
      { key: 'mindmap', label: '思维导图', enabled: turn.mindmapEnabled },
      {
        key: 'rerank',
        label: turn.rerankModelName
          ? `Rerank(${turn.rerankModelName})`
          : 'Rerank',
        enabled: turn.rerankEnabled,
      },
    ],
    [
      turn.mindmapEnabled,
      turn.relatedEnabled,
      turn.rerankEnabled,
      turn.rerankModelName,
      turn.summaryEnabled,
    ],
  )
  const enabledExecutionLabels = useMemo(
    () =>
      executionSnapshot
        .filter((item) => item.enabled)
        .map((item) => item.label),
    [executionSnapshot],
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
        className:
          'border-status-error/30 bg-status-error/10 text-status-error',
      }
    }
    if (turn.phase === SearchExecutionPhase.RETRIEVING) {
      return {
        label: '检索中',
        className: 'border-status-info/30 bg-status-info/10 text-status-info',
      }
    }
    if (turn.phase === SearchExecutionPhase.SUMMARIZING) {
      return {
        label: '生成摘要中',
        className: 'border-status-info/30 bg-status-info/10 text-status-info',
      }
    }
    if (turn.phase === SearchExecutionPhase.RELATED) {
      return {
        label: '生成相关问题',
        className: 'border-status-info/30 bg-status-info/10 text-status-info',
      }
    }
    return {
      label: '已完成',
      className:
        'border-status-success/30 bg-status-success/10 text-status-success',
    }
  }, [turn.phase])

  return (
    <section className="rounded-radius-xl bg-surface-primary overflow-hidden border border-border-default">
      {isLatest ? (
        <div className="h-0.5 bg-gradient-to-r from-text-accent via-state-info to-state-success" />
      ) : null}
      <div className="p-space-base space-y-space-sm">
        <div className="gap-space-sm flex items-center justify-between">
          <div className="gap-space-sm flex min-w-0 items-center">
            <span
              className={cn(
                'rounded-radius-full px-space-sm py-space-xs inline-flex items-center border text-xs font-semibold',
                isLatest
                  ? 'bg-surface-accent-subtle border-border-accent text-text-accent'
                  : 'bg-surface-secondary border-border-default text-text-secondary',
              )}
            >
              Round {index + 1}
              {isLatest ? ' · Current' : ''}
            </span>
            <span className="hidden truncate text-xs text-text-tertiary md:inline">
              命中 {turn.total} 条 · 来源 {turn.docAggs.length} 篇
            </span>
          </div>

          <div className="gap-space-sm flex shrink-0 items-center">
            {expanded && enabledExecutionLabels.length ? (
              <div className="gap-space-sm hidden items-center xl:flex">
                {enabledExecutionLabels.map((label) => (
                  <span
                    key={label}
                    className="text-xs font-medium text-text-secondary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
            <span
              className={cn(
                'gap-space-xs rounded-radius-full px-space-sm py-space-xs inline-flex items-center text-xs font-medium',
                statusClassName,
              )}
            >
              <span className="rounded-radius-full h-1.5 w-1.5 bg-current" />
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={onToggleExpand}
              className="rounded-radius-sm inline-flex items-center justify-center text-text-tertiary hover:text-text-primary"
              aria-expanded={expanded}
              title={expanded ? '收起本轮' : '展开本轮'}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className={cn(
            'rounded-radius-lg w-full border text-left transition-colors',
            expanded
              ? 'bg-surface-primary px-space-md py-space-sm border-border-default'
              : 'bg-surface-secondary px-space-md py-space-sm hover:bg-surface-primary border-border-default',
          )}
          aria-expanded={expanded}
        >
          <div className="gap-space-sm flex items-start">
            {expanded ? (
              <span className="rounded-radius-full bg-surface-accent-subtle inline-flex h-7 min-w-7 items-center justify-center text-text-accent">
                <User className="h-4 w-4" />
              </span>
            ) : (
              <User className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-text-tertiary">用户提问</p>
              <h3
                className={cn(
                  'mt-space-xs break-words text-text-primary',
                  expanded
                    ? 'text-xl font-semibold leading-snug'
                    : 'text-lg font-medium leading-snug',
                )}
              >
                {turn.query}
              </h3>
            </div>
          </div>
        </button>

        {!expanded ? (
          <div className="rounded-radius-lg bg-surface-secondary px-space-sm py-space-xs border border-border-default text-sm leading-relaxed text-text-secondary">
            {summaryPreview}
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="space-y-space-sm px-space-base pb-space-base min-w-0">
          {turn.summaryEnabled ? (
            <div className="gap-space-sm grid grid-cols-1 items-start xl:grid-cols-[1fr_280px]">
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
                onSelectionChange={(docIds) =>
                  onDocFilterChange(turn.id, docIds)
                }
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
            className="rounded-radius-lg bg-surface-secondary px-space-sm py-space-xs w-full border border-border-default text-left"
            aria-expanded={showChunks}
          >
            <div className="gap-space-sm flex items-center justify-between">
              <div className="gap-space-xs flex min-w-0 items-center">
                {showChunks ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                )}
                <span className="text-xs font-medium text-text-secondary">
                  {showChunks ? '收起检索片段' : '查看检索片段'}
                </span>
                <span className="text-xs text-text-tertiary">
                  ({filteredChunks.length} 条)
                </span>
              </div>
              <span
                className={cn(
                  'rounded-radius-full px-space-sm py-space-xs inline-flex items-center border text-xs font-medium',
                  phasePill.className,
                )}
              >
                {phasePill.label}
              </span>
            </div>
            <p className="mt-space-xs truncate text-xs text-text-tertiary">
              {progressSummary}
            </p>
          </button>

          {showChunks ? (
            <SearchChunkList
              chunks={filteredChunks}
              total={turn.total}
              isLoading={
                turn.phase === SearchExecutionPhase.RETRIEVING &&
                filteredChunks.length === 0
              }
              onViewDetail={onViewChunkDetail}
            />
          ) : null}

          {turn.relatedEnabled && !turn.isStreaming ? (
            <SearchRelatedQuestions
              questions={turn.relatedQuestions}
              onSelect={onAskRelated}
            />
          ) : null}
          {turn.errorMessage ? (
            <div className="rounded-radius-md border-status-error/30 bg-status-error/10 px-space-sm py-space-xs border text-sm text-status-error">
              {turn.errorMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default memo(SearchTurnItem)

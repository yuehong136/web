import { memo, useId, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  SearchExecutionPhase,
  type ChunkResult,
  type DocAgg,
  type SearchTurn,
} from '@/types/search'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  selectedDocIds: string[] | null
  onToggleExpand: () => void
  onDocFilterChange: (turnId: string, docIds: string[] | null) => void
  onAskRelated: (question: string) => void
  onViewChunkDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
  resultSize?: number
  isRefining?: boolean
  refinementError?: boolean
  onResultSizeChange?: (size: number) => void
  onRetryResults?: () => void
  sourceOptions?: DocAgg[]
}

function SearchTurnItem({
  index,
  isLatest,
  expanded,
  turn,
  selectedDocIds,
  onToggleExpand,
  onDocFilterChange,
  onAskRelated,
  onViewChunkDetail,
  resultSize = 10,
  isRefining = false,
  refinementError = false,
  onResultSizeChange,
  onRetryResults,
  sourceOptions,
}: SearchTurnItemProps) {
  const { t } = useTranslation()
  const bodyId = useId()
  const [showChunks, setShowChunks] = useState(() => !turn.summaryEnabled)
  const filteredChunks = useMemo(
    () =>
      selectedDocIds !== null
        ? turn.chunks.filter((chunk) => selectedDocIds.includes(chunk.doc_id))
        : turn.chunks,
    [selectedDocIds, turn.chunks],
  )
  const interrupted = turn.errorMessageKey === 'chat.stream.interrupted'
  const phaseKey = interrupted ? 'interrupted' : turn.phase
  const statusClass =
    turn.phase === SearchExecutionPhase.COMPLETE
      ? 'text-status-success'
      : turn.phase === SearchExecutionPhase.ERROR
        ? 'text-status-error'
        : turn.phase === SearchExecutionPhase.STOPPED
          ? 'text-text-secondary'
          : 'text-status-info'
  return (
    <section
      className="min-w-0 border-b border-border-subtle pb-space-lg"
      aria-busy={turn.isStreaming || isRefining}
    >
      <div className="mb-space-base flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-space-sm text-xs text-text-secondary">
          <span className={cn('font-medium', isLatest && 'text-text-primary')}>
            {t('searchPage.workspace.round', { index: index + 1 })}
          </span>
          {isLatest && (
            <span className="rounded-radius-full bg-state-selected-bg px-space-sm py-space-xs text-state-selected-text">
              {t('searchPage.workspace.current')}
            </span>
          )}
          <span>
            {t('searchPage.workspace.candidateMatches', {
              count: turn.total,
              documents: turn.docAggs.length,
            })}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <span role="status" className={cn('text-xs', statusClass)}>
            {t(`searchPage.workspace.phases.${phaseKey}`)}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-controls={bodyId}
            aria-label={t(
              expanded
                ? 'searchPage.workspace.collapseRound'
                : 'searchPage.workspace.expandRound',
            )}
          >
            {expanded ? (
              <ChevronDown className="size-icon-sm" />
            ) : (
              <ChevronRight className="size-icon-sm" />
            )}
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="w-full rounded-radius-md py-space-sm text-left outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus"
      >
        <span className="block text-xs text-text-secondary">
          {t('searchPage.workspace.question')}
        </span>
        <h3 className="mt-space-xs text-xl leading-snug font-semibold break-words text-text-primary">
          {turn.query}
        </h3>
      </button>
      {!expanded && (
        <p className="mt-space-sm line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {turn.summary || t('searchPage.workspace.collapsed')}
        </p>
      )}
      <div
        id={bodyId}
        hidden={!expanded}
        className="mt-space-md min-w-0 space-y-space-lg"
      >
        {expanded && (
          <>
            {turn.summaryEnabled ? (
              <div className="grid min-w-0 grid-cols-1 items-start gap-space-lg xl:grid-cols-[minmax(0,1fr)_16rem]">
                <SearchSummaryCard
                  summary={turn.summary}
                  thinking={turn.thinking}
                  isStreaming={turn.isStreaming}
                  completed={turn.phase === SearchExecutionPhase.COMPLETE}
                  references={turn.chunks}
                  onViewDetail={onViewChunkDetail}
                />
                <SearchDocFilterRail
                  disabled={turn.isStreaming}
                  docAggs={sourceOptions ?? turn.docAggs}
                  selectedDocIds={selectedDocIds}
                  onSelectionChange={(ids) => onDocFilterChange(turn.id, ids)}
                />
              </div>
            ) : (
              <SearchDocFilterRail
                disabled={turn.isStreaming}
                docAggs={sourceOptions ?? turn.docAggs}
                selectedDocIds={selectedDocIds}
                onSelectionChange={(ids) => onDocFilterChange(turn.id, ids)}
              />
            )}
            <div>
              {onResultSizeChange && (
                <div className="mb-space-sm flex items-center gap-space-sm">
                  <span className="text-sm text-text-secondary">
                    {t('searchPage.workspace.topResults')}
                  </span>
                  <Select
                    value={String(resultSize)}
                    onValueChange={(value) => onResultSizeChange(Number(value))}
                    disabled={turn.isStreaming}
                  >
                    <SelectTrigger
                      aria-label={t('searchPage.workspace.topResults')}
                      className="w-24"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {refinementError && (
                <p
                  role="status"
                  className="mb-space-sm text-sm text-status-error"
                >
                  {t('searchPage.workspace.failed')}{' '}
                  <Button variant="outline" size="sm" onClick={onRetryResults}>
                    {t('common.retry')}
                  </Button>
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChunks((value) => !value)}
                aria-expanded={showChunks}
              >
                {showChunks ? (
                  <ChevronDown className="size-icon-sm" />
                ) : (
                  <ChevronRight className="size-icon-sm" />
                )}
                {t(
                  showChunks
                    ? 'searchPage.workspace.hideChunks'
                    : 'searchPage.workspace.showChunks',
                )}
                <span className="text-text-secondary">
                  {t('searchPage.workspace.count', {
                    count: filteredChunks.length,
                  })}
                </span>
              </Button>
              {showChunks && (
                <SearchChunkList
                  chunks={filteredChunks}
                  isLoading={
                    (isRefining ||
                      turn.phase === SearchExecutionPhase.RETRIEVING) &&
                    filteredChunks.length === 0
                  }
                  onViewDetail={onViewChunkDetail}
                />
              )}
            </div>
            {turn.relatedEnabled && !turn.isStreaming && (
              <SearchRelatedQuestions
                questions={turn.relatedQuestions}
                onSelect={onAskRelated}
              />
            )}
            {(turn.errorMessageKey || turn.errorMessage) && (
              <p
                role="status"
                className="rounded-radius-md border border-status-warning-subtle bg-status-warning-subtle p-space-base text-sm text-text-primary"
              >
                {turn.errorMessageKey
                  ? t(turn.errorMessageKey)
                  : t('searchPage.workspace.failed')}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default memo(SearchTurnItem)

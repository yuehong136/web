import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Search, Star } from 'lucide-react'

import { HighlightText } from '@/components/knowledge/HighlightText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileIcon } from '@/components/ui/file-icon'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { Tooltip } from '@/components/ui/tooltip'

import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { DocFilterPanel } from './doc-filter-panel'
import { SearchScopeSummary } from './search-scope-summary'
import type { SearchError } from './hooks/use-search-execution'

import { PAGE_SIZE_OPTIONS } from './constants'
import type {
  RetrievalDocAgg,
  RetrievalResultView,
  SearchRequestScope,
} from './types'

interface ResultPanelProps {
  hasSearched: boolean
  searchError?: SearchError
  requestScope?: SearchRequestScope
  docOptions: RetrievalDocAgg[]
  onRetry: () => void
  onOpenConfig: () => void
  isSearching: boolean
  results: RetrievalResultView[]
  totalResults: number
  docAggs: RetrievalDocAgg[]
  selectedDocIds: string[]
  showDocFilter: boolean
  highlight: boolean
  currentPage: number
  pageSize: number
  totalPages: number
  pageNumbers: number[]
  onToggleDocFilter: () => void
  onDocFilter: (docId: string, checked: boolean) => void
  onClearDocFilter: () => void
  onSelectAllDocs: () => void
  onOpenResultPreview: (result: RetrievalResultView) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`

export const ResultPanel: React.FC<ResultPanelProps> = ({
  hasSearched,
  searchError,
  requestScope,
  docOptions,
  onRetry,
  onOpenConfig,
  isSearching,
  results,
  totalResults,
  docAggs,
  selectedDocIds,
  showDocFilter,
  highlight,
  currentPage,
  pageSize,
  totalPages,
  pageNumbers,
  onToggleDocFilter,
  onDocFilter,
  onClearDocFilter,
  onSelectAllDocs,
  onOpenResultPreview,
  onPageChange,
  onPageSizeChange,
}) => {
  const { t } = useTranslation()

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden p-space-lg">
      <div className="scrollbar-thin max-h-1/2 shrink-0 overflow-y-auto pb-space-base">
        <div className="flex flex-wrap items-start justify-between gap-space-base">
          <div className="min-w-0">
            <div className="flex items-center gap-space-sm">
              <FileText className="h-5 w-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">
                {t('knowledge.search.resultsTitle')}
              </h2>
            </div>
            <div className="mt-space-xs flex flex-wrap items-center gap-space-sm text-sm text-text-secondary">
              <span>
                {isSearching
                  ? t('knowledge.search.searching')
                  : searchError
                    ? t('knowledge.search.errors.title')
                    : !hasSearched
                      ? t('knowledge.search.startTitle')
                      : t('knowledge.search.foundResults', {
                          count: totalResults,
                        })}
              </span>
              {!searchError && selectedDocIds.length > 0 && (
                <Badge variant="blue" className="text-xs">
                  {t('knowledge.search.filteredDocs', {
                    count: selectedDocIds.length,
                  })}
                </Badge>
              )}
              {docAggs.length > 0 && (
                <>
                  <span className="text-text-tertiary">
                    {t('knowledge.search.source')}
                  </span>
                  {docAggs.slice(0, 3).map((doc) => (
                    <Tooltip
                      key={doc.doc_id}
                      content={`${doc.doc_name}: ${t('knowledge.search.chunksCount', { count: doc.count })}`}
                    >
                      <Badge
                        variant="secondary"
                        className="max-w-[160px] truncate text-xs"
                      >
                        {doc.doc_name}
                      </Badge>
                    </Tooltip>
                  ))}
                  {docAggs.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      {t('knowledge.search.moreDocs', {
                        count: docAggs.length - 3,
                      })}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {requestScope && (
          <SearchScopeSummary scope={requestScope} docOptions={docOptions} />
        )}
        <DocFilterPanel
          options={docOptions}
          selectedDocIds={selectedDocIds}
          open={showDocFilter}
          onToggle={onToggleDocFilter}
          onDocFilter={onDocFilter}
          onClear={onClearDocFilter}
          onSelectAll={onSelectAllDocs}
        />
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto py-space-lg">
        {isSearching ? (
          <PageLoadingState
            title={t('knowledge.search.searching')}
            description={t('knowledge.search.searchingDescription')}
            role="status"
          />
        ) : searchError ? (
          <PageErrorState
            title={t('knowledge.search.errors.title')}
            description={t(`knowledge.search.errors.${searchError}`)}
            onRetry={onRetry}
            retryLabel={t('knowledge.search.errors.retry')}
            action={
              searchError === 'graphScope' ? (
                <Button variant="outline" onClick={onOpenConfig}>
                  {t('knowledge.search.errors.reviewConfig')}
                </Button>
              ) : undefined
            }
            role="alert"
          />
        ) : !hasSearched ? (
          <PageEmptyState
            title={t('knowledge.search.startTitle')}
            description={t('knowledge.search.startDescription')}
            icon={<Search className="size-icon-lg" />}
          />
        ) : results.length === 0 ? (
          <PageEmptyState
            title={t('knowledge.search.noResultsTitle')}
            description={t('knowledge.search.noResultsDescription')}
            icon={<Search className="size-icon-lg" />}
            action={
              <span className="text-sm text-text-secondary">
                {t('knowledge.search.querySummary', {
                  query: requestScope?.question,
                })}
              </span>
            }
            role="status"
          />
        ) : (
          <div className="space-y-space-base">
            {results.map((result, index) => (
              <RetrievalResultCard
                key={result.id}
                result={result}
                order={(currentPage - 1) * pageSize + index + 1}
                highlight={highlight}
                onOpen={() => onOpenResultPreview(result)}
              />
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="border-t border-border-default bg-background-surface px-space-base py-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-base">
            <div className="text-sm text-text-secondary">
              {t('knowledge.search.totalResults', { count: totalResults })}
            </div>

            <div className="flex flex-wrap items-center gap-space-base">
              <PageSizeSelector
                pageSize={pageSize}
                onChange={onPageSizeChange}
                options={[...PAGE_SIZE_OPTIONS]}
              />

              <div className="flex items-center gap-space-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={isSearching || currentPage <= 1}
                >
                  {t('knowledge.search.previousPage')}
                </Button>

                <div className="flex items-center gap-space-xs">
                  {pageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      disabled={isSearching}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="min-w-[32px]"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={isSearching || currentPage >= totalPages}
                >
                  {t('knowledge.search.nextPage')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

interface RetrievalResultCardProps {
  result: RetrievalResultView
  order: number
  highlight: boolean
  onOpen: () => void
}

const RetrievalResultCard: React.FC<RetrievalResultCardProps> = ({
  result,
  order,
  highlight,
  onOpen,
}) => {
  const { t } = useTranslation()
  const hasMore =
    result.text.length > 200 ||
    Boolean(result.highlight && result.highlight.length > 200)

  return (
    <article className="rounded-radius-lg border border-border-default bg-background-surface p-space-base transition-colors hover:bg-components-card-bg-hover">
      <div className="mb-space-base flex flex-wrap items-start justify-between gap-space-base">
        <div className="flex min-w-0 items-center gap-space-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-radius-full bg-status-success-subtle text-sm font-semibold text-text-success">
            {order}
          </div>
          <p className="truncate text-xs text-text-tertiary">ID: {result.id}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-space-xs">
          <Tooltip
            content={`${t('knowledge.search.similarity')}: ${formatPercent(result.scores.combined)}`}
          >
            <Badge variant="blue" className="text-xs">
              <Star className="mr-1 h-3 w-3" />
              {t('knowledge.search.similarityShort')}{' '}
              {formatPercent(result.scores.combined)}
            </Badge>
          </Tooltip>
          <Badge variant="green" className="text-xs">
            {t('knowledge.search.vector')} {formatPercent(result.scores.vector)}
          </Badge>
          <Badge variant="purple" className="text-xs">
            {t('knowledge.search.text')} {formatPercent(result.scores.term)}
          </Badge>
        </div>
      </div>

      <button
        type="button"
        className="mb-space-base block w-full rounded-radius-md p-space-xs text-left text-sm leading-relaxed text-text-secondary transition-colors hover:bg-background-subtle"
        onClick={onOpen}
      >
        <HighlightText
          html={result.highlight}
          text={result.text}
          enableHighlight={highlight}
          truncate
          truncateLength={200}
        />
        {hasMore && (
          <span className="mt-space-xs inline-flex text-xs font-medium text-text-accent">
            {t('knowledge.search.expand')}
          </span>
        )}
      </button>

      <div className="border-t border-border-default pt-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex min-w-0 items-center gap-space-sm">
            <FileIcon
              fileName={result.doc.name}
              fileType={result.doc.extension}
              size="sm"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-text-secondary">
                {result.doc.name}
              </div>
              <div className="mt-1 text-xs text-text-tertiary">
                {t('knowledge.search.fromDocument')}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={onOpen}
          >
            <FileText className="mr-1 h-3 w-3" />
            {t('knowledge.search.details')}
          </Button>
        </div>
      </div>
    </article>
  )
}

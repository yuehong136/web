import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'

import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { DocFilterPanel } from './doc-filter-panel'
import { RetrievalResultCard } from './result-card'
import { SearchScopeSummary } from './search-scope-summary'
import type { SearchError } from './hooks/use-search-execution'

import { PAGE_SIZE_OPTIONS } from './constants'
import type {
  RetrievalDocAgg,
  RetrievalResultView,
  SearchRequestScope,
} from './types'
import { hasUnavailableScore } from './utils'

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
  pageSize: number
  onToggleDocFilter: () => void
  onDocFilter: (docId: string, checked: boolean) => void
  onClearDocFilter: () => void
  onSelectAllDocs: () => void
  onOpenResultPreview: (result: RetrievalResultView) => void
  onPageSizeChange: (size: number) => void
}

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
  pageSize,
  onToggleDocFilter,
  onDocFilter,
  onClearDocFilter,
  onSelectAllDocs,
  onOpenResultPreview,
  onPageSizeChange,
}) => {
  const { t } = useTranslation()

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden p-space-lg">
      <div className="scrollbar-thin max-h-1/2 shrink-0 overflow-y-auto pb-space-base">
        <div className="flex flex-wrap items-start justify-between gap-space-base">
          <div className="min-w-0">
            <div className="flex items-center gap-space-sm">
              <FileText
                className="size-icon-md text-fg-muted"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-fg">
                {t('knowledge.search.resultsTitle')}
              </h2>
            </div>
            <div className="mt-space-xs flex flex-wrap items-center gap-space-sm text-sm text-fg-muted">
              <span className={isSearching ? 'text-shimmer' : undefined}>
                {isSearching
                  ? t('knowledge.search.searching')
                  : searchError
                    ? t('knowledge.search.errors.title')
                    : !hasSearched
                      ? t('knowledge.search.startTitle')
                      : t('knowledge.search.candidateTotal', {
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
                  <span className="text-fg-subtle">
                    {t('knowledge.search.source')}
                  </span>
                  {docAggs.slice(0, 3).map((doc) => (
                    <Tooltip
                      key={doc.doc_id}
                      content={`${doc.doc_name}: ${t('knowledge.search.chunksCount', { count: doc.count })}`}
                    >
                      <span className="inline-flex h-5.5 max-w-40 min-w-0 items-center gap-space-xs rounded-radius-full border border-line-subtle bg-sunken pr-space-sm pl-space-2xs text-xs text-fg-muted">
                        <FileKindTile name={doc.doc_name} size="xs" />
                        <span className="truncate">{doc.doc_name}</span>
                      </span>
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

        <div className="mt-space-sm flex items-center gap-space-sm">
          <span className="text-sm text-fg-muted">
            {t('knowledge.search.topResults')}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isSearching}
          >
            <SelectTrigger
              aria-label={t('knowledge.search.topResults')}
              className="w-24"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([...PAGE_SIZE_OPTIONS, pageSize])]
                .sort((a, b) => a - b)
                .map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
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
            aria-live="polite"
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
              <span className="text-sm text-fg-muted">
                {t('knowledge.search.querySummary', {
                  query: requestScope?.question,
                })}
              </span>
            }
            aria-live="polite"
          />
        ) : (
          <div className="space-y-space-base">
            {results.some(hasUnavailableScore) && (
              <p className="text-xs text-fg-muted">
                {t('knowledge.search.scoreUnavailableNote')}
              </p>
            )}
            {results.map((result, index) => (
              <RetrievalResultCard
                key={result.id}
                result={result}
                order={index + 1}
                highlight={highlight}
                onOpen={() => onOpenResultPreview(result)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

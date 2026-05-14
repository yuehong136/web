import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Search,
  Star,
} from 'lucide-react'

import { HighlightText } from '@/components/knowledge/HighlightText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileIcon } from '@/components/ui/file-icon'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { Tooltip } from '@/components/ui/tooltip'

import type { RetrievalDocAgg, RetrievalResult } from './types'

interface ResultPanelProps {
  query: string
  isSearching: boolean
  results: RetrievalResult[]
  totalResults: number
  docAggs: RetrievalDocAgg[]
  selectedDocIds: string[]
  showDocFilter: boolean
  highlight: boolean
  similarityThreshold: number
  currentPage: number
  pageSize: number
  totalPages: number
  pageNumbers: number[]
  onToggleDocFilter: () => void
  onDocFilter: (docId: string, checked: boolean) => void
  onClearDocFilter: () => void
  onSelectAllDocs: () => void
  onOpenResultPreview: (result: RetrievalResult) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  query,
  isSearching,
  results,
  totalResults,
  docAggs,
  selectedDocIds,
  showDocFilter,
  highlight,
  similarityThreshold,
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
    <section className="p-space-lg relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="pb-space-base">
        <div className="gap-space-base flex flex-wrap items-start justify-between">
          <div className="min-w-0">
            <div className="gap-space-sm flex items-center">
              <FileText className="h-5 w-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">
                {t('knowledge.search.resultsTitle')}
              </h2>
            </div>
            <div className="mt-space-xs gap-space-sm flex flex-wrap items-center text-sm text-text-secondary">
              <span>
                {isSearching
                  ? t('knowledge.search.searching')
                  : t('knowledge.search.foundResults', {
                      count: totalResults,
                    })}
              </span>
              {selectedDocIds.length > 0 && (
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

        {docAggs.length > 0 && (
          <div className="mt-space-base pt-space-base border-t border-border-default">
            <div className="gap-space-sm flex flex-wrap items-center justify-between">
              <button
                onClick={onToggleDocFilter}
                className="gap-space-xs flex items-center text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                <FileText className="h-4 w-4" />
                <span>{t('knowledge.search.docFilter')}</span>
                {selectedDocIds.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedDocIds.length}
                  </Badge>
                )}
                {showDocFilter ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <div className="gap-space-sm flex items-center">
                {selectedDocIds.length > 0 && (
                  <>
                    <span className="text-xs text-text-tertiary">
                      {t('knowledge.search.selectedDocsCount', {
                        count: selectedDocIds.length,
                      })}
                    </span>
                    <button
                      onClick={onClearDocFilter}
                      className="text-xs text-text-secondary hover:text-text-primary"
                    >
                      {t('knowledge.search.clear')}
                    </button>
                  </>
                )}
                <button
                  onClick={onSelectAllDocs}
                  className="rounded-radius-full px-space-sm py-space-xs border border-border-accent text-xs text-text-accent transition-colors hover:bg-background-subtle"
                >
                  {t('knowledge.search.all')}
                </button>
              </div>
            </div>

            {showDocFilter && (
              <div className="mt-space-sm gap-space-xs flex flex-wrap">
                {docAggs.map((doc) => (
                  <label
                    key={doc.doc_id}
                    className="gap-space-xs rounded-radius-full px-space-sm py-space-xs flex cursor-pointer items-center border border-border-default bg-background-subtle transition-colors hover:bg-components-card-bg-hover"
                  >
                    <Checkbox
                      checked={selectedDocIds.includes(doc.doc_id)}
                      onCheckedChange={(checked) =>
                        onDocFilter(doc.doc_id, checked as boolean)
                      }
                    />
                    <span className="max-w-[220px] truncate text-sm text-text-secondary">
                      {doc.doc_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {doc.count}
                    </Badge>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="py-space-lg min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {!query ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Search className="mb-space-base mx-auto h-12 w-12 text-text-muted" />
              <h3 className="mb-space-xs text-lg font-medium text-text-primary">
                {t('knowledge.search.startTitle')}
              </h3>
              <p className="text-text-tertiary">
                {t('knowledge.search.startDescription')}
              </p>
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="mb-space-base mx-auto h-8 w-8 animate-spin text-text-accent" />
              <p className="text-text-secondary">
                {t('knowledge.search.searchingDescription')}
              </p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Search className="mb-space-base mx-auto h-8 w-8 text-text-muted" />
              <h3 className="mb-space-xs text-lg font-medium text-text-primary">
                {t('knowledge.search.noResultsTitle')}
              </h3>
              <p className="mb-space-base text-text-tertiary">
                {t('knowledge.search.noResultsDescription')}
              </p>
              <div className="text-sm text-text-tertiary">
                <p>{t('knowledge.search.querySummary', { query })}</p>
                <p>
                  {t('knowledge.search.thresholdSummary', {
                    value: similarityThreshold,
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-space-base">
            {results.map((result, index) => (
              <RetrievalResultCard
                key={result.chunk_id}
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
        <div className="px-space-base py-space-sm border-t border-border-default bg-background-surface">
          <div className="gap-space-base flex flex-wrap items-center justify-between">
            <div className="text-sm text-text-secondary">
              {t('knowledge.search.totalResults', { count: totalResults })}
            </div>

            <div className="gap-space-base flex flex-wrap items-center">
              <PageSizeSelector
                pageSize={pageSize}
                onChange={onPageSizeChange}
                options={[10, 20, 50, 100]}
              />

              <div className="gap-space-xs flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  {t('knowledge.search.previousPage')}
                </Button>

                <div className="gap-space-xs flex items-center">
                  {pageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
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
                  disabled={currentPage >= totalPages}
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
  result: RetrievalResult
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
    <article className="rounded-radius-lg p-space-base border border-border-default bg-background-surface transition-colors hover:bg-components-card-bg-hover">
      <div className="mb-space-base gap-space-base flex flex-wrap items-start justify-between">
        <div className="gap-space-sm flex min-w-0 items-center">
          <div className="rounded-radius-full flex h-8 w-8 shrink-0 items-center justify-center bg-state-success-subtle text-sm font-semibold text-text-success">
            {order}
          </div>
          <p className="truncate text-xs text-text-tertiary">
            ID: {result.chunk_id}
          </p>
        </div>
        <div className="gap-space-xs flex flex-wrap items-center justify-end">
          <Tooltip
            content={`${t('knowledge.search.similarity')}: ${(result.similarity * 100).toFixed(1)}%`}
          >
            <Badge variant="blue" className="text-xs">
              <Star className="mr-1 h-3 w-3" />
              {t('knowledge.search.similarityShort')}{' '}
              {(result.similarity * 100).toFixed(1)}%
            </Badge>
          </Tooltip>
          <Badge variant="green" className="text-xs">
            {t('knowledge.search.vector')}{' '}
            {(result.vector_similarity * 100).toFixed(1)}%
          </Badge>
          <Badge variant="purple" className="text-xs">
            {t('knowledge.search.text')}{' '}
            {(result.term_similarity * 100).toFixed(1)}%
          </Badge>
        </div>
      </div>

      <button
        type="button"
        className="mb-space-base rounded-radius-md p-space-xs block w-full text-left text-sm leading-relaxed text-text-secondary transition-colors hover:bg-background-subtle"
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

      <div className="pt-space-sm border-t border-border-default">
        <div className="gap-space-sm flex flex-wrap items-center justify-between">
          <div className="gap-space-sm flex min-w-0 items-center">
            <FileIcon
              fileName={result.docnm_kwd}
              fileType={result.docnm_kwd.split('.').pop() || 'txt'}
              size="sm"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-text-secondary">
                {result.docnm_kwd}
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

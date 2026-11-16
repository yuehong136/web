import { toast } from '@/lib/toast'
import { useCallback, useMemo, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { CollectionTemplate } from '@/components/page-templates'
import { PageErrorState, PageLoadingState, Pager } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useSearchStore } from '@/stores/search'
import {
  useDeleteSearch,
  useFetchSearchAppList,
} from '@/hooks/use-search-request'
import { ROUTES } from '@/constants'
import type { SearchAppListItem } from '@/types/search'
import CreateSearchDialog from './components/CreateSearchDialog'
import SearchEmptyState from './components/SearchEmptyState'
import {
  SearchAppCollection,
  SearchFilterBar,
  countSearchFeatures,
  type SearchFeatureFilters,
  type SearchSortBy,
} from './components/search-collection'
import {
  resolveRelatedEnabled,
  resolveSummaryEnabled,
  type SearchTimeFormat,
} from './components/utils'

const PAGE_SIZES = [12, 24, 48]
/** Feature filters are applied client-side over this many apps. */
const FILTER_FETCH_SIZE = 1000

const matchesToggle = (selected: string[], enabled: boolean) =>
  selected.length === 0 ||
  (selected.includes('enabled') && enabled) ||
  (selected.includes('disabled') && !enabled)

export const SearchListPage: FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useSearchStore()
  const { deleteSearch } = useDeleteSearch()

  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [sortBy, setSortBy] = useState<SearchSortBy>('update_time')
  const [sortDesc, setSortDesc] = useState(true)
  const [timeFormat, setTimeFormat] = useState<SearchTimeFormat>('detailed')
  const [filters, setFilters] = useState<SearchFeatureFilters>({
    summary: [],
    related: [],
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SearchAppListItem | null>(
    null,
  )

  const hasActiveFilters = filters.summary.length + filters.related.length > 0
  const { searchApps, total, isLoading, isError, refetch } =
    useFetchSearchAppList({
      page: hasActiveFilters ? 1 : currentPage,
      page_size: hasActiveFilters ? FILTER_FETCH_SIZE : pageSize,
      orderby: sortBy,
      desc: sortDesc,
      keywords: keyword || undefined,
    })

  const filteredApps = useMemo(
    () =>
      hasActiveFilters
        ? searchApps.filter(
            (app) =>
              matchesToggle(filters.summary, resolveSummaryEnabled(app)) &&
              matchesToggle(filters.related, resolveRelatedEnabled(app)),
          )
        : searchApps,
    [filters, hasActiveFilters, searchApps],
  )
  const totalCount = hasActiveFilters ? filteredApps.length : total
  const pageData = useMemo(() => {
    if (!hasActiveFilters) return searchApps
    const start = (currentPage - 1) * pageSize
    return filteredApps.slice(start, start + pageSize)
  }, [currentPage, filteredApps, hasActiveFilters, pageSize, searchApps])

  const totalPages = Math.ceil(totalCount / pageSize)
  if (totalPages === 0 && currentPage !== 1) setCurrentPage(1)
  else if (totalPages > 0 && currentPage > totalPages)
    setCurrentPage(totalPages)

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value)
    setCurrentPage(1)
  }, [])
  const handleOpen = useCallback(
    (id: string) => navigate(`${ROUTES.SEARCH}/${id}`),
    [navigate],
  )
  const handleDelete = useCallback(
    async (target: SearchAppListItem) => {
      try {
        await deleteSearch(target.id)
        toast.success(t('searchPage.notifications.deleteSuccessTitle'), {
          description: t('searchPage.notifications.deleteSuccessMessage'),
        })
      } catch {
        toast.error(t('searchPage.notifications.deleteFailedTitle'), {
          description: t('searchPage.notifications.deleteFailedMessage'),
        })
      }
    },
    [deleteSearch, t],
  )
  const resetFilters = () => {
    handleKeywordChange('')
    setFilters({ summary: [], related: [] })
  }

  const filtered = Boolean(keyword) || hasActiveFilters
  const state = isError
    ? 'error'
    : isLoading && !pageData.length
      ? 'loading'
      : !pageData.length
        ? 'empty'
        : 'content'
  const features = countSearchFeatures(pageData)

  return (
    <>
      <CollectionTemplate
        title={t('searchPage.title')}
        count={totalCount}
        countLabel={t('searchPage.results', { count: totalCount })}
        actions={
          state === 'empty' && !filtered ? null : (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('searchPage.create')}
            </Button>
          )
        }
        filterBar={
          <SearchFilterBar
            keyword={keyword}
            onKeywordChange={handleKeywordChange}
            filters={filters}
            onFiltersChange={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            sortBy={sortBy}
            onSortByChange={(value) => {
              setSortBy(value)
              setCurrentPage(1)
            }}
            sortDesc={sortDesc}
            onSortDescChange={(value) => {
              setSortDesc(value)
              setCurrentPage(1)
            }}
            timeFormat={timeFormat}
            onTimeFormatChange={setTimeFormat}
            view={viewMode}
            onViewChange={setViewMode}
          />
        }
        state={state}
        loadingState={<PageLoadingState title={t('searchPage.loading')} />}
        errorState={
          <PageErrorState
            title={t('searchPage.loadFailedTitle')}
            description={t('searchPage.loadFailedDescription')}
            retryLabel={t('common.retry')}
            onRetry={() => {
              void refetch()
            }}
          />
        }
        emptyState={
          <SearchEmptyState
            type={filtered ? 'search' : 'list'}
            onCreate={() => setShowCreateDialog(true)}
            onReset={resetFilters}
          />
        }
        footerNote={t('searchPage.pageFeatures', features)}
        footer={
          <Pager
            page={currentPage}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setCurrentPage}
            pageSizeOptions={PAGE_SIZES}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        }
      >
        <SearchAppCollection
          apps={pageData}
          view={viewMode}
          timeFormat={timeFormat}
          onOpen={handleOpen}
          onDelete={setDeleteTarget}
        />
      </CollectionTemplate>

      <CreateSearchDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        variant="destructive"
        title={t('searchPage.deleteDialog.title')}
        description={t('searchPage.deleteDialog.description', {
          name: deleteTarget?.name || '',
        })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        // The list closes the dialog at once; the request reports by toast.
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </>
  )
}

export default SearchListPage

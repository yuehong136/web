import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FilterConfig, FilterValue } from '@/components/ui/filter-popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useUIStore } from '@/stores/ui'
import { useSearchStore } from '@/stores/search'
import {
  useDeleteSearch,
  useFetchSearchAppList,
} from '@/hooks/use-search-request'
import { ROUTES } from '@/constants'
import type { SearchAppListItem } from '@/types/search'
import CreateSearchDialog from './components/CreateSearchDialog'
import SearchEmptyState from './components/SearchEmptyState'
import SearchGridCard from './components/search-grid-card'
import SearchListView from './components/search-list-view'
import SearchPagination from './components/search-pagination'
import SearchStatsRow from './components/search-stats-row'
import SearchToolbar from './components/search-toolbar'
import {
  resolveRelatedEnabled,
  resolveSummaryEnabled,
  type SearchTimeFormat,
} from './components/utils'

type SearchSortBy = 'update_time' | 'create_time' | 'name'

export const SearchListPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const { viewMode, setViewMode } = useSearchStore()
  const { deleteSearch } = useDeleteSearch()

  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [sortBy, setSortBy] = useState<SearchSortBy>('update_time')
  const [sortDesc, setSortDesc] = useState(true)
  const [timeFormat, setTimeFormat] = useState<SearchTimeFormat>('detailed')
  const [filters, setFilters] = useState<FilterValue>({
    summary: [],
    related: [],
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SearchAppListItem | null>(
    null,
  )
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'summary',
        label: t('searchPage.filters.summary', 'AI 摘要'),
        options: [
          {
            value: 'enabled',
            label: t('searchPage.filters.enabled', '已开启'),
          },
          {
            value: 'disabled',
            label: t('searchPage.filters.disabled', '已关闭'),
          },
        ],
      },
      {
        key: 'related',
        label: t('searchPage.filters.related', '相关问题'),
        options: [
          {
            value: 'enabled',
            label: t('searchPage.filters.enabled', '已开启'),
          },
          {
            value: 'disabled',
            label: t('searchPage.filters.disabled', '已关闭'),
          },
        ],
      },
    ],
    [t],
  )

  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters).some(
        (values) => Array.isArray(values) && values.length > 0,
      ),
    [filters],
  )

  const requestPage = hasActiveFilters ? 1 : currentPage
  const requestPageSize = hasActiveFilters ? 1000 : pageSize

  const { searchApps, total, isLoading } = useFetchSearchAppList({
    page: requestPage,
    page_size: requestPageSize,
    orderby: sortBy,
    desc: sortDesc,
    keywords: keyword || undefined,
  })

  const filteredApps = useMemo(() => {
    if (!hasActiveFilters) return searchApps

    return searchApps.filter((app) => {
      const summaryEnabled = resolveSummaryEnabled(app)
      const relatedEnabled = resolveRelatedEnabled(app)

      const summaryFilter = filters.summary || []
      const relatedFilter = filters.related || []

      const summaryMatch =
        summaryFilter.length === 0 ||
        (summaryFilter.includes('enabled') && summaryEnabled) ||
        (summaryFilter.includes('disabled') && !summaryEnabled)

      const relatedMatch =
        relatedFilter.length === 0 ||
        (relatedFilter.includes('enabled') && relatedEnabled) ||
        (relatedFilter.includes('disabled') && !relatedEnabled)

      return summaryMatch && relatedMatch
    })
  }, [filters.related, filters.summary, hasActiveFilters, searchApps])

  const totalCount = hasActiveFilters ? filteredApps.length : total

  const pageData = useMemo(() => {
    if (!hasActiveFilters) return searchApps

    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredApps.slice(start, end)
  }, [currentPage, filteredApps, hasActiveFilters, pageSize, searchApps])

  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount, pageSize],
  )

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1)
      return
    }
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value)
    setCurrentPage(1)
  }, [])

  const handleOpen = useCallback(
    (id: string) => {
      navigate(`${ROUTES.SEARCH}/${id}`)
    },
    [navigate],
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    try {
      await deleteSearch(deleteTarget.id)
      addNotification({
        type: 'success',
        title: t('searchPage.notifications.deleteSuccessTitle', '删除成功'),
        message: t(
          'searchPage.notifications.deleteSuccessMessage',
          '搜索应用已删除',
        ),
      })
      setDeleteTarget(null)
    } catch {
      addNotification({
        type: 'error',
        title: t('searchPage.notifications.deleteFailedTitle', '删除失败'),
        message: t(
          'searchPage.notifications.deleteFailedMessage',
          '删除搜索应用时发生错误',
        ),
      })
    }
  }, [addNotification, deleteSearch, deleteTarget, t])

  const showEmptyState = !isLoading && pageData.length === 0
  const emptyStateType = keyword || hasActiveFilters ? 'search' : 'list'

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {t('searchPage.title', '搜索应用')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t(
              'searchPage.description',
              '在选定知识库之上完成检索与 AI 总结，打造专用搜索应用。',
            )}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('searchPage.create', '创建搜索应用')}
        </Button>
      </div>

      <div className="mb-4">
        <SearchStatsRow
          total={totalCount}
          apps={hasActiveFilters ? filteredApps : searchApps}
        />
      </div>

      <div className="mb-4">
        <SearchToolbar
          keyword={keyword}
          onKeywordChange={handleKeywordChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortByChange={(value) => {
            setSortBy(value)
            setCurrentPage(1)
          }}
          sortDesc={sortDesc}
          onSortDescToggle={() => {
            setSortDesc((prev) => !prev)
            setCurrentPage(1)
          }}
          timeFormat={timeFormat}
          onTimeFormatChange={setTimeFormat}
          filterConfigs={filterConfigs}
          filterValue={filters}
          onFilterChange={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
        />
      </div>

      {showEmptyState ? (
        <div className="flex flex-1 items-center justify-center">
          <SearchEmptyState
            onCreate={() => setShowCreateDialog(true)}
            type={emptyStateType}
          />
        </div>
      ) : (
        <>
          <div className="-mx-1 flex-1 overflow-y-auto px-1 pb-2 pt-1">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isLoading
                  ? [...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-surface-secondary h-[180px] animate-pulse rounded-lg"
                      />
                    ))
                  : pageData.map((app) => (
                      <SearchGridCard
                        key={app.id}
                        app={app}
                        timeFormat={timeFormat}
                        onOpen={handleOpen}
                        onEdit={handleOpen}
                        onDelete={(item) => setDeleteTarget(item)}
                      />
                    ))}
              </div>
            ) : (
              <SearchListView
                data={pageData}
                isLoading={isLoading}
                timeFormat={timeFormat}
                onOpen={handleOpen}
                onEdit={handleOpen}
                onDelete={(app) => setDeleteTarget(app)}
              />
            )}
          </div>

          <SearchPagination
            total={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      <CreateSearchDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('searchPage.deleteDialog.title', '删除搜索应用')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'searchPage.deleteDialog.description',
                '将永久删除「{{name}}」，该操作不可撤销。',
                { name: deleteTarget?.name || '' },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SearchListPage

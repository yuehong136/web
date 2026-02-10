import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useDeleteSearch, useFetchSearchAppList } from '@/hooks/use-search-request'
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

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'summary',
    label: 'AI 摘要',
    options: [
      { value: 'enabled', label: '已开启' },
      { value: 'disabled', label: '已关闭' },
    ],
  },
  {
    key: 'related',
    label: '相关问题',
    options: [
      { value: 'enabled', label: '已开启' },
      { value: 'disabled', label: '已关闭' },
    ],
  },
]

export const SearchListPage: React.FC = () => {
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
  const [filters, setFilters] = useState<FilterValue>({ summary: [], related: [] })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SearchAppListItem | null>(null)

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((values) => Array.isArray(values) && values.length > 0),
    [filters]
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

  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize])

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

  const handleOpen = useCallback((id: string) => {
    navigate(`${ROUTES.SEARCH}/${id}`)
  }, [navigate])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    try {
      await deleteSearch(deleteTarget.id)
      addNotification({ type: 'success', title: '删除成功', message: '搜索应用已删除' })
      setDeleteTarget(null)
    } catch {
      addNotification({ type: 'error', title: '删除失败', message: '删除搜索应用时发生错误' })
    }
  }, [addNotification, deleteSearch, deleteTarget])

  const showEmptyState = !isLoading && pageData.length === 0
  const emptyStateType = keyword || hasActiveFilters ? 'search' : 'list'

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">搜索应用</h1>
          <p className="text-sm text-text-secondary mt-1">
            在选定知识库之上完成检索与 AI 总结，打造专用搜索应用。
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建搜索应用
        </Button>
      </div>

      <div className="mb-4">
        <SearchStatsRow total={totalCount} apps={hasActiveFilters ? filteredApps : searchApps} />
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
          filterConfigs={FILTER_CONFIGS}
          filterValue={filters}
          onFilterChange={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
        />
      </div>

      {showEmptyState ? (
        <div className="flex-1 flex items-center justify-center">
          <SearchEmptyState
            onCreate={() => setShowCreateDialog(true)}
            type={emptyStateType}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {isLoading
                  ? [...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-[180px] rounded-lg bg-surface-secondary animate-pulse"
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

      <CreateSearchDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除搜索应用</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除「{deleteTarget?.name || ''}」，该操作不可撤销。
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

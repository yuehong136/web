/**
 * 工作室页面
 * 布局参考记忆库管理页面，保持一致的交互和视觉体验
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Grid,
  List,
  Sparkles,
  CheckCircle,
  FileEdit,
  Clock,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  FilterPopover,
  type FilterConfig,
  type FilterValue,
} from '@/components/ui/filter-popover'
import { CustomSelect } from '@/components/ui/custom-select'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { ViewToggle } from '@/components/ui/view-toggle'
import { MemoryStatsCard } from '@/components/memory'
import { AppCard, AppListView, AppEmptyState } from '@/components/studio'
import { CreateProjectModal } from './components/CreateProjectModal'
import { CreateAppModal } from './components/CreateAppModal'
import { useStudioStore } from '@/stores/studio'
import {
  useFetchDialogList,
  useDeleteDialogApps,
  useExportDialogApps,
} from '@/hooks/use-dialog-apps'
import { ImportTemplateDialog } from './components/ImportTemplateDialog'
import type { DialogApp } from '@/types/api'

export const StudioPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Store state
  const {
    filter,
    setFilter,
    viewMode,
    setViewMode,
    timeFormat,
    setTimeFormat,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    projectTypeModalOpen,
    openProjectTypeModal,
    closeProjectTypeModal,
    createAppModalOpen,
    openCreateAppModal,
    closeCreateAppModal,
  } = useStudioStore()

  // 删除确认弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [appToDelete, setAppToDelete] = React.useState<DialogApp | null>(null)
  const [sortDesc, setSortDesc] = React.useState(true)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)

  // API hooks - 使用后端分页（与 ragflow 一致）
  const {
    data,
    loading: isLoading,
    searchString,
    handleInputChange,
    pagination,
    setPagination,
  } = useFetchDialogList(12) // 默认每页 12 条，与 ragflow 类似

  // Mutations
  const deleteDialogAppsMutation = useDeleteDialogApps()
  const exportMutation = useExportDialogApps()

  const dialogApps = data.dialogs
  const total = data.total
  // 本地状态筛选（状态筛选仍在前端，因为后端暂不支持）
  const filteredApps = React.useMemo(() => {
    if (filter.status.length === 0) {
      return dialogApps
    }
    return dialogApps.filter((app) => filter.status.includes(app.status))
  }, [dialogApps, filter.status])

  const sortedApps = React.useMemo(() => {
    const getSortTime = (app: DialogApp) =>
      app.update_time || app.create_time || 0
    return [...filteredApps].sort((a, b) =>
      sortDesc
        ? getSortTime(b) - getSortTime(a)
        : getSortTime(a) - getSortTime(b),
    )
  }, [filteredApps, sortDesc])

  const totalPages = Math.ceil(total / pagination.pageSize)

  // 统计数据（基于当前页数据的估算）
  const stats = React.useMemo(() => {
    const published = dialogApps.filter((app) => app.status === '1').length
    const draft = dialogApps.filter((app) => app.status !== '1').length
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentUpdated = dialogApps.filter(
      (app) => new Date(app.update_date).getTime() > oneWeekAgo,
    ).length

    return {
      total,
      published,
      draft,
      recentUpdated,
    }
  }, [dialogApps, total])

  // 分页和搜索状态同步到 store
  const page = pagination.current
  const pageSize = pagination.pageSize
  const setPage = (p: number) => setPagination({ current: p, pageSize })
  const setPageSize = (size: number) =>
    setPagination({ current: 1, pageSize: size })

  // 处理创建项目类型选择
  const handleCreateProject = (type: 'app' | 'agent') => {
    closeProjectTypeModal()
    if (type === 'app') {
      openCreateAppModal()
    } else {
      navigate('/agents?create=1')
    }
  }

  // 处理创建应用
  const handleCreateApp = (appData: {
    name: string
    description: string
    icon?: string
  }) => {
    console.log('App created successfully:', appData)
  }

  // 处理编辑
  const handleEdit = (app: DialogApp) => {
    // 直接跳转到配置页面
    const searchParams = new URLSearchParams({
      id: app.id,
      name: app.name,
      description: app.description,
      ...(app.icon && { icon: app.icon }),
    })
    window.location.href = `/studio/create-app?${searchParams.toString()}`
  }

  // 打开删除确认
  const handleDeleteClick = (app: DialogApp) => {
    setAppToDelete(app)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const handleConfirmDelete = () => {
    if (appToDelete) {
      deleteDialogAppsMutation.mutate([appToDelete.id])
    }
    setDeleteDialogOpen(false)
    setAppToDelete(null)
  }

  // 批量删除
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    deleteDialogAppsMutation.mutate(selectedIds, {
      onSuccess: () => {
        clearSelection()
      },
    })
  }

  // 导出单个应用模版
  const handleExportApp = (app: DialogApp) => {
    exportMutation.mutate([app.id])
  }

  // 批量导出
  const handleBulkExport = () => {
    if (selectedIds.length === 0) return
    exportMutation.mutate(selectedIds)
  }

  // 导入完成回调
  const handleImportComplete = () => {
    setImportDialogOpen(false)
  }

  // 筛选器配置
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: t('studio.filters.status', '状态'),
      options: [
        { value: '1', label: t('studio.filters.published', '已发布') },
        { value: '0', label: t('studio.filters.draft', '草稿') },
      ],
    },
  ]

  // 筛选值转换
  const filterValue: FilterValue = {
    status: filter.status,
  }

  // 处理筛选变化
  const handleFilterChange = (newValue: FilterValue) => {
    setFilter({ status: (newValue.status || []) as string[] })
  }

  // 判断是否显示空状态
  const showEmptyState = !isLoading && sortedApps.length === 0
  const emptyStateType =
    searchString || filter.status.length > 0 ? 'search' : 'list'

  return (
    <div className="flex h-full flex-col p-6">
      {/* 页面头部 - 标题 + 创建按钮 */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {t('studio.page.title', '工作室')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t('studio.page.description', '创建和管理您的 AI 应用和智能体')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={exportMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                {exportMutation.isPending
                  ? t('studio.page.exporting', '导出中...')
                  : t('studio.page.exportSelected', '导出 ({{count}})', {
                      count: selectedIds.length,
                    })}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('studio.page.deleteSelected', '删除 ({{count}})', {
                  count: selectedIds.length,
                })}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('studio.page.import', '导入')}
          </Button>
          <Button onClick={openProjectTypeModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t('studio.page.createProject', '新建项目')}
          </Button>
        </div>
      </div>

      {/* 统计卡片 - 与记忆库/知识库页面保持一致的布局 */}
      <div className="mb-4">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MemoryStatsCard
            title={t('studio.stats.totalApps', '应用总数')}
            value={stats.total}
            icon={Sparkles}
            color="info"
          />
          <MemoryStatsCard
            title={t('studio.stats.published', '已发布')}
            value={stats.published}
            icon={CheckCircle}
            color="success"
          />
          <MemoryStatsCard
            title={t('studio.stats.draft', '草稿')}
            value={stats.draft}
            icon={FileEdit}
            color="warning"
          />
          <MemoryStatsCard
            title={t('studio.stats.recentUpdated', '最近更新')}
            value={stats.recentUpdated}
            icon={Clock}
            color="info"
          />
        </div>
      </div>

      {/* 搜索和筛选工具栏 */}
      <div className="mb-4 flex items-center space-x-4">
        {/* 左侧：搜索框 - 使用后端分页的搜索 */}
        <div className="max-w-md flex-1">
          <Input
            type="search"
            placeholder={t('studio.filters.searchPlaceholder', '搜索应用...')}
            value={searchString}
            onChange={(e) => handleInputChange(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* 右侧：筛选 + 时间格式 + 视图切换 */}
        <div className="flex items-center space-x-2">
          {/* 筛选按钮 */}
          <FilterPopover
            filters={filterConfigs}
            value={filterValue}
            onChange={handleFilterChange}
          />

          {/* 时间格式选择器 */}
          <CustomSelect
            options={[
              {
                value: 'detailed',
                label: t('studio.toolbar.detailedTime', '详细时间'),
              },
              {
                value: 'compact',
                label: t('studio.toolbar.compactTime', '简洁时间'),
              },
              {
                value: 'relative',
                label: t('studio.toolbar.relativeTime', '相对时间'),
              },
            ]}
            value={timeFormat}
            onChange={(value) =>
              setTimeFormat(value as 'detailed' | 'compact' | 'relative')
            }
            size="sm"
            className="min-w-[100px]"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDesc((prev) => !prev)}
            className="flex h-9 items-center gap-1 px-2 text-xs"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>
              {sortDesc
                ? t('studio.toolbar.descending', '倒序')
                : t('studio.toolbar.ascending', '正序')}
            </span>
          </Button>

          {/* 视图切换 */}
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            size="md"
            options={[
              {
                value: 'grid',
                icon: <Grid />,
                label: t('studio.toolbar.gridView', '网格视图'),
              },
              {
                value: 'list',
                icon: <List />,
                label: t('studio.toolbar.listView', '列表视图'),
              },
            ]}
          />
        </div>
      </div>

      {/* 内容区域 */}
      {showEmptyState ? (
        <div className="flex flex-1 items-center justify-center">
          <AppEmptyState
            type={emptyStateType}
            onAction={openProjectTypeModal}
          />
        </div>
      ) : (
        <>
          {/* 可滚动内容区域 - pt-1 pb-2 为悬停效果留出空间 */}
          <div className="-mx-1 flex-1 overflow-y-auto px-1 pb-2 pt-1">
            {viewMode === 'grid' ? (
              /* 卡片网格视图 */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isLoading
                  ? // 加载骨架屏
                    [...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-surface-secondary h-[180px] animate-pulse rounded-2xl"
                      />
                    ))
                  : sortedApps.map((app) => (
                      <AppCard
                        key={app.id}
                        data={app}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onExport={handleExportApp}
                        selected={selectedIds.includes(app.id)}
                        onSelect={toggleSelect}
                        timeFormat={timeFormat}
                      />
                    ))}
              </div>
            ) : (
              /* 列表视图 */
              <AppListView
                data={sortedApps}
                selectedIds={selectedIds}
                onSelect={toggleSelect}
                onSelectAll={selectAll}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isLoading={isLoading}
                timeFormat={timeFormat}
              />
            )}
          </div>

          {/* 分页控件 - 固定在底部，参考记忆库/知识库页面 */}
          {totalPages > 0 && (
            <div
              className="mt-4 rounded-lg border shadow-sm"
              style={{
                borderColor: 'var(--color-components-card-border)',
                backgroundColor: 'var(--color-components-card-bg)',
              }}
            >
              <div className="flex items-center justify-between px-6 py-4">
                <div
                  className="text-sm"
                  style={{ color: 'var(--color-components-pagination-text)' }}
                >
                  {t('studio.pagination.total', '共 {{count}} 项', {
                    count: total,
                  })}
                  {selectedIds.length > 0 &&
                    ` • ${t(
                      'studio.pagination.selected',
                      '已选择 {{count}} 个',
                      {
                        count: selectedIds.length,
                      },
                    )}`}
                </div>

                <div className="flex items-center space-x-4">
                  {/* 每页显示选择器 */}
                  <PageSizeSelector
                    pageSize={pageSize}
                    onChange={(size) => setPageSize(size)}
                    options={[6, 12, 24, 48]}
                  />

                  {/* 页码导航 */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('studio.pagination.previous', '上一页')}
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.max(1, Math.min(7, totalPages)) },
                        (_, i) => {
                          let pageNum = i + 1

                          // Show first page, last page, current page and surrounding pages
                          if (totalPages > 7) {
                            if (page <= 4) {
                              pageNum = i + 1
                            } else if (page >= totalPages - 3) {
                              pageNum = totalPages - 6 + i
                            } else {
                              pageNum = page - 3 + i
                            }
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="min-w-[40px]"
                            >
                              {pageNum}
                            </Button>
                          )
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages || totalPages === 0}
                    >
                      {t('studio.pagination.next', '下一页')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 创建项目类型选择弹窗 */}
      <CreateProjectModal
        isOpen={projectTypeModalOpen}
        onClose={closeProjectTypeModal}
        onCreateProject={handleCreateProject}
      />

      {/* 创建应用弹窗 */}
      <CreateAppModal
        isOpen={createAppModalOpen}
        onClose={closeCreateAppModal}
        onCreate={handleCreateApp}
      />

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('studio.deleteDialog.title', '删除应用')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'studio.deleteDialog.description',
                '确定要删除这个应用吗？此操作不可撤销。',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', '取消')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="hover:bg-state-error/90 bg-state-error"
            >
              {t('common.delete', '删除')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 导入模版弹窗 */}
      <ImportTemplateDialog
        isOpen={importDialogOpen}
        onClose={handleImportComplete}
      />
    </div>
  )
}

/**
 * 工作室页面
 * 布局参考记忆库管理页面，保持一致的交互和视觉体验
 */

import React from 'react'
import {
  Plus,
  Grid,
  List,
  Sparkles,
  CheckCircle,
  FileEdit,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
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
import { FilterPopover, type FilterConfig, type FilterValue } from '@/components/ui/filter-popover'
import { CustomSelect } from '@/components/ui/custom-select'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { ViewToggle } from '@/components/ui/view-toggle'
import { MemoryStatsCard } from '@/components/memory'
import {
  AppCard,
  AppListView,
  AppEmptyState,
} from '@/components/studio'
import { CreateProjectModal } from './components/CreateProjectModal'
import { CreateAppModal } from './components/CreateAppModal'
import { useStudioStore } from '@/stores/studio'
import { useFetchDialogList, useDeleteDialogApps } from '@/hooks/use-dialog-apps'
import { STUDIO_TEXTS } from '@/constants/studio-texts'
import type { DialogApp } from '@/types/api'

export const StudioPage: React.FC = () => {
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
    editingApp,
  } = useStudioStore()

  // 删除确认弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [appToDelete, setAppToDelete] = React.useState<DialogApp | null>(null)

  // API hooks - 使用后端分页（与 ragflow 一致）
  const {
    data,
    loading: isLoading,
    searchString,
    handleInputChange,
    pagination,
    setPagination,
  } = useFetchDialogList(12) // 默认每页 12 条，与 ragflow 类似

  const dialogApps = data.dialogs
  const total = data.total
  const totalPages = Math.ceil(total / pagination.pageSize)

  // 本地状态筛选（状态筛选仍在前端，因为后端暂不支持）
  const filteredApps = React.useMemo(() => {
    if (filter.status.length === 0) {
      return dialogApps
    }
    return dialogApps.filter((app) => filter.status.includes(app.status))
  }, [dialogApps, filter.status])

  // 统计数据（基于当前页数据的估算）
  const stats = React.useMemo(() => {
    const published = dialogApps.filter((app) => app.status === '1').length
    const draft = dialogApps.filter((app) => app.status !== '1').length
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentUpdated = dialogApps.filter(
      (app) => new Date(app.update_date).getTime() > oneWeekAgo
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
  const setPageSize = (size: number) => setPagination({ current: 1, pageSize: size })

  // 处理创建项目类型选择
  const handleCreateProject = (type: 'app' | 'agent') => {
    closeProjectTypeModal()
    if (type === 'app') {
      openCreateAppModal()
    } else {
      // 智能体创建页面暂未实现
      console.log('Creating agent - page not implemented yet')
    }
  }

  // 处理创建应用
  const handleCreateApp = (appData: { name: string; description: string; icon?: string }) => {
    console.log('App created successfully:', appData)
  }

  // 处理编辑
  const handleEdit = (app: DialogApp) => {
    // 直接跳转到配置页面
    const searchParams = new URLSearchParams({
      id: app.id,
      name: app.name,
      description: app.description,
      ...(app.icon && { icon: app.icon })
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

  // 筛选器配置
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: STUDIO_TEXTS.filterStatus,
      options: [
        { value: '1', label: STUDIO_TEXTS.statusPublished },
        { value: '0', label: STUDIO_TEXTS.statusDraft },
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
  const showEmptyState = !isLoading && filteredApps.length === 0
  const emptyStateType = searchString || filter.status.length > 0 ? 'search' : 'list'

  return (
    <div className="h-full flex flex-col p-6">
      {/* 页面头部 - 标题 + 创建按钮 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {STUDIO_TEXTS.pageTitle}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {STUDIO_TEXTS.pageDescription}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除 ({selectedIds.length})
            </Button>
          )}
          <Button onClick={openProjectTypeModal}>
            <Plus className="h-4 w-4 mr-2" />
            {STUDIO_TEXTS.createProject}
          </Button>
        </div>
      </div>

      {/* 统计卡片 - 与记忆库/知识库页面保持一致的布局 */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MemoryStatsCard
            title={STUDIO_TEXTS.stats.totalApps}
            value={stats.total}
            icon={Sparkles}
            color="info"
          />
          <MemoryStatsCard
            title={STUDIO_TEXTS.stats.published}
            value={stats.published}
            icon={CheckCircle}
            color="success"
          />
          <MemoryStatsCard
            title={STUDIO_TEXTS.stats.draft}
            value={stats.draft}
            icon={FileEdit}
            color="warning"
          />
          <MemoryStatsCard
            title={STUDIO_TEXTS.stats.recentUpdated}
            value={stats.recentUpdated}
            icon={Clock}
            color="info"
          />
        </div>
      </div>

      {/* 搜索和筛选工具栏 */}
      <div className="flex items-center space-x-4 mb-4">
        {/* 左侧：搜索框 - 使用后端分页的搜索 */}
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder={STUDIO_TEXTS.searchPlaceholder}
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
              { value: 'detailed', label: STUDIO_TEXTS.timeFormatDetailed },
              { value: 'compact', label: STUDIO_TEXTS.timeFormatCompact },
              { value: 'relative', label: STUDIO_TEXTS.timeFormatRelative },
            ]}
            value={timeFormat}
            onChange={(value) => setTimeFormat(value as 'detailed' | 'compact' | 'relative')}
            size="sm"
            className="min-w-[100px]"
          />

          {/* 视图切换 */}
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            size="md"
            options={[
              { value: 'grid', icon: <Grid />, label: '网格视图' },
              { value: 'list', icon: <List />, label: '列表视图' },
            ]}
          />
        </div>
      </div>

      {/* 内容区域 */}
      {showEmptyState ? (
        <div className="flex-1 flex items-center justify-center">
          <AppEmptyState type={emptyStateType} onAction={openProjectTypeModal} />
        </div>
      ) : (
        <>
          {/* 可滚动内容区域 - pt-1 pb-2 为悬停效果留出空间 */}
          <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">
            {viewMode === 'grid' ? (
              /* 卡片网格视图 */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {isLoading
                  ? // 加载骨架屏
                    [...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-[180px] rounded-2xl bg-surface-secondary animate-pulse"
                      />
                    ))
                  : filteredApps.map((app) => (
                      <AppCard
                        key={app.id}
                        data={app}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        selected={selectedIds.includes(app.id)}
                        onSelect={toggleSelect}
                        timeFormat={timeFormat}
                      />
                    ))}
              </div>
            ) : (
              /* 列表视图 */
              <AppListView
                data={filteredApps}
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
              <div className="px-6 py-4 flex items-center justify-between">
                <div
                  className="text-sm"
                  style={{ color: 'var(--color-components-pagination-text)' }}
                >
                  共 {total} 项
                  {selectedIds.length > 0 && ` • 已选择 ${selectedIds.length} 个`}
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
                      上一页
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
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages || totalPages === 0}
                    >
                      下一页
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
            <AlertDialogTitle>{STUDIO_TEXTS.deleteApp}</AlertDialogTitle>
            <AlertDialogDescription>
              {STUDIO_TEXTS.deleteAppConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{STUDIO_TEXTS.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-state-error hover:bg-state-error/90"
            >
              {STUDIO_TEXTS.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * 记忆库列表页面
 * 布局参考知识库管理页面，筛选组件保留 ListFilterBar 的 Popover 方式
 */

import React from 'react'
import { Plus, Grid, List as ListIcon, Database, MessageSquare, HardDrive, Zap, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
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
import {
  MemoryCard,
  MemoryListView,
  CreateMemoryDialog,
  MemoryStatsCard,
  MemoryEmptyState,
} from '@/components/memory'
import { useMemoryStore } from '@/stores/memory'
import {
  useMemoryList,
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
  useDebouncedSearch,
} from '@/hooks/use-memory'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import { MemoryType, type Memory, type CreateMemoryParams, type UpdateMemoryParams } from '@/types/memory'

export const MemoryListPage: React.FC = () => {
  // Store state
  const {
    filter,
    setFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    viewMode,
    setViewMode,
    createModalOpen,
    editingMemory,
    openCreateModal,
    closeCreateModal,
    openEditModal,
  } = useMemoryStore()

  // 搜索防抖
  const [searchInput, setSearchInput] = React.useState(filter.keywords)
  const debouncedSearch = useDebouncedSearch(searchInput)

  // 删除确认弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [memoryToDelete, setMemoryToDelete] = React.useState<Memory | null>(null)
  
  // 时间格式
  const [timeFormat, setTimeFormat] = React.useState<'detailed' | 'compact' | 'relative'>('detailed')
  const [sortDesc, setSortDesc] = React.useState(true)

  // 更新筛选条件（搜索词变化时）
  React.useEffect(() => {
    if (debouncedSearch !== filter.keywords) {
      setFilter({ keywords: debouncedSearch })
    }
  }, [debouncedSearch, filter.keywords, setFilter])

  // API hooks
  const { data, isLoading } = useMemoryList({
    page,
    page_size: pageSize,
    keywords: filter.keywords,
    memory_type: filter.memoryType.length > 0 ? filter.memoryType : undefined,
    storage_type: filter.storageType || undefined,
  })

  const createMutation = useCreateMemory()
  const updateMutation = useUpdateMemory()
  const deleteMutation = useDeleteMemory()

  // 记忆库列表
  const memories = data?.memory_list || []
  const total = data?.total_count || 0

  const sortedMemories = React.useMemo(() => {
    const getSortTime = (memory: Memory) => memory.update_time ?? memory.create_time ?? 0
    return [...memories].sort((a, b) => (
      sortDesc ? getSortTime(b) - getSortTime(a) : getSortTime(a) - getSortTime(b)
    ))
  }, [memories, sortDesc])

  // 统计数据（示例数据，实际应从 API 获取）
  const stats = {
    totalMemories: total,
    totalMessages: 1280,
    totalStorage: '45.6 MB',
    activeMemories: Math.floor(total * 0.8),
  }

  // 处理创建
  const handleCreate = (formData: CreateMemoryParams) => {
    createMutation.mutate(formData)
  }

  // 处理更新
  const handleUpdate = (id: string, data: UpdateMemoryParams) => {
    updateMutation.mutate({ id, data })
  }

  // 处理编辑
  const handleEdit = (memory: Memory) => {
    openEditModal(memory)
  }

  // 打开删除确认
  const handleDeleteClick = (memory: Memory) => {
    setMemoryToDelete(memory)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const handleConfirmDelete = () => {
    if (memoryToDelete) {
      deleteMutation.mutate(memoryToDelete.id)
    }
    setDeleteDialogOpen(false)
    setMemoryToDelete(null)
  }

  // 筛选器配置
  const filterConfigs: FilterConfig[] = [
    {
      key: 'memoryType',
      label: MEMORY_TEXTS.memories.memoryType,
      options: [
        { value: MemoryType.Raw, label: MEMORY_TEXTS.memories.raw },
        { value: MemoryType.Semantic, label: MEMORY_TEXTS.memories.semantic },
        { value: MemoryType.Episodic, label: MEMORY_TEXTS.memories.episodic },
        { value: MemoryType.Procedural, label: MEMORY_TEXTS.memories.procedural },
      ],
    },
  ]

  // 筛选值转换
  const filterValue: FilterValue = {
    memoryType: filter.memoryType,
  }

  // 处理筛选变化
  const handleFilterChange = (newValue: FilterValue) => {
    setFilter({ memoryType: (newValue.memoryType || []) as MemoryType[] })
  }

  // 判断是否显示空状态
  const showEmptyState = !isLoading && sortedMemories.length === 0
  const emptyStateType = filter.keywords ? 'search' : 'list'

  return (
    <div className="h-full flex flex-col p-6">
      {/* 页面头部 - 标题 + 创建按钮 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {MEMORY_TEXTS.memories.pageTitle}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {MEMORY_TEXTS.memories.pageDescription}
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          {MEMORY_TEXTS.memories.createMemory}
        </Button>
      </div>

      {/* 统计卡片 - 与知识库页面保持一致的布局 */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.totalMemories}
            value={stats.totalMemories}
            icon={Database}
            color="info"
          />
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.totalMessages}
            value={stats.totalMessages}
            icon={MessageSquare}
            color="success"
          />
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.totalStorage}
            value={stats.totalStorage}
            icon={HardDrive}
            color="info"
          />
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.activeMemories}
            value={stats.activeMemories}
            icon={Zap}
            color="warning"
          />
        </div>
      </div>

      {/* 搜索和筛选工具栏 */}
      <div className="flex items-center space-x-4 mb-4">
        {/* 左侧：搜索框 */}
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder={MEMORY_TEXTS.memories.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
              { value: 'detailed', label: '详细时间' },
              { value: 'compact', label: '简洁时间' },
              { value: 'relative', label: '相对时间' }
            ]}
            value={timeFormat}
            onChange={(value) => setTimeFormat(value as 'detailed' | 'compact' | 'relative')}
            size="sm"
            className="min-w-[100px]"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDesc((prev) => !prev)}
            className="h-9 px-2 flex items-center gap-1 text-xs"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{sortDesc ? '倒序' : '正序'}</span>
          </Button>
          
          {/* 视图切换 */}
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            size="md"
            options={[
              { value: 'grid', icon: <Grid />, label: '网格视图' },
              { value: 'list', icon: <ListIcon />, label: '列表视图' },
            ]}
          />
        </div>
      </div>

      {/* 内容区域 */}
      {showEmptyState ? (
        <div className="flex-1 flex items-center justify-center">
          <MemoryEmptyState type={emptyStateType} onAction={openCreateModal} />
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
                    [...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="h-[180px] rounded-lg bg-surface-secondary animate-pulse"
                      />
                    ))
                  : sortedMemories.map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        data={memory}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        timeFormat={timeFormat}
                      />
                    ))}
              </div>
            ) : (
              /* 列表视图 */
              <MemoryListView
                data={sortedMemories}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isLoading={isLoading}
                timeFormat={timeFormat}
              />
            )}
          </div>

          {/* 分页控件 - 固定在底部，参考知识库页面 */}
          {(() => {
            const totalPages = Math.ceil(total / pageSize)
            return totalPages > 0 ? (
              <div className="mt-4 rounded-lg border shadow-sm" style={{
                borderColor: 'var(--color-components-card-border)',
                backgroundColor: 'var(--color-components-card-bg)'
              }}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="text-sm" style={{ color: 'var(--color-components-pagination-text)' }}>
                    共 {total} 项
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
                        {Array.from({ length: Math.max(1, Math.min(7, totalPages)) }, (_, i) => {
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
                        })}
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
            ) : null
          })()}
        </>
      )}

      {/* 创建/编辑弹窗 */}
      <CreateMemoryDialog
        open={createModalOpen}
        onOpenChange={closeCreateModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isLoading={createMutation.isPending || updateMutation.isPending}
        initialData={editingMemory}
      />

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {MEMORY_TEXTS.memories.deleteMemory}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {MEMORY_TEXTS.memories.delMemoryWarn}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{MEMORY_TEXTS.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-state-error hover:bg-state-error/90"
            >
              {MEMORY_TEXTS.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

MemoryListPage.displayName = 'MemoryListPage'

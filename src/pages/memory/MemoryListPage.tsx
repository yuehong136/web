/**
 * 记忆库列表页面
 * 优化版本：使用 ListFilterBar 组件
 */

import React from 'react'
import { Plus, Grid, List, Database, MessageSquare, HardDrive, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { ListFilterBar, type FilterConfig, type FilterValue } from '@/components/ui/list-filter-bar'
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
  const showEmptyState = !isLoading && memories.length === 0
  const emptyStateType = filter.keywords ? 'search' : 'list'

  return (
    <div className="h-full flex flex-col bg-background-page">
      {/* 页面头部 - 统计卡片 */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-border-default bg-surface-primary">
        <div className="mb-4">
          <p className="text-sm text-text-secondary">
            {MEMORY_TEXTS.memories.pageDescription}
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.totalMemories}
            value={stats.totalMemories}
            icon={Database}
            gradient="blue"
          />
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.totalMessages}
            value={stats.totalMessages}
            icon={MessageSquare}
            gradient="green"
          />
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.totalStorage}
            value={stats.totalStorage}
            icon={HardDrive}
            gradient="purple"
          />
          <MemoryStatsCard
            title={MEMORY_TEXTS.memories.activeMemories}
            value={stats.activeMemories}
            icon={Zap}
            gradient="orange"
          />
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border-default bg-surface-primary">
        <ListFilterBar
          icon={<HardDrive className="h-5 w-5" />}
          title={MEMORY_TEXTS.memories.pageTitle}
          searchString={searchInput}
          onSearchChange={(e) => setSearchInput(e.target.value)}
          searchPlaceholder={MEMORY_TEXTS.memories.searchPlaceholder}
          filters={filterConfigs}
          filterValue={filterValue}
          onFilterChange={handleFilterChange}
        >
          {/* 视图切换 */}
          <div className="flex items-center rounded-lg border border-border-default p-1 bg-surface-secondary">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
              className="h-7 w-7"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 创建按钮 */}
          <Button onClick={openCreateModal} className="gap-2 h-9">
            <Plus className="h-4 w-4" />
            {MEMORY_TEXTS.memories.createMemory}
          </Button>
        </ListFilterBar>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {showEmptyState ? (
          <MemoryEmptyState type={emptyStateType} onAction={openCreateModal} />
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* 卡片网格视图 */
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading
                  ? // 加载骨架屏
                    [...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="h-[180px] rounded-lg bg-surface-secondary animate-pulse"
                      />
                    ))
                  : memories.map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        data={memory}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                      />
                    ))}
              </div>
            ) : (
              /* 列表视图 */
              <div className="bg-surface-primary rounded-lg border border-border-default overflow-hidden">
                <MemoryListView
                  data={memories}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* 分页 */}
            {total > pageSize && (
              <div className="flex items-center justify-between mt-6 px-2">
                <span className="text-sm text-text-tertiary">
                  共 {total} 条记录
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-text-secondary px-2">
                    {page} / {Math.ceil(total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / pageSize)}
                    onClick={() => setPage(page + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
              className="bg-red-500 hover:bg-red-600"
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

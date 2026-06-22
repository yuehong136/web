/**
 * 记忆库 UI 状态管理
 * 使用 Zustand 5.0 + Immer
 *
 * 仅持有客户端 UI 态（筛选/分页/视图/选择/弹窗）。服务端数据（记忆库列表、
 * 详情、消息列表）统一走 React Query（见 src/hooks/use-memory.ts），不在此缓存。
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  Memory,
  MemoryFilterState,
  MessageFilterState,
} from '@/types/memory'

// ============ 状态类型 ============

interface MemoryState {
  // 筛选状态
  filter: MemoryFilterState

  // 分页状态
  page: number
  pageSize: number

  // 视图状态
  viewMode: 'grid' | 'list'

  // 选中状态（用于批量操作）
  selectedIds: string[]

  // 消息列表 UI 状态
  messageFilter: MessageFilterState
  messagePage: number
  messagePageSize: number

  // 弹窗状态
  createModalOpen: boolean
  editingMemory: Memory | null
}

interface MemoryActions {
  // 筛选操作
  setFilter: (filter: Partial<MemoryFilterState>) => void
  resetFilter: () => void

  // 分页操作
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void

  // 视图操作
  setViewMode: (mode: 'grid' | 'list') => void

  // 选中操作
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void

  // 消息列表 UI 操作
  setMessageFilter: (filter: Partial<MessageFilterState>) => void
  resetMessageFilter: () => void
  setMessagePage: (page: number) => void
  setMessagePageSize: (pageSize: number) => void

  // 弹窗操作
  openCreateModal: () => void
  closeCreateModal: () => void
  openEditModal: (memory: Memory) => void
  closeEditModal: () => void

  // 重置
  reset: () => void
}

// ============ 初始状态 ============

const initialFilterState: MemoryFilterState = {
  keywords: '',
  memoryType: [],
  storageType: '',
  tenantId: [],
}

const initialMessageFilterState: MessageFilterState = {
  keywords: '',
  agentId: [],
}

const initialState: MemoryState = {
  filter: initialFilterState,
  page: 1,
  pageSize: 12,
  viewMode: 'grid',
  selectedIds: [],
  messageFilter: initialMessageFilterState,
  messagePage: 1,
  messagePageSize: 20,
  createModalOpen: false,
  editingMemory: null,
}

// ============ Store 创建 ============

export const useMemoryStore = create<MemoryState & MemoryActions>()(
  immer((set) => ({
    ...initialState,

    // 筛选操作
    setFilter: (filter) =>
      set((state) => {
        Object.assign(state.filter, filter)
        state.page = 1 // 重置分页
      }),

    resetFilter: () =>
      set((state) => {
        state.filter = initialFilterState
        state.page = 1
      }),

    // 分页操作
    setPage: (page) =>
      set((state) => {
        state.page = page
      }),

    setPageSize: (pageSize) =>
      set((state) => {
        state.pageSize = pageSize
        state.page = 1 // 重置到第一页
      }),

    // 视图操作
    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode
      }),

    // 选中操作
    toggleSelect: (id) =>
      set((state) => {
        const index = state.selectedIds.indexOf(id)
        if (index === -1) {
          state.selectedIds.push(id)
        } else {
          state.selectedIds.splice(index, 1)
        }
      }),

    selectAll: (ids) =>
      set((state) => {
        state.selectedIds = ids
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedIds = []
      }),

    // 消息列表 UI 操作
    setMessageFilter: (filter) =>
      set((state) => {
        Object.assign(state.messageFilter, filter)
        state.messagePage = 1
      }),

    resetMessageFilter: () =>
      set((state) => {
        state.messageFilter = initialMessageFilterState
        state.messagePage = 1
      }),

    setMessagePage: (page) =>
      set((state) => {
        state.messagePage = page
      }),

    setMessagePageSize: (pageSize) =>
      set((state) => {
        state.messagePageSize = pageSize
        state.messagePage = 1
      }),

    // 弹窗操作
    openCreateModal: () =>
      set((state) => {
        state.createModalOpen = true
        state.editingMemory = null
      }),

    closeCreateModal: () =>
      set((state) => {
        state.createModalOpen = false
      }),

    openEditModal: (memory) =>
      set((state) => {
        state.editingMemory = memory
        state.createModalOpen = true
      }),

    closeEditModal: () =>
      set((state) => {
        state.editingMemory = null
        state.createModalOpen = false
      }),

    // 重置
    reset: () => set(initialState),
  })),
)

// ============ 选择器 ============

// 获取是否有活跃筛选
export const useHasActiveFilters = () =>
  useMemoryStore((state) => {
    const { keywords, memoryType, storageType, tenantId } = state.filter
    return !!(
      keywords ||
      memoryType.length > 0 ||
      storageType ||
      tenantId.length > 0
    )
  })

// 获取选中数量
export const useSelectedCount = () =>
  useMemoryStore((state) => state.selectedIds.length)

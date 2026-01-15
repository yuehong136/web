/**
 * 记忆库状态管理
 * 使用 Zustand 5.0 + Immer
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  Memory,
  MemoryMessage,
  MemoryFilterState,
  MessageFilterState,
  MemoryType,
  StorageType,
  PermissionType,
} from '@/types/memory'

// ============ 状态类型 ============

interface MemoryState {
  // 列表页状态
  memories: Memory[]
  total: number
  isLoading: boolean
  
  // 筛选状态
  filter: MemoryFilterState
  
  // 分页状态
  page: number
  pageSize: number
  
  // 视图状态
  viewMode: 'grid' | 'list'
  
  // 选中状态（用于批量操作）
  selectedIds: string[]
  
  // 当前记忆库详情
  currentMemory: Memory | null
  
  // 消息列表状态
  messages: MemoryMessage[]
  messagesTotal: number
  messagesLoading: boolean
  messageFilter: MessageFilterState
  messagePage: number
  messagePageSize: number
  
  // 弹窗状态
  createModalOpen: boolean
  editingMemory: Memory | null
}

interface MemoryActions {
  // 列表操作
  setMemories: (memories: Memory[], total: number) => void
  setLoading: (loading: boolean) => void
  
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
  
  // 当前记忆库操作
  setCurrentMemory: (memory: Memory | null) => void
  updateCurrentMemory: (updates: Partial<Memory>) => void
  
  // 消息操作
  setMessages: (messages: MemoryMessage[], total: number) => void
  setMessagesLoading: (loading: boolean) => void
  setMessageFilter: (filter: Partial<MessageFilterState>) => void
  resetMessageFilter: () => void
  setMessagePage: (page: number) => void
  setMessagePageSize: (pageSize: number) => void
  updateMessageStatus: (messageId: string, status: boolean) => void
  removeMessage: (messageId: string) => void
  
  // 弹窗操作
  openCreateModal: () => void
  closeCreateModal: () => void
  openEditModal: (memory: Memory) => void
  closeEditModal: () => void
  
  // CRUD 后的列表更新
  addMemory: (memory: Memory) => void
  updateMemory: (id: string, updates: Partial<Memory>) => void
  removeMemory: (id: string) => void
  
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
  messageType: [],
  status: null,
}

const initialState: MemoryState = {
  memories: [],
  total: 0,
  isLoading: false,
  filter: initialFilterState,
  page: 1,
  pageSize: 12,
  viewMode: 'grid',
  selectedIds: [],
  currentMemory: null,
  messages: [],
  messagesTotal: 0,
  messagesLoading: false,
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

    // 列表操作
    setMemories: (memories, total) =>
      set((state) => {
        state.memories = memories
        state.total = total
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading
      }),

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

    // 当前记忆库操作
    setCurrentMemory: (memory) =>
      set((state) => {
        state.currentMemory = memory
      }),

    updateCurrentMemory: (updates) =>
      set((state) => {
        if (state.currentMemory) {
          Object.assign(state.currentMemory, updates)
        }
      }),

    // 消息操作
    setMessages: (messages, total) =>
      set((state) => {
        state.messages = messages
        state.messagesTotal = total
      }),

    setMessagesLoading: (loading) =>
      set((state) => {
        state.messagesLoading = loading
      }),

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

    updateMessageStatus: (messageId, status) =>
      set((state) => {
        const message = state.messages.find((m) => m.id === messageId)
        if (message) {
          message.status = status
        }
      }),

    removeMessage: (messageId) =>
      set((state) => {
        state.messages = state.messages.filter((m) => m.id !== messageId)
        state.messagesTotal -= 1
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

    // CRUD 后的列表更新
    addMemory: (memory) =>
      set((state) => {
        state.memories.unshift(memory)
        state.total += 1
      }),

    updateMemory: (id, updates) =>
      set((state) => {
        const index = state.memories.findIndex((m) => m.id === id)
        if (index !== -1) {
          Object.assign(state.memories[index], updates)
        }
        // 同步更新 currentMemory
        if (state.currentMemory?.id === id) {
          Object.assign(state.currentMemory, updates)
        }
      }),

    removeMemory: (id) =>
      set((state) => {
        state.memories = state.memories.filter((m) => m.id !== id)
        state.total -= 1
        state.selectedIds = state.selectedIds.filter((i) => i !== id)
        if (state.currentMemory?.id === id) {
          state.currentMemory = null
        }
      }),

    // 重置
    reset: () => set(initialState),
  }))
)

// ============ 选择器 ============

// 获取筛选后的记忆库数量
export const useFilteredCount = () =>
  useMemoryStore((state) => state.total)

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

// 获取是否全选
export const useIsAllSelected = () =>
  useMemoryStore((state) =>
    state.memories.length > 0 &&
    state.selectedIds.length === state.memories.length
  )

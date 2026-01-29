/**
 * 工作室状态管理
 * 使用 Zustand 5.0 + Immer
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DialogApp } from '@/types/api'

// ============ 状态类型 ============

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

interface StudioFilterState {
  keywords: string
  status: string[] // '0' 未启用, '1' 已启用
}

interface StudioState {
  // 筛选状态
  filter: StudioFilterState

  // 分页状态
  page: number
  pageSize: number

  // 视图状态
  viewMode: 'grid' | 'list'
  timeFormat: TimeFormatType

  // 选中状态（用于批量操作）
  selectedIds: string[]

  // 弹窗状态
  projectTypeModalOpen: boolean
  createAppModalOpen: boolean
  editingApp: DialogApp | null
}

interface StudioActions {
  // 筛选操作
  setFilter: (filter: Partial<StudioFilterState>) => void
  resetFilter: () => void

  // 分页操作
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void

  // 视图操作
  setViewMode: (mode: 'grid' | 'list') => void
  setTimeFormat: (format: TimeFormatType) => void

  // 选中操作
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void

  // 弹窗操作
  openProjectTypeModal: () => void
  closeProjectTypeModal: () => void
  openCreateAppModal: () => void
  closeCreateAppModal: () => void
  openEditModal: (app: DialogApp) => void
  closeEditModal: () => void

  // 重置
  reset: () => void
}

// ============ 初始状态 ============

const initialFilterState: StudioFilterState = {
  keywords: '',
  status: [],
}

const initialState: StudioState = {
  filter: initialFilterState,
  page: 1,
  pageSize: 12,
  viewMode: 'grid',
  timeFormat: 'detailed',
  selectedIds: [],
  projectTypeModalOpen: false,
  createAppModalOpen: false,
  editingApp: null,
}

// ============ Store 创建 ============

export const useStudioStore = create<StudioState & StudioActions>()(
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

    setTimeFormat: (format) =>
      set((state) => {
        state.timeFormat = format
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

    // 弹窗操作
    openProjectTypeModal: () =>
      set((state) => {
        state.projectTypeModalOpen = true
      }),

    closeProjectTypeModal: () =>
      set((state) => {
        state.projectTypeModalOpen = false
      }),

    openCreateAppModal: () =>
      set((state) => {
        state.createAppModalOpen = true
        state.projectTypeModalOpen = false
        state.editingApp = null
      }),

    closeCreateAppModal: () =>
      set((state) => {
        state.createAppModalOpen = false
      }),

    openEditModal: (app) =>
      set((state) => {
        state.editingApp = app
        state.createAppModalOpen = true
      }),

    closeEditModal: () =>
      set((state) => {
        state.editingApp = null
        state.createAppModalOpen = false
      }),

    // 重置
    reset: () => set(initialState),
  }))
)

// ============ 选择器 ============

// 获取是否有活跃筛选
export const useHasActiveFilters = () =>
  useStudioStore((state) => {
    const { keywords, status } = state.filter
    return !!(keywords || status.length > 0)
  })

// 获取选中数量
export const useSelectedCount = () =>
  useStudioStore((state) => state.selectedIds.length)

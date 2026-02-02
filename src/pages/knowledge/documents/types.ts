/**
 * 文档列表页面类型定义
 */

import type { Document, IDocumentInfoFilter } from '@/types/api'

// 筛选器类型定义 - 参照 ragflow 的 interface.ts
export interface FilterType {
  id: string
  field?: string
  label: string
  list?: FilterType[]
  value?: string | string[]
  count?: number
}

export interface FilterCollection {
  field: string
  label: string
  list: FilterType[]
}

// 筛选值类型 - 支持嵌套的 metadata 筛选
export type FilterValue = Record<string, string[] | Record<string, string[]>>

// 排序配置
export interface SortConfig {
  orderby: string
  desc: boolean
}

// 分页状态
export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// 文档列表状态 (hooks 返回值)
export interface DocumentListState {
  // 数据
  documents: Document[]
  total: number
  isLoading: boolean
  isError: boolean

  // 筛选选项
  filterOptions: IDocumentInfoFilter | null
  filterOptionsLoading: boolean

  // UI 状态
  searchKeywords: string
  debouncedKeywords: string
  filterValue: FilterValue
  sortConfig: SortConfig
  selectedDocs: Set<string>
  page: number
  pageSize: number

  // 计算属性
  filterCount: number
  hasActiveFilters: boolean
  allSelected: boolean
  selectedDocuments: Document[]

  // 操作方法
  setSearchKeywords: (keywords: string) => void
  setFilterValue: (value: FilterValue) => void
  setSortConfig: (config: SortConfig) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void

  // 选择操作
  selectDoc: (docId: string, checked: boolean) => void
  selectAll: (checked: boolean) => void
  clearSelection: () => void

  // 筛选操作
  clearAllFilters: () => void
  refreshFilterOptions: () => void

  // 数据操作
  refetch: () => void
}

// 文档操作处理器
export interface DocumentActionHandlers {
  onStartParse: (doc: Document) => void
  onStopParse: (doc: Document) => void
  onToggleStatus: (doc: Document) => void
  onRename: (doc: Document) => void
  onDownload: (doc: Document) => void
  onDelete: (doc: Document) => void
  onViewChunks: (doc: Document) => void
  onEditMetadata: (doc: Document) => void
}

// 批量操作处理器
export interface BulkActionHandlers {
  onBulkEnable: () => void
  onBulkDisable: () => void
  onBulkStartParse: () => void
  onBulkStopParse: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
}

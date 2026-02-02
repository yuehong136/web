/**
 * 文档列表页面 Hooks
 *
 * 整合 TanStack Query hooks，管理本地 UI 状态
 */

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useFetchDocumentList,
  useFetchDocumentFilter,
  useRunDocument,
  useChangeDocumentStatus,
  useRenameDocument,
  useDeleteDocument,
  useDownloadDocument,
} from '@/hooks/use-document-request'
import { toast } from '@/lib/toast'
import type { Document, DocumentFilter } from '@/types/api'
import type {
  FilterValue,
  SortConfig,
  FilterCollection,
  FilterType,
  DocumentListState,
} from './types'
import {
  DEFAULT_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  EMPTY_METADATA_FIELD,
  runStatusOptions,
} from './constants'

/**
 * 文档列表状态管理 Hook
 */
export function useDocumentListState(): DocumentListState {
  const { id: kbId } = useParams<{ id: string }>()

  // UI 状态
  const [searchKeywords, setSearchKeywords] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    orderby: 'create_time',
    desc: true,
  })
  const [filterValue, setFilterValue] = useState<FilterValue>({
    type: [],
    run: [],
    metadata: {},
  })
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())

  // 防抖搜索
  const debouncedKeywords = useDebouncedValue(searchKeywords, SEARCH_DEBOUNCE_MS)

  // 将 filterValue 转换为 API 需要的 DocumentFilter 格式
  const documentFilter = useMemo((): DocumentFilter => {
    const typeValues = (filterValue.type as string[]) || []
    const rawRunValues = (filterValue.run as string[]) || []
    const metadataValues =
      (filterValue.metadata as Record<string, string[]>) || {}

    // 处理"无元数据"特殊筛选值
    let returnEmptyMetadata = false
    const runValues = rawRunValues.filter((value) => {
      if (value === EMPTY_METADATA_FIELD) {
        returnEmptyMetadata = true
        return false
      }
      return true
    })

    return {
      suffix: typeValues.length > 0 ? typeValues : undefined,
      run_status: runValues.length > 0 ? runValues : undefined,
      metadata: Object.keys(metadataValues).length > 0 ? metadataValues : undefined,
      return_empty_metadata: returnEmptyMetadata || undefined,
    }
  }, [filterValue])

  // 获取文档列表 (使用智能轮询)
  const {
    documents,
    total,
    isLoading,
    isError,
    refetch,
  } = useFetchDocumentList({
    knowledgeBaseId: kbId,
    page,
    page_size: pageSize,
    keywords: debouncedKeywords,
    orderby: sortConfig.orderby,
    desc: sortConfig.desc,
    filter_params: documentFilter,
    enableSmartPolling: true,
  })

  // 获取筛选选项
  const {
    filterOptions,
    isLoading: filterOptionsLoading,
    refetch: refreshFilterOptions,
  } = useFetchDocumentFilter(kbId)

  // 计算筛选数量
  const filterCount = useMemo(() => {
    return typeof filterValue === 'object' && filterValue !== null
      ? Object.values(filterValue).reduce((pre, cur) => {
          if (Array.isArray(cur)) {
            return pre + cur.length
          }
          if (typeof cur === 'object') {
            return pre + Object.values(cur).reduce((innerPre, innerCur) => {
              return innerPre + (innerCur?.length || 0)
            }, 0)
          }
          return pre
        }, 0)
      : 0
  }, [filterValue])

  // 检查是否有活动的筛选条件
  const hasActiveFilters = filterCount > 0 || searchKeywords.trim() !== ''

  // 全选状态
  const allSelected = documents.length > 0 && selectedDocs.size === documents.length

  // 获取选中的文档对象
  const selectedDocuments = useMemo(() => {
    return documents.filter((doc) => selectedDocs.has(doc.id))
  }, [documents, selectedDocs])

  // 选择文档
  const selectDoc = useCallback((docId: string, checked: boolean) => {
    setSelectedDocs((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(docId)
      } else {
        newSet.delete(docId)
      }
      return newSet
    })
  }, [])

  // 全选/取消全选
  const selectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedDocs(new Set(documents.map((doc) => doc.id)))
      } else {
        setSelectedDocs(new Set())
      }
    },
    [documents]
  )

  // 清除选择
  const clearSelection = useCallback(() => {
    setSelectedDocs(new Set())
  }, [])

  // 清除所有筛选条件
  const clearAllFilters = useCallback(() => {
    setFilterValue({
      type: [],
      run: [],
      metadata: {},
    })
    setSearchKeywords('')
    setPage(1)
  }, [])

  // 当筛选条件变化时重置页码
  const handleSetFilterValue = useCallback((value: FilterValue) => {
    setFilterValue(value)
    setPage(1)
  }, [])

  // 当搜索关键词变化时重置页码
  const handleSetSearchKeywords = useCallback((keywords: string) => {
    setSearchKeywords(keywords)
    setPage(1)
  }, [])

  return {
    // 数据
    documents,
    total,
    isLoading,
    isError,

    // 筛选选项
    filterOptions,
    filterOptionsLoading,

    // UI 状态
    searchKeywords,
    debouncedKeywords,
    filterValue,
    sortConfig,
    selectedDocs,
    page,
    pageSize,

    // 计算属性
    filterCount,
    hasActiveFilters,
    allSelected,
    selectedDocuments,

    // 操作方法
    setSearchKeywords: handleSetSearchKeywords,
    setFilterValue: handleSetFilterValue,
    setSortConfig,
    setPage,
    setPageSize,

    // 选择操作
    selectDoc,
    selectAll,
    clearSelection,

    // 筛选操作
    clearAllFilters,
    refreshFilterOptions,

    // 数据操作
    refetch,
  }
}

/**
 * 构建筛选器列表 - 参照 ragflow 的 use-select-filters.ts
 */
export function useFilterCollections(
  filterOptions: DocumentListState['filterOptions']
): FilterCollection[] {
  return useMemo<FilterCollection[]>(() => {
    if (!filterOptions) {
      return [
        { field: 'type', label: '文件类型', list: [] },
        { field: 'run', label: '任务状态', list: runStatusOptions.map((o) => ({ id: o.value, label: o.label })) },
        { field: 'metadata', label: '元数据', list: [] },
      ]
    }

    // 从后端数据构建 fileTypes
    const fileTypes: FilterType[] = filterOptions.suffix
      ? Object.entries(filterOptions.suffix).map(([suffix, count]) => ({
          id: suffix,
          label: suffix.toUpperCase(),
          count,
        }))
      : []

    // 从后端数据构建 fileStatus（包含运行状态 + 无元数据筛选）
    const fileStatus: FilterType[] = []

    // 添加运行状态选项
    if (filterOptions.run_status) {
      Object.entries(filterOptions.run_status).forEach(([status, count]) => {
        fileStatus.push({
          id: status,
          label:
            runStatusOptions.find((o) => o.value === status)?.label ||
            `状态${status}`,
          count,
        })
      })
    }

    // 添加"无元数据"筛选选项
    const emptyMetadataInfo = filterOptions.metadata?.[EMPTY_METADATA_FIELD]
    if (emptyMetadataInfo) {
      const emptyCount = emptyMetadataInfo['true'] ?? 0
      if (emptyCount > 0) {
        fileStatus.push({
          id: EMPTY_METADATA_FIELD,
          label: '无元数据',
          count: emptyCount,
        })
      }
    }

    // 从后端数据构建 metaDataList - 嵌套结构
    const metaDataList: FilterType[] = filterOptions.metadata
      ? Object.entries(filterOptions.metadata)
          .filter(([fieldName]) => fieldName !== EMPTY_METADATA_FIELD)
          .map(([fieldName, fieldValues]) => ({
            id: fieldName,
            field: fieldName,
            label: fieldName,
            list: Object.entries(fieldValues).map(([value, count]) => ({
              id: value,
              field: value,
              label: value,
              value: [value],
              count,
            })),
            count: Object.values(fieldValues).reduce((acc, c) => acc + c, 0),
          }))
      : []

    return [
      { field: 'type', label: '文件类型', list: fileTypes },
      { field: 'run', label: '任务状态', list: fileStatus },
      { field: 'metadata', label: '元数据', list: metaDataList },
    ]
  }, [filterOptions])
}

/**
 * 筛选器分组配置
 */
export function useFilterGroup(): Record<string, string[]> {
  return useMemo(
    () => ({
      系统属性: ['type', 'run'],
    }),
    []
  )
}

/**
 * 文档操作 Hooks
 */
export function useDocumentActions(
  kbId: string | undefined,
  onSuccess?: () => void
) {
  const { runDocument, isLoading: isRunning } = useRunDocument()
  const { changeStatus, isLoading: isChangingStatus } = useChangeDocumentStatus()
  const { renameDocument, isLoading: isRenaming } = useRenameDocument()
  const { deleteDocument, isLoading: isDeleting } = useDeleteDocument()
  const { downloadDocument, isLoading: isDownloading } = useDownloadDocument()

  // 开始解析
  const handleStartParse = useCallback(
    async (docIds: string[], deleteHistory = false) => {
      try {
        await runDocument({ docIds, run: 1, deleteHistory })
        toast.success(`已开始解析 ${docIds.length} 个文档`)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to start parsing:', error)
        toast.error('开始解析失败，请重试')
      }
    },
    [runDocument, onSuccess]
  )

  // 停止解析
  const handleStopParse = useCallback(
    async (docIds: string[]) => {
      try {
        await runDocument({ docIds, run: 0 })
        toast.success(`已停止 ${docIds.length} 个文档的解析`)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to stop parsing:', error)
        toast.error('停止任务失败')
      }
    },
    [runDocument, onSuccess]
  )

  // 切换启用状态
  const handleToggleStatus = useCallback(
    async (doc: Document) => {
      const newStatus = doc.status === '1' ? 0 : 1
      try {
        const result = await changeStatus({ docIds: [doc.id], status: newStatus as 0 | 1 })
        const docResult = result[doc.id]
        if (docResult?.error) {
          toast.error(`状态切换失败: ${docResult.error}`)
          return
        }
        toast.success(`文档已${newStatus === 1 ? '启用' : '禁用'}`)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to toggle document status:', error)
        toast.error('状态切换失败，请重试')
      }
    },
    [changeStatus, onSuccess]
  )

  // 批量启用
  const handleBulkEnable = useCallback(
    async (docIds: string[]) => {
      try {
        const result = await changeStatus({ docIds, status: 1 })
        let successCount = 0
        let errorCount = 0
        Object.values(result).forEach((res) => {
          if (res.error) {
            errorCount++
          } else {
            successCount++
          }
        })
        if (errorCount > 0) {
          toast.warning(`批量启用完成: 成功 ${successCount} 个，失败 ${errorCount} 个`)
        } else {
          toast.success(`成功启用 ${successCount} 个文档`)
        }
        onSuccess?.()
      } catch (error) {
        console.error('Failed to enable documents:', error)
        toast.error('批量启用失败，请重试')
      }
    },
    [changeStatus, onSuccess]
  )

  // 批量禁用
  const handleBulkDisable = useCallback(
    async (docIds: string[]) => {
      try {
        const result = await changeStatus({ docIds, status: 0 })
        let successCount = 0
        let errorCount = 0
        Object.values(result).forEach((res) => {
          if (res.error) {
            errorCount++
          } else {
            successCount++
          }
        })
        if (errorCount > 0) {
          toast.warning(`批量禁用完成: 成功 ${successCount} 个，失败 ${errorCount} 个`)
        } else {
          toast.success(`成功禁用 ${successCount} 个文档`)
        }
        onSuccess?.()
      } catch (error) {
        console.error('Failed to disable documents:', error)
        toast.error('批量禁用失败，请重试')
      }
    },
    [changeStatus, onSuccess]
  )

  // 重命名
  const handleRename = useCallback(
    async (docId: string, newName: string) => {
      try {
        await renameDocument({ docId, name: newName })
        toast.success('文档已重命名')
        onSuccess?.()
      } catch (error) {
        console.error('Failed to rename document:', error)
        toast.error('重命名失败，请重试')
      }
    },
    [renameDocument, onSuccess]
  )

  // 下载
  const handleDownload = useCallback(
    async (doc: Document) => {
      try {
        await downloadDocument({ docId: doc.id, filename: doc.name })
      } catch (error) {
        console.error('Failed to download document:', error)
        toast.error('下载失败，请重试')
      }
    },
    [downloadDocument]
  )

  // 删除
  const handleDelete = useCallback(
    async (docIds: string[]) => {
      try {
        await deleteDocument(docIds)
        toast.success(`成功删除 ${docIds.length} 个文档`)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to delete documents:', error)
        toast.error('删除失败，请重试')
      }
    },
    [deleteDocument, onSuccess]
  )

  return {
    // 单文档操作
    handleStartParse,
    handleStopParse,
    handleToggleStatus,
    handleRename,
    handleDownload,
    handleDelete,
    // 批量操作
    handleBulkEnable,
    handleBulkDisable,
    // 加载状态
    isRunning,
    isChangingStatus,
    isRenaming,
    isDeleting,
    isDownloading,
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * 格式化日期
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

import { useCallback, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'
import { LogTabType, DEFAULT_PAGE_SIZE } from './constants'

// 分页状态接口
interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// 筛选值类型
interface FilterValue {
  operation_status?: string[]
}

/**
 * 获取知识库日志统计信息
 */
export function useFetchLogStats() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['logStats', id],
    queryFn: async () => {
      if (!id) return null
      return knowledgeAPI.logs.getBasicInfo(id)
    },
    enabled: !!id,
    staleTime: 30000, // 30秒缓存
  })

  return {
    data: data || {
      cancelled: 0,
      failed: 0,
      finished: 0,
      processing: 0,
      downloaded: 0,
    },
    isLoading,
    error,
    refetch,
  }
}

/**
 * 获取文件日志列表
 */
export function useFetchFileLogs(enabled: boolean = true) {
  const { id } = useParams<{ id: string }>()
  
  // 搜索关键词
  const [searchString, setSearchString] = useState('')
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  })

  // 筛选值
  const [filterValue, setFilterValue] = useState<FilterValue>({})

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fileLogs', id, pagination.page, pagination.pageSize, searchString, filterValue],
    queryFn: async () => {
      if (!id) return { logs: [], total: 0 }
      return knowledgeAPI.logs.listFileLogs({
        kb_id: id,
        page: pagination.page,
        page_size: pagination.pageSize,
        keywords: searchString,
        operation_status: filterValue.operation_status,
      })
    },
    enabled: !!id && enabled,
    placeholderData: (prev) => prev || { logs: [], total: 0 },
  })

  // 更新分页状态
  const handlePaginationChange = useCallback((newPage: number, newPageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
      pageSize: newPageSize || prev.pageSize,
    }))
  }, [])

  // 处理搜索输入
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 })) // 搜索时重置到第一页
  }, [])

  // 处理筛选提交
  const handleFilterSubmit = useCallback((value: FilterValue) => {
    setFilterValue(value)
    setPagination(prev => ({ ...prev, page: 1 })) // 筛选时重置到第一页
  }, [])

  return {
    data: data || { logs: [], total: 0 },
    isLoading,
    error,
    refetch,
    searchString,
    handleSearchChange,
    pagination: {
      ...pagination,
      total: data?.total || 0,
    },
    handlePaginationChange,
    filterValue,
    setFilterValue,
    handleFilterSubmit,
  }
}

/**
 * 获取数据集日志列表
 */
export function useFetchDatasetLogs(enabled: boolean = true) {
  const { id } = useParams<{ id: string }>()
  
  // 搜索关键词
  const [searchString, setSearchString] = useState('')
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  })

  // 筛选值
  const [filterValue, setFilterValue] = useState<FilterValue>({})

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['datasetLogs', id, pagination.page, pagination.pageSize, searchString, filterValue],
    queryFn: async () => {
      if (!id) return { logs: [], total: 0 }
      return knowledgeAPI.logs.listDatasetLogs({
        kb_id: id,
        page: pagination.page,
        page_size: pagination.pageSize,
        keywords: searchString,
        operation_status: filterValue.operation_status,
      })
    },
    enabled: !!id && enabled,
    placeholderData: (prev) => prev || { logs: [], total: 0 },
  })

  // 更新分页状态
  const handlePaginationChange = useCallback((newPage: number, newPageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
      pageSize: newPageSize || prev.pageSize,
    }))
  }, [])

  // 处理搜索输入
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // 处理筛选提交
  const handleFilterSubmit = useCallback((value: FilterValue) => {
    setFilterValue(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  return {
    data: data || { logs: [], total: 0 },
    isLoading,
    error,
    refetch,
    searchString,
    handleSearchChange,
    pagination: {
      ...pagination,
      total: data?.total || 0,
    },
    handlePaginationChange,
    filterValue,
    setFilterValue,
    handleFilterSubmit,
  }
}

/**
 * 统一的日志数据获取 Hook
 * 根据当前 Tab 切换获取对应的日志数据
 */
export function useFetchLogs(activeTab: LogTabType) {
  const fileLogsHook = useFetchFileLogs(activeTab === LogTabType.FILE_LOGS)
  const datasetLogsHook = useFetchDatasetLogs(activeTab === LogTabType.DATASET_LOGS)

  return useMemo(() => {
    if (activeTab === LogTabType.FILE_LOGS) {
      return fileLogsHook
    }
    return datasetLogsHook
  }, [activeTab, fileLogsHook, datasetLogsHook])
}

/**
 * 格式化时间为人类可读格式
 */
export function formatSecondsToHumanReadable(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`
}

/**
 * 格式化日期时间
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateString
  }
}


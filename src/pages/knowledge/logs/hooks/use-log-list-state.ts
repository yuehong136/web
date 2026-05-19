import { useCallback, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'
import { DEFAULT_PAGE_SIZE, LogTabType } from '../constants'
import type { LogFilterValue, LogListState, PaginationState } from '../types'

const EMPTY_LOG_LIST = { logs: [], total: 0 }

export function useLogListState(
  tab: LogTabType,
  enabled: boolean = true,
): LogListState {
  const { id } = useParams<{ id: string }>()
  const [searchString, setSearchString] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  })
  const [filterValue, setFilterValue] = useState<LogFilterValue>({})

  const queryKeyPrefix =
    tab === LogTabType.FILE_LOGS ? 'fileLogs' : 'datasetLogs'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      queryKeyPrefix,
      id,
      pagination.page,
      pagination.pageSize,
      searchString,
      filterValue,
    ],
    queryFn: async () => {
      if (!id) return EMPTY_LOG_LIST
      const params = {
        kb_id: id,
        page: pagination.page,
        page_size: pagination.pageSize,
        keywords: searchString,
        operation_status: filterValue.operation_status,
      }
      return tab === LogTabType.FILE_LOGS
        ? knowledgeAPI.logs.listFileLogs(params)
        : knowledgeAPI.logs.listDatasetLogs(params)
    },
    enabled: !!id && enabled,
    placeholderData: (prev) => prev || EMPTY_LOG_LIST,
  })

  const handlePaginationChange = useCallback(
    (newPage: number, newPageSize?: number) => {
      setPagination((prev) => ({
        ...prev,
        page: newPage,
        pageSize: newPageSize || prev.pageSize,
      }))
    },
    [],
  )

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchString(event.target.value)
      setPagination((prev) => ({ ...prev, page: 1 }))
    },
    [],
  )

  const handleFilterSubmit = useCallback((value: LogFilterValue) => {
    setFilterValue(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  return {
    data: data || EMPTY_LOG_LIST,
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

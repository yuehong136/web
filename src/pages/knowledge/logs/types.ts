import type { ChangeEvent } from 'react'
import type { IFileLogItem } from '@/types/api'
import type { LogTabType } from './constants'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface LogFilterValue {
  operation_status?: string[]
}

export interface LogTableItem extends Partial<IFileLogItem> {
  id: string
  operation_status: string
  status?: string
  statusName?: string
}

export interface LogListState {
  data: {
    logs: LogTableItem[]
    total: number
  }
  isLoading: boolean
  error: Error | null
  refetch: () => void
  searchString: string
  handleSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
  pagination: PaginationState
  handlePaginationChange: (page: number, pageSize?: number) => void
  filterValue: LogFilterValue
  setFilterValue: (value: LogFilterValue) => void
  handleFilterSubmit: (value: LogFilterValue) => void
}

export interface LogDetailModalState {
  open: boolean
  selectedLog: LogTableItem | null
  activeTab: LogTabType
  openDetail: (item: LogTableItem) => void
  closeDetail: () => void
}

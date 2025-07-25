import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Loading } from "./loading"

export interface Column<T = any> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => React.ReactNode
  width?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  fixed?: 'left' | 'right'
  className?: string
}

export interface TableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  className?: string
  rowKey?: keyof T | ((record: T) => string)
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    showTotal?: boolean
  }
  sortConfig?: {
    field: string
    direction: 'asc' | 'desc'
  }
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  emptyText?: string
  size?: 'small' | 'default' | 'large'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  className,
  rowKey = 'id',
  onRow,
  pagination,
  sortConfig,
  onSort,
  emptyText = '暂无数据',
  size = 'default',
  bordered = false,
  striped = false,
  hoverable = true,
}: TableProps<T>) => {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return String(record[rowKey] || index)
  }

  const handleSort = (field: string) => {
    if (!onSort) return
    
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig?.field === field && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    onSort(field, direction)
  }

  const renderSortIcon = (field: string) => {
    if (sortConfig?.field !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const sizeClasses = {
    small: 'text-sm',
    default: '',
    large: 'text-base',
  }

  const cellPadding = {
    small: 'px-3 py-2',
    default: 'px-4 py-3',
    large: 'px-6 py-4',
  }

  return (
    <div className={cn("relative", className)}>
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <Loading text="加载中..." />
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className={cn(
          "min-w-full divide-y divide-gray-200",
          bordered && "border border-gray-200",
          sizeClasses[size]
        )}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    cellPadding[size],
                    "text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right",
                    column.sortable && "cursor-pointer hover:bg-gray-100",
                    bordered && "border-r border-gray-200 last:border-r-0",
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center">
                    {column.title}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(
            "bg-white divide-y divide-gray-200",
            striped && "divide-gray-100"
          )}>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(cellPadding[size], "text-center text-gray-500")}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => {
                const rowProps = onRow?.(record, index) || {}
                return (
                  <tr
                    key={getRowKey(record, index)}
                    className={cn(
                      striped && index % 2 === 1 && "bg-gray-50",
                      hoverable && "hover:bg-gray-50 transition-colors",
                      rowProps.className
                    )}
                    {...rowProps}
                  >
                    {columns.map((column) => {
                      const value = column.dataIndex ? record[column.dataIndex] : record[column.key]
                      const content = column.render
                        ? column.render(value, record, index)
                        : value

                      return (
                        <td
                          key={column.key}
                          className={cn(
                            cellPadding[size],
                            "text-gray-900",
                            column.align === 'center' && "text-center",
                            column.align === 'right' && "text-right",
                            bordered && "border-r border-gray-200 last:border-r-0",
                            column.className
                          )}
                        >
                          {content}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <TablePagination {...pagination} />
      )}
    </div>
  )
}

interface TablePaginationProps {
  current: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
}

const TablePagination: React.FC<TablePaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal = true,
}) => {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (current - 1) * pageSize + 1
  const endItem = Math.min(current * pageSize, total)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange(page, pageSize)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    onChange(1, newPageSize)
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(totalPages - 1, current + delta);
      i++
    ) {
      range.push(i)
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (current + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center">
        {showTotal && (
          <p className="text-sm text-gray-700">
            显示 <span className="font-medium">{startItem}</span> 到{' '}
            <span className="font-medium">{endItem}</span> 项，共{' '}
            <span className="font-medium">{total}</span> 项
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {showSizeChanger && (
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size} / 页</option>
            ))}
          </select>
        )}

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current - 1)}
            disabled={current <= 1}
          >
            上一页
          </Button>

          {getVisiblePages().map((page, index) => (
            page === '...' ? (
              <span key={index} className="px-2 py-1 text-gray-500">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={current === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
              >
                {page}
              </Button>
            )
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current + 1)}
            disabled={current >= totalPages}
          >
            下一页
          </Button>
        </div>

        {showQuickJumper && (
          <div className="flex items-center space-x-2 text-sm">
            <span>跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt((e.target as HTMLInputElement).value)
                  handlePageChange(page)
                }
              }}
            />
            <span>页</span>
          </div>
        )}
      </div>
    </div>
  )
}

export { Table, TablePagination }
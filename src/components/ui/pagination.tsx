import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface PaginationProps {
  /** 当前页码 (从 1 开始) */
  current: number
  /** 总条目数 */
  total: number
  /** 每页条目数 */
  pageSize: number
  /** 页码变化回调 */
  onChange: (page: number) => void
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean
  /** 是否显示总数 */
  showTotal?: boolean
  /** 自定义类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 分页组件
 * 
 * 用于长列表数据的分页展示和导航
 */
export const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  showQuickJumper = false,
  showTotal = true,
  className,
  disabled = false,
}) => {
  const totalPages = Math.ceil(total / pageSize)
  const [jumpValue, setJumpValue] = React.useState('')

  // 生成页码数组
  const getPageNumbers = React.useCallback(() => {
    const pages: (number | 'prev-ellipsis' | 'next-ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      // 总页数 <= 7，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 总页数 > 7，需要显示省略号
      if (current <= 4) {
        // 当前页在前部
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('next-ellipsis')
        pages.push(totalPages)
      } else if (current >= totalPages - 3) {
        // 当前页在后部
        pages.push(1)
        pages.push('prev-ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('prev-ellipsis')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('next-ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }, [current, totalPages])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === current || disabled) return
    onChange(page)
  }

  const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(jumpValue, 10)
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        handlePageChange(page)
        setJumpValue('')
      }
    }
  }

  const handleEllipsisClick = (type: 'prev' | 'next') => {
    if (type === 'prev') {
      handlePageChange(Math.max(1, current - 5))
    } else {
      handlePageChange(Math.min(totalPages, current + 5))
    }
  }

  if (totalPages <= 0) return null

  const pageNumbers = getPageNumbers()

  return (
    <div 
      className={cn(
        'flex items-center gap-space-sm flex-wrap',
        className
      )}
    >
      {/* 总数显示 */}
      {showTotal && (
        <span 
          className="text-sm mr-space-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          共 <span style={{ color: 'var(--color-text-secondary)' }}>{total}</span> 条
        </span>
      )}

      {/* 上一页 */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => handlePageChange(current - 1)}
        disabled={current <= 1 || disabled}
        className="h-8 w-8"
        style={{
          backgroundColor: 'var(--color-components-pagination-item-bg)',
          color: current <= 1 ? 'var(--color-components-pagination-disabled-text)' : 'var(--color-components-pagination-item-text)',
        }}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 页码 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === 'prev-ellipsis' || page === 'next-ellipsis') {
            return (
              <Button
                key={`${page}-${index}`}
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEllipsisClick(page === 'prev-ellipsis' ? 'prev' : 'next')}
                disabled={disabled}
                className="h-8 w-8"
                style={{
                  backgroundColor: 'var(--color-components-pagination-item-bg)',
                  color: 'var(--color-components-pagination-item-text)',
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )
          }

          const isActive = page === current
          return (
            <Button
              key={page}
              variant="ghost"
              size="icon-sm"
              onClick={() => handlePageChange(page)}
              disabled={disabled}
              className={cn(
                'h-8 min-w-[32px] px-2 font-medium',
                isActive && 'font-semibold'
              )}
              style={{
                backgroundColor: isActive 
                  ? 'var(--color-components-pagination-item-bg-active)' 
                  : 'var(--color-components-pagination-item-bg)',
                color: isActive 
                  ? 'var(--color-components-pagination-item-text-active)' 
                  : 'var(--color-components-pagination-item-text)',
              }}
            >
              {page}
            </Button>
          )
        })}
      </div>

      {/* 下一页 */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => handlePageChange(current + 1)}
        disabled={current >= totalPages || disabled}
        className="h-8 w-8"
        style={{
          backgroundColor: 'var(--color-components-pagination-item-bg)',
          color: current >= totalPages ? 'var(--color-components-pagination-disabled-text)' : 'var(--color-components-pagination-item-text)',
        }}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 快速跳转 */}
      {showQuickJumper && totalPages > 1 && (
        <div className="flex items-center gap-space-xs ml-space-sm">
          <span 
            className="text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            跳至
          </span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={handleJump}
            disabled={disabled}
            className="w-12 h-8 px-2 text-sm text-center rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--color-components-input-bg)',
              borderColor: 'var(--color-components-input-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <span 
            className="text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            页
          </span>
        </div>
      )}
    </div>
  )
}

Pagination.displayName = 'Pagination'

export default Pagination

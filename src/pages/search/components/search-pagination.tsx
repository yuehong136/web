import React, { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageSizeSelector } from '@/components/ui/page-size-selector'

interface SearchPaginationProps {
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  const pageCount = Math.max(1, Math.min(7, totalPages))

  return Array.from({ length: pageCount }, (_, i) => {
    if (totalPages <= 7) return i + 1

    if (currentPage <= 4) {
      return i + 1
    }

    if (currentPage >= totalPages - 3) {
      return totalPages - 6 + i
    }

    return currentPage - 3 + i
  })
}

const SearchPagination: React.FC<SearchPaginationProps> = ({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 0) {
    return null
  }

  const pageNumbers = getVisiblePages(currentPage, totalPages)

  return (
    <div
      className="mt-4 rounded-lg border shadow-sm"
      style={{
        borderColor: 'var(--color-components-card-border)',
        backgroundColor: 'var(--color-components-card-bg)',
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="text-sm" style={{ color: 'var(--color-components-pagination-text)' }}>
          共 {total} 项
        </div>

        <div className="flex items-center space-x-4">
          <PageSizeSelector
            pageSize={pageSize}
            onChange={onPageSizeChange}
            options={[6, 12, 24, 48]}
          />

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>

            <div className="flex items-center space-x-1">
              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(SearchPagination)

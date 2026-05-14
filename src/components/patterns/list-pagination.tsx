import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageSizeSelector } from '@/components/ui/page-size-selector'

interface ListPaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  extraInfo?: React.ReactNode
}

export const ListPagination: React.FC<ListPaginationProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24, 48],
  extraInfo,
}) => {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 0) return null

  const visibleCount = Math.max(1, Math.min(7, totalPages))

  return (
    <div
      className="mt-4 rounded-lg border shadow-sm"
      style={{
        borderColor: 'var(--color-components-card-border)',
        backgroundColor: 'var(--color-components-card-bg)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div
          className="text-sm"
          style={{ color: 'var(--color-components-pagination-text)' }}
        >
          {t('common.totalItems', { count: total })}
          {extraInfo}
        </div>

        <div className="flex items-center space-x-4">
          {onPageSizeChange && (
            <PageSizeSelector
              pageSize={pageSize}
              onChange={onPageSizeChange}
              options={pageSizeOptions}
            />
          )}

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.previousPage')}
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: visibleCount }, (_, i) => {
                let pageNum = i + 1
                if (totalPages > 7) {
                  if (page <= 4) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || totalPages === 0}
            >
              {t('common.nextPage')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

ListPagination.displayName = 'ListPagination'

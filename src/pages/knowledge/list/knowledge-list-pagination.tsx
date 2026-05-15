import type { FC } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { PAGE_SIZE_OPTIONS } from './constants'

interface KnowledgeListPaginationProps {
  currentPage: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSize: number
  selectedCount: number
  total: number
  totalPages: number
}

const getVisiblePages = (currentPage: number, totalPages: number) => {
  return Array.from(
    { length: Math.max(1, Math.min(7, totalPages)) },
    (_, index) => {
      if (totalPages <= 7) {
        return index + 1
      }

      if (currentPage <= 4) {
        return index + 1
      }

      if (currentPage >= totalPages - 3) {
        return totalPages - 6 + index
      }

      return currentPage - 3 + index
    },
  )
}

export const KnowledgeListPagination: FC<KnowledgeListPaginationProps> = ({
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSize,
  selectedCount,
  total,
  totalPages,
}) => {
  const { t } = useTranslation()
  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <div className="mt-space-base rounded-radius-lg shadow-elevation-low border border-components-card-border bg-components-card-bg">
      <div className="px-space-lg py-space-base flex items-center justify-between">
        <div className="text-sm text-components-pagination-text">
          {t('knowledge.list.pagination.total', { count: total })}
          {selectedCount > 0
            ? t('knowledge.list.pagination.selected', { count: selectedCount })
            : null}
        </div>

        <div className="gap-space-base flex items-center">
          <PageSizeSelector
            onChange={onPageSizeChange}
            options={PAGE_SIZE_OPTIONS}
            pageSize={pageSize}
          />

          <div className="gap-space-xs flex items-center">
            <Button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('knowledge.list.pagination.previous')}
            </Button>

            <div className="gap-space-xs flex items-center">
              {visiblePages.map((pageNumber) => (
                <Button
                  className="min-w-[40px]"
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  size="sm"
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                >
                  {pageNumber}
                </Button>
              ))}
            </div>

            <Button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => onPageChange(currentPage + 1)}
              size="sm"
              variant="outline"
            >
              {t('knowledge.list.pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

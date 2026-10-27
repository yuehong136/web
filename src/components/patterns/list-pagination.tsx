import type { FC, ReactNode } from 'react'
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
  extraInfo?: ReactNode
}

export const ListPagination: FC<ListPaginationProps> = ({
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
    <div className="mt-space-base shrink-0 rounded-radius-lg border border-components-card-border bg-components-card-bg">
      <div className="flex flex-wrap items-center justify-between gap-space-base px-space-md py-space-sm">
        <div className="text-sm text-components-pagination-text">
          {t('common.totalItems', { count: total })}
          {extraInfo}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-space-base">
          {onPageSizeChange && (
            <PageSizeSelector
              pageSize={pageSize}
              onChange={onPageSizeChange}
              options={pageSizeOptions}
            />
          )}

          <div className="flex items-center gap-space-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-icon-sm" aria-hidden="true" />
              {t('common.previousPage')}
            </Button>

            <div className="hidden items-center gap-space-2xs lg:flex">
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
                    className="min-w-[var(--control-height-sm)]"
                    aria-current={page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <span
              className="px-space-xs text-sm text-text-secondary tabular-nums lg:hidden"
              aria-live="polite"
            >
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || totalPages === 0}
            >
              {t('common.nextPage')}
              <ChevronRight className="size-icon-sm" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

ListPagination.displayName = 'ListPagination'

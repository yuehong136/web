import { useTranslation } from 'react-i18next'
import { Button, PageSizeSelector } from '@/components/ui'

interface ChunkPaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export const ChunkPagination = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ChunkPaginationProps) => {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="z-10 shrink-0 border-t border-components-pagination-border bg-components-pagination-bg shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-components-pagination-text">
          {t('knowledge.chunks.toolbar.totalChunks', { count: total })}
        </div>

        <div className="flex items-center space-x-4">
          <PageSizeSelector
            pageSize={pageSize}
            onChange={(size) => {
              onPageSizeChange(size)
              onPageChange(1)
            }}
            options={[10, 20, 30, 50]}
          />

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              {t('knowledge.chunks.list.previousPage')}
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const pageNum = getVisiblePageNumber(page, totalPages, index)
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="min-w-[32px]"
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
              disabled={page >= totalPages}
            >
              {t('knowledge.chunks.list.nextPage')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const getVisiblePageNumber = (
  currentPage: number,
  totalPages: number,
  index: number,
) => {
  if (totalPages <= 5) return index + 1
  if (currentPage <= 3) return index + 1
  if (currentPage >= totalPages - 2) return totalPages - 4 + index
  return currentPage - 2 + index
}

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'

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
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label={t('knowledge.chunks.pagination.page', {
        page,
        total: totalPages,
      })}
      className="flex shrink-0 flex-wrap items-center justify-between gap-space-sm border-t border-border-subtle bg-background-surface px-space-md py-space-sm"
    >
      <span className="text-xs whitespace-nowrap text-text-tertiary tabular-nums">
        {t('knowledge.chunks.pagination.range', {
          start: rangeStart,
          end: rangeEnd,
          total,
        })}
      </span>

      <div className="flex flex-wrap items-center gap-space-sm">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            onPageSizeChange(Number(value))
            onPageChange(1)
          }}
        >
          <SelectTrigger
            className="h-8! w-16! gap-space-sm rounded-radius-md! px-space-sm! py-space-xs! text-xs"
            aria-label={t('knowledge.chunks.pagination.pageSize')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="-mt-space-2xl! -translate-y-full">
            {[10, 20, 30, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-space-xs">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={t('knowledge.chunks.list.previousPage')}
          >
            <ChevronLeft className="size-icon-sm" aria-hidden="true" />
          </Button>
          <span className="text-xs whitespace-nowrap text-text-secondary tabular-nums">
            {t('knowledge.chunks.pagination.page', { page, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label={t('knowledge.chunks.list.nextPage')}
          >
            <ChevronRight className="size-icon-sm" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

import type { ReactNode } from 'react'
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
  /** Shown at the start, e.g. how many chunks a search matched. */
  summary?: ReactNode
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export const ChunkPagination = ({
  summary,
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
      className="flex min-h-[var(--control-height)] shrink-0 flex-wrap items-center gap-x-space-sm gap-y-space-2xs border-t border-border-subtle px-space-md py-space-2xs text-xs text-text-tertiary"
    >
      {summary ? <span className="min-w-0 truncate">{summary}</span> : null}
      <span className="flex-1" aria-hidden="true" />
      <span className="font-mono whitespace-nowrap tabular-nums">
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
          <SelectContent>
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

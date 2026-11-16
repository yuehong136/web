import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuLabel,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PagerProps {
  /** 1-based page number. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** With both set, a compact "12 / page" menu appears before the range. */
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

/** First/last item numbers shown by the pager; `start` is 0 for an empty set. */
export function getPagerRange(page: number, pageSize: number, total: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= 0) return { start: 0, end: 0, pages }
  const start = Math.min((Math.max(page, 1) - 1) * pageSize + 1, total)
  return { start, end: Math.min(start + pageSize - 1, total), pages }
}

/**
 * Compact pager for collection footers: "1–12 / 40 ‹ ›". Server pages only;
 * the range is announced politely when it changes.
 */
export function Pager({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: PagerProps) {
  const { t } = useTranslation()
  const { start, end, pages } = getPagerRange(page, pageSize, total)
  return (
    <nav
      aria-label={t('common.patterns.pager.label')}
      className={cn(
        'flex shrink-0 items-center gap-space-xs text-xs text-text-tertiary tabular-nums',
        className,
      )}
    >
      {pageSizeOptions?.length && onPageSizeChange ? (
        <ActionMenu>
          <ActionMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs font-normal text-text-tertiary"
            >
              {t('common.patterns.pager.perPage', { count: pageSize })}
              <ChevronDown className="size-icon-xs" aria-hidden="true" />
            </Button>
          </ActionMenuTrigger>
          <ActionMenuContent align="end" className="min-w-36">
            <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-tertiary">
              {t('common.pagination.pageSizePrefix')}
            </ActionMenuLabel>
            <ActionMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              {pageSizeOptions.map((option) => (
                <ActionMenuRadioItem key={option} value={String(option)}>
                  {t('common.patterns.pager.perPage', { count: option })}
                </ActionMenuRadioItem>
              ))}
            </ActionMenuRadioGroup>
          </ActionMenuContent>
        </ActionMenu>
      ) : null}
      <span aria-live="polite" className="px-space-xs">
        {t('common.patterns.pager.range', { start, end, total })}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('common.previousPage')}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-icon-sm" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('common.nextPage')}
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-icon-sm" aria-hidden="true" />
      </Button>
    </nav>
  )
}

export interface LoadMoreProps {
  loaded: number
  total: number
  loading?: boolean
  onLoadMore: () => void
  className?: string
}

/** Footer for scroll-loaded collections: "24 of 60" and a load-more action. */
export function LoadMore({
  loaded,
  total,
  loading = false,
  onLoadMore,
  className,
}: LoadMoreProps) {
  const { t } = useTranslation()
  const done = loaded >= total
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-space-sm text-xs text-text-tertiary tabular-nums',
        className,
      )}
    >
      <span aria-live="polite">
        {done
          ? t('common.patterns.pager.allLoaded', { count: total })
          : t('common.patterns.pager.loaded', { loaded, total })}
      </span>
      {done ? null : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={loading}
          onClick={onLoadMore}
          className="text-xs"
        >
          {t('common.patterns.pager.loadMore')}
        </Button>
      )}
    </div>
  )
}

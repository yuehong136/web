import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { memoryAPI } from '@/api/memory'
import { memoryKeys } from '@/hooks/use-memory'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuLabel,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'

const PAGE_SIZES = [10, 20, 50]

/**
 * Open-ended pager for memory sources, styled like the shared `Pager`. The
 * message API cannot report a trustworthy total, so the next page is probed
 * instead of computing a range.
 */
export function MemorySourcePagination({
  memoryId,
  page,
  pageSize,
  count,
  keywords,
  agentId,
  loading,
  onPageChange,
  onPageSizeChange,
}: {
  memoryId: string
  page: number
  pageSize: number
  count: number
  keywords: string
  agentId?: string[]
  loading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const { t } = useTranslation()
  // Some stores report the window count as total_count. Probe one source at the
  // next offset instead of presenting that value as an inventory total.
  const next = useQuery({
    queryKey: [
      ...memoryKeys.messages(memoryId),
      'next-source',
      page * pageSize,
      keywords,
      agentId,
    ],
    queryFn: async () => {
      const result = await memoryAPI.memory.getDetail(memoryId, {
        page: page * pageSize + 1,
        page_size: 1,
        keywords,
        agent_id: agentId,
      })
      return result.messages.message_list.length > 0
    },
    enabled: !loading && count === pageSize,
  })
  return (
    <div className="flex min-h-[var(--control-height)] shrink-0 flex-wrap items-center gap-x-space-md border-t border-border-subtle py-space-2xs pr-space-sm pl-space-md text-xs text-text-tertiary">
      <p aria-live="polite" className="min-w-0 tabular-nums">
        {t('memory.workspace.sourcePage', { page, count })}
      </p>
      <span className="flex-1" aria-hidden="true" />
      <nav
        aria-label={t('common.patterns.pager.label')}
        className="flex items-center gap-space-xs tabular-nums"
      >
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
              {PAGE_SIZES.map((option) => (
                <ActionMenuRadioItem key={option} value={String(option)}>
                  {t('common.patterns.pager.perPage', { count: option })}
                </ActionMenuRadioItem>
              ))}
            </ActionMenuRadioGroup>
          </ActionMenuContent>
        </ActionMenu>
        {next.isError && count === pageSize ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => next.refetch()}
          >
            {t('common.retry')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('common.previousPage')}
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-icon-sm" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('common.nextPage')}
          disabled={
            loading ||
            count < pageSize ||
            !next.data ||
            next.isFetching ||
            next.isError
          }
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-icon-sm" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { memoryAPI } from '@/api/memory'
import { memoryKeys } from '@/hooks/use-memory'
import { Button } from '@/components/ui/button'
import { PageSizeSelector } from '@/components/ui/page-size-selector'

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
    <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-border-subtle bg-background-surface px-space-lg py-space-base">
      <p className="text-xs text-text-secondary" aria-live="polite">
        {t('memory.workspace.sourcePage', { page, count })}
      </p>
      <div className="flex flex-wrap items-center gap-space-base">
        <PageSizeSelector
          pageSize={pageSize}
          options={[10, 20, 50]}
          onChange={onPageSizeChange}
        />
        {next.isError && count === pageSize && (
          <Button size="sm" variant="ghost" onClick={() => next.refetch()}>
            {t('common.retry')}
          </Button>
        )}
        <div className="flex items-center gap-space-sm">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-icon-sm" />
            {t('common.previousPage')}
          </Button>
          <span className="text-xs text-text-secondary tabular-nums">
            {page}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={
              loading ||
              count < pageSize ||
              !next.data ||
              next.isFetching ||
              next.isError
            }
            onClick={() => onPageChange(page + 1)}
          >
            {t('common.nextPage')}
            <ChevronRight className="size-icon-sm" />
          </Button>
        </div>
      </div>
    </div>
  )
}

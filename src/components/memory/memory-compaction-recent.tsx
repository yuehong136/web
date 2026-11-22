import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { memoryAPI } from '@/api/memory'
import { memoryCompactionKeys } from '@/hooks/memory-compaction-keys'
import { SectionCard } from '@/components/patterns/section-card'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { Button } from '@/components/ui/button'

export function MemoryCompactionRecent({
  memoryId,
  enabled,
  onSelect,
}: {
  memoryId: string
  enabled: boolean
  onSelect: (operationId: string) => void
}) {
  const { t } = useTranslation(),
    [readScope] = useState(() => crypto.randomUUID()),
    [cursors, setCursors] = useState<string[]>([])
  const query = useQuery({
    queryKey: memoryCompactionKeys.list(memoryId, readScope, cursors.at(-1)),
    enabled,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const value = await memoryAPI.compaction.list(
        memoryId,
        cursors.at(-1),
        signal,
      )
      if (
        !Array.isArray(value.items) ||
        value.items.some(
          (item) =>
            item.memory_id !== memoryId ||
            item.package !== null ||
            item.validity_checked !== false ||
            item.valid_for_current !== null,
        )
      )
        throw new Error('invalid_compaction_list_metadata')
      return value
    },
  })
  if (!enabled) return null
  return (
    <SectionCard title={t('memory.compaction.recent')}>
      <div className="min-w-0 space-y-space-sm">
        <p className="text-xs text-text-secondary">
          {t('memory.compaction.metadataOnly')}
        </p>
        {query.isPending ? (
          <PageLoadingState />
        ) : query.isError ? (
          <PageErrorState onRetry={() => query.refetch()} />
        ) : (
          <ul className="min-w-0 space-y-space-sm">
            {query.data.items.map((item) => (
              <li
                key={item.artifact_id}
                className="min-w-0 space-y-space-xs rounded-radius-md border border-border-subtle p-space-sm text-xs"
              >
                <p className="font-mono break-all">{item.operation_id}</p>
                <p className="font-mono break-all">{item.artifact_id}</p>
                <p>
                  {t('memory.compaction.storedState')}: {item.state}
                </p>
                {item.retired_at && (
                  <p>{t('memory.compaction.retention.retired')}</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelect(item.operation_id)}
                >
                  {t('memory.compaction.open')}
                </Button>
              </li>
            ))}
            {!query.data.items.length && (
              <li>{t('memory.compaction.empty')}</li>
            )}
          </ul>
        )}
        <div className="flex flex-wrap gap-space-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('memory.compaction.refreshList')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!cursors.length || query.isFetching}
            onClick={() => setCursors((previous) => previous.slice(0, -1))}
          >
            {t('memory.compaction.previous')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              !query.data?.has_more ||
              !query.data.next_cursor ||
              query.isFetching
            }
            onClick={() => {
              if (query.data?.next_cursor)
                setCursors((previous) => [...previous, query.data.next_cursor!])
            }}
          >
            {t('memory.compaction.next')}
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}

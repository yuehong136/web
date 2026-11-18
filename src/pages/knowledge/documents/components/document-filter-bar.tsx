import { useTranslation } from 'react-i18next'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { FilterBar, type FilterDefinition } from '@/components/patterns'
import { cn } from '@/lib/utils'
import { FilterPopover } from '../document-filter-popover'
import type { DocumentListState, FilterCollection } from '../types'

const SORTS = [
  { value: 'create_time:desc', key: 'newest' },
  { value: 'create_time:asc', key: 'oldest' },
  { value: 'name:asc', key: 'name' },
  { value: 'size:desc', key: 'largest' },
] as const

const chipOptions = (
  collection: FilterCollection | undefined,
  format: (label: string, count?: number) => string,
) =>
  (collection?.list ?? []).map((item) => ({
    value: String(item.id),
    label: format(item.label, item.count),
  }))

interface DocumentFilterBarProps {
  listState: DocumentListState
  filterCollections: FilterCollection[]
}

/**
 * Search, status and file-type chips (with server counts), the nested
 * metadata filter, one sort menu and refresh — all server-side filters.
 */
export function DocumentFilterBar({
  listState,
  filterCollections,
}: DocumentFilterBarProps) {
  const { t } = useTranslation()
  const byField = (field: string) =>
    filterCollections.find((collection) => collection.field === field)
  const format = (label: string, count?: number) =>
    count === undefined
      ? label
      : t('knowledge.documents.filters.optionCount', { label, count })
  const value = listState.filterValue
  const listValue = (field: string) =>
    Array.isArray(value[field]) ? (value[field] as string[]) : []
  const metadataCollection = byField('metadata')
  const metadataValue = (value.metadata ?? {}) as Record<string, string[]>
  const metadataCount = Object.values(metadataValue).reduce(
    (sum, values) => sum + (values?.length ?? 0),
    0,
  )
  const filters: FilterDefinition[] = [
    {
      key: 'run',
      label: t('knowledge.documents.filters.taskStatus'),
      value: listValue('run'),
      options: chipOptions(byField('run'), format),
    },
    {
      key: 'type',
      label: t('knowledge.documents.filters.fileType'),
      value: listValue('type'),
      options: chipOptions(byField('type'), format),
    },
  ]
  const sortValue = `${listState.sortConfig.orderby}:${listState.sortConfig.desc ? 'desc' : 'asc'}`

  return (
    <FilterBar
      search={{
        value: listState.searchKeywords,
        onChange: listState.setSearchKeywords,
        placeholder: t('knowledge.documents.searchPlaceholder'),
      }}
      filters={filters}
      onFilterChange={(key, next) =>
        listState.setFilterValue({ ...value, [key]: next })
      }
      onClearFilters={() =>
        listState.setFilterValue({ ...value, run: [], type: [], metadata: {} })
      }
      sort={{
        value: SORTS.some((sort) => sort.value === sortValue)
          ? sortValue
          : SORTS[0].value,
        onChange: (next) => {
          const [orderby, direction] = next.split(':')
          listState.setSortConfig({ orderby, desc: direction === 'desc' })
        },
        options: SORTS.map((sort) => ({
          value: sort.value,
          label: t(`knowledge.documents.sort.${sort.key}`),
        })),
      }}
      actions={
        <>
          {metadataCollection?.list.length || metadataCount ? (
            <FilterPopover
              filters={metadataCollection ? [metadataCollection] : []}
              value={value}
              onChange={(next) =>
                listState.setFilterValue({
                  ...value,
                  metadata: (next.metadata ?? {}) as Record<string, string[]>,
                })
              }
              onOpenChange={(open) => {
                if (open) listState.refreshFilterOptions()
              }}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-filter-key="metadata"
                data-filter-set={metadataCount > 0 || undefined}
                className={cn(
                  'border border-dashed border-line-strong text-xs font-normal text-fg-muted',
                  metadataCount > 0 &&
                    'border-solid border-line bg-sunken text-fg',
                )}
              >
                {t('knowledge.documents.filters.metadata')}
                {metadataCount > 0 ? (
                  <span className="tabular-nums">{metadataCount}</span>
                ) : null}
                <ChevronDown className="size-icon-xs" aria-hidden="true" />
              </Button>
            </FilterPopover>
          ) : null}
          <Tooltip content={t('knowledge.common.refresh')}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('knowledge.common.refresh')}
              onClick={listState.refetch}
            >
              <RefreshCw
                className={cn(
                  'size-icon-sm',
                  listState.isFetching && 'animate-spin',
                )}
                aria-hidden="true"
              />
            </Button>
          </Tooltip>
        </>
      }
    />
  )
}

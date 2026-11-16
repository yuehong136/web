import { useTranslation } from 'react-i18next'
import { FilterBar, type CollectionView } from '@/components/patterns'
import type { KnowledgeGroupBy, KnowledgeTimeFormat } from './types'

interface KnowledgeListFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  sortDescending: boolean
  onSortDescendingChange: (descending: boolean) => void
  groupBy: KnowledgeGroupBy
  onGroupByChange: (groupBy: KnowledgeGroupBy) => void
  timeFormat: KnowledgeTimeFormat
  onTimeFormatChange: (format: KnowledgeTimeFormat) => void
  view: CollectionView
  onViewChange: (view: CollectionView) => void
}

const GROUP_BY: KnowledgeGroupBy[] = ['content', 'permission', 'none']
const TIME_FORMATS: KnowledgeTimeFormat[] = ['detailed', 'compact', 'relative']

/**
 * Keyword search (the list API's only filter), one sort/display menu with the
 * grouping, and the list/grid switch.
 */
export function KnowledgeListFilterBar({
  search,
  onSearchChange,
  sortDescending,
  onSortDescendingChange,
  groupBy,
  onGroupByChange,
  timeFormat,
  onTimeFormatChange,
  view,
  onViewChange,
}: KnowledgeListFilterBarProps) {
  const { t } = useTranslation()
  return (
    <FilterBar
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: t('knowledge.list.searchPlaceholder'),
      }}
      sort={{
        value: sortDescending ? 'desc' : 'asc',
        onChange: (value) => onSortDescendingChange(value === 'desc'),
        options: [
          { value: 'desc', label: t('knowledge.list.sort.updatedDesc') },
          { value: 'asc', label: t('knowledge.list.sort.updatedAsc') },
        ],
      }}
      display={[
        {
          key: 'group',
          label: t('knowledge.list.groupBy.label'),
          value: groupBy,
          onChange: (value) => onGroupByChange(value as KnowledgeGroupBy),
          options: GROUP_BY.map((value) => ({
            value,
            label: t(`knowledge.list.groupBy.${value}`),
          })),
        },
        {
          key: 'time',
          label: t('knowledge.list.timeFormat.label'),
          value: timeFormat,
          onChange: (value) => onTimeFormatChange(value as KnowledgeTimeFormat),
          options: TIME_FORMATS.map((value) => ({
            value,
            label: t(`knowledge.list.timeFormat.${value}`),
          })),
        },
      ]}
      view={{ value: view, onChange: onViewChange }}
    />
  )
}

import { useTranslation } from 'react-i18next'
import { FilterBar, type CollectionView } from '@/components/patterns'
import type { TimeFormat } from '@/stores/team'

interface TeamFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  sortDescending: boolean
  onSortDescendingChange: (descending: boolean) => void
  timeFormat: TimeFormat
  onTimeFormatChange: (format: TimeFormat) => void
  view: CollectionView
  onViewChange: (view: CollectionView) => void
}

/** Search, one sort/time menu and the view switch for both team tabs. */
export function TeamFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  sortDescending,
  onSortDescendingChange,
  timeFormat,
  onTimeFormatChange,
  view,
  onViewChange,
}: TeamFilterBarProps) {
  const { t } = useTranslation()
  return (
    <FilterBar
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: searchPlaceholder,
      }}
      sort={{
        value: sortDescending ? 'desc' : 'asc',
        onChange: (value) => onSortDescendingChange(value === 'desc'),
        options: [
          { value: 'desc', label: t('settings.team.newestFirst') },
          { value: 'asc', label: t('settings.team.oldestFirst') },
        ],
      }}
      display={[
        {
          key: 'time',
          label: t('settings.team.timeFormat'),
          value: timeFormat,
          onChange: (value) => onTimeFormatChange(value as TimeFormat),
          options: [
            { value: 'detailed', label: t('settings.team.detailedTime') },
            { value: 'compact', label: t('settings.team.compactTime') },
            { value: 'relative', label: t('settings.team.relativeTime') },
          ],
        },
      ]}
      view={{ value: view, onChange: onViewChange }}
    />
  )
}

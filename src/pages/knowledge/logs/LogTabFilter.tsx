import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterBar } from '@/components/patterns'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  LogTabOptions,
  LogTabType,
  RunningStatus,
  RunningStatusI18nKey,
} from './constants'
import type { LogFilterValue } from './types'

interface LogTabFilterProps {
  activeTab: LogTabType
  onTabChange: (tab: LogTabType) => void
  searchValue: string
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
  filterValue: LogFilterValue
  onFilterChange: (value: LogFilterValue) => void
}

const STATUS_OPTIONS = Object.values(RunningStatus).filter(
  (status) => status !== RunningStatus.SCHEDULE,
)

/** File / dataset log switch, then search (file logs) and a status chip. */
export function LogTabFilter({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
}: LogTabFilterProps) {
  const { t } = useTranslation()
  const isFileLogs = activeTab === LogTabType.FILE_LOGS

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
      <SegmentedControl
        aria-label={t('knowledge.logs.tabs.label')}
        size="sm"
        value={activeTab}
        onValueChange={onTabChange}
        options={LogTabOptions.map((tab) => ({
          value: tab.key,
          label: t(tab.labelKey),
        }))}
      />
      <FilterBar
        className="min-w-0 flex-1"
        search={
          isFileLogs
            ? {
                value: searchValue,
                onChange: (value) =>
                  onSearchChange({
                    target: { value },
                  } as ChangeEvent<HTMLInputElement>),
                placeholder: t('knowledge.logs.filter.searchPlaceholder'),
              }
            : undefined
        }
        filters={[
          {
            key: 'operation_status',
            label: t('knowledge.logs.filter.byStatus'),
            value: filterValue.operation_status ?? [],
            options: STATUS_OPTIONS.map((status) => ({
              value: status,
              label: t(RunningStatusI18nKey[status]),
            })),
          },
        ]}
        onFilterChange={(_, value) =>
          onFilterChange({
            ...filterValue,
            operation_status: value.length > 0 ? value : undefined,
          })
        }
        onClearFilters={() => onFilterChange({})}
      />
    </div>
  )
}

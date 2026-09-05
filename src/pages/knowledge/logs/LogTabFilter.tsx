import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Filter, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { FileStatusBadge } from './FileStatusBadge'
import { LogTabOptions, LogTabType, RunningStatus } from './constants'
import type { LogFilterValue } from './types'

interface LogTabFilterProps {
  activeTab: LogTabType
  onTabChange: (tab: LogTabType) => void
  searchValue: string
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
  filterValue: LogFilterValue
  onFilterChange: (value: LogFilterValue) => void
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-radius-lg px-4 py-2 text-sm font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-state-focus-10 focus:ring-offset-1',
        active
          ? 'shadow-elevation-low bg-background-default text-text-primary'
          : 'text-text-secondary',
      )}
    >
      {children}
    </button>
  )
}

interface FilterOptionProps {
  status: RunningStatus
  selected: boolean
  onToggle: () => void
}

function FilterOption({ status, selected, onToggle }: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-radius-md flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-background-subtle"
    >
      <FileStatusBadge status={status} />
      {selected && <Check className="h-4 w-4 text-state-focus" />}
    </button>
  )
}

export function LogTabFilter({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
}: LogTabFilterProps) {
  const { t } = useTranslation()
  const [filterOpen, setFilterOpen] = useState(false)

  const filterCount = filterValue.operation_status?.length || 0
  const statusOptions = useMemo(
    () =>
      Object.values(RunningStatus).filter(
        (status) => status !== RunningStatus.SCHEDULE,
      ),
    [],
  )

  const toggleStatusFilter = (status: RunningStatus) => {
    const currentStatus = filterValue.operation_status || []
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((item) => item !== status)
      : [...currentStatus, status]

    onFilterChange({
      ...filterValue,
      operation_status: newStatus.length > 0 ? newStatus : undefined,
    })
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <div className="rounded-radius-lg flex items-center bg-background-subtle p-1">
        {LogTabOptions.map((tab) => (
          <TabButton
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
          >
            {t(tab.labelKey)}
          </TabButton>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-1.5',
                filterCount > 0 &&
                  'border-state-focus bg-state-focus-10 text-state-focus',
              )}
            >
              <Filter className="h-4 w-4" />
              <span>{t('knowledge.logs.filter.button')}</span>
              {filterCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-state-focus px-1.5 text-xs font-medium text-text-inverted">
                  {filterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-text-primary">
                  {t('knowledge.logs.filter.byStatus')}
                </h4>
                {filterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-text-tertiary"
                    onClick={() => onFilterChange({})}
                  >
                    {t('knowledge.logs.filter.clear')}
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {statusOptions.map((status) => (
                  <FilterOption
                    key={status}
                    status={status}
                    selected={
                      filterValue.operation_status?.includes(status) || false
                    }
                    onToggle={() => toggleStatusFilter(status)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeTab === LogTabType.FILE_LOGS && (
          <Input
            placeholder={t('knowledge.logs.filter.searchPlaceholder')}
            value={searchValue}
            onChange={onSearchChange}
            className="h-9 w-48 text-sm"
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              searchValue ? (
                <button
                  type="button"
                  onClick={() =>
                    onSearchChange({
                      target: { value: '' },
                    } as ChangeEvent<HTMLInputElement>)
                  }
                  className="rounded-radius-sm p-0.5 hover:bg-background-subtle"
                  aria-label={t('knowledge.logs.filter.clearSearch')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  )
}

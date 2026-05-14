import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { LogTabType, LogTabOptions, RunningStatus } from './constants'
import { FileStatusBadge } from './FileStatusBadge'

interface FilterValue {
  operation_status?: string[]
}

interface LogTabFilterProps {
  activeTab: LogTabType
  onTabChange: (tab: LogTabType) => void
  searchValue: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  filterValue: FilterValue
  onFilterChange: (value: FilterValue) => void
}

/**
 * Tab切换按钮组件 - 使用设计令牌
 */
const TabButton: React.FC<{
  active: boolean
  onClick: () => void
  children: React.ReactNode
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
    )}
    style={
      {
        backgroundColor: active
          ? 'var(--color-background-default)'
          : 'transparent',
        color: active
          ? 'var(--color-text-primary)'
          : 'var(--color-text-secondary)',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
        '--tw-ring-color': 'var(--color-state-focus-10)',
      } as React.CSSProperties
    }
  >
    {children}
  </button>
)

/**
 * 筛选选项组件
 */
const FilterOption: React.FC<{
  status: RunningStatus
  selected: boolean
  onToggle: () => void
}> = ({ status, selected, onToggle }) => (
  <button
    onClick={onToggle}
    className={cn(
      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
      'hover:bg-[var(--color-background-subtle)]',
    )}
  >
    <FileStatusBadge status={status} />
    {selected && (
      <Check
        className="h-4 w-4"
        style={{ color: 'var(--color-state-focus)' }}
      />
    )}
  </button>
)

/**
 * 日志Tab和筛选组件
 */
const LogTabFilter: React.FC<LogTabFilterProps> = ({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
}) => {
  const { t } = useTranslation()
  const [filterOpen, setFilterOpen] = useState(false)

  // 计算已选筛选数量
  const filterCount = useMemo(() => {
    if (!filterValue.operation_status) return 0
    return filterValue.operation_status.length
  }, [filterValue])

  // 切换状态筛选
  const toggleStatusFilter = (status: RunningStatus) => {
    const currentStatus = filterValue.operation_status || []
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status]

    onFilterChange({
      ...filterValue,
      operation_status: newStatus.length > 0 ? newStatus : undefined,
    })
  }

  // 清除所有筛选
  const clearFilters = () => {
    onFilterChange({})
  }

  // 可用的状态筛选选项
  const statusOptions = useMemo(() => {
    return Object.values(RunningStatus).filter(
      (status) => status !== RunningStatus.SCHEDULE, // 排除调度状态
    )
  }, [])

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      {/* Tab切换 */}
      <div
        className="flex items-center rounded-lg p-1"
        style={{ backgroundColor: 'var(--color-background-subtle)' }}
      >
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

      {/* 筛选和搜索 */}
      <div className="flex items-center gap-2">
        {/* 筛选按钮 */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              style={{
                borderColor:
                  filterCount > 0 ? 'var(--color-state-focus)' : undefined,
                backgroundColor:
                  filterCount > 0 ? 'var(--color-state-focus-10)' : undefined,
              }}
            >
              <Filter className="h-4 w-4" />
              <span>{t('knowledge.logs.filter.button')}</span>
              {filterCount > 0 && (
                <span
                  className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-state-focus)',
                    color: '#ffffff',
                  }}
                >
                  {filterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('knowledge.logs.filter.byStatus')}
                </h4>
                {filterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onClick={clearFilters}
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

        {/* 搜索框 */}
        <Input
          placeholder={t('knowledge.logs.filter.searchPlaceholder')}
          value={searchValue}
          onChange={onSearchChange}
          className="h-9 w-48 text-sm"
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            searchValue ? (
              <button
                onClick={() =>
                  onSearchChange({
                    target: { value: '' },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className="hover:bg-surface-subtle rounded p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}

export { LogTabFilter }
export default LogTabFilter

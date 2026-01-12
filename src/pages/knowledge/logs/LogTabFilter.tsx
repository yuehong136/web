import React, { useState, useMemo } from 'react'
import { Search, Filter, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { LogTabType, LogTabOptions, RunningStatus, RunningStatusMap } from './constants'
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
      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1'
    )}
    style={{
      backgroundColor: active ? 'var(--color-background-default)' : 'transparent',
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
      '--tw-ring-color': 'var(--color-state-focus-10)',
    } as React.CSSProperties}
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
      'flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors',
      'hover:bg-[var(--color-background-subtle)]'
    )}
  >
    <FileStatusBadge status={status} name={RunningStatusMap[status]} />
    {selected && (
      <Check 
        className="w-4 h-4"
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
      ? currentStatus.filter(s => s !== status)
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
      status => status !== RunningStatus.SCHEDULE // 排除调度状态
    )
  }, [])

  return (
    <div className="flex items-center justify-between mb-4 gap-4">
      {/* Tab切换 */}
      <div 
        className="flex items-center p-1 rounded-lg"
        style={{ backgroundColor: 'var(--color-background-subtle)' }}
      >
        {LogTabOptions.map((tab) => (
          <TabButton
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
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
                borderColor: filterCount > 0 ? 'var(--color-state-focus)' : undefined,
                backgroundColor: filterCount > 0 ? 'var(--color-state-focus-10)' : undefined,
              }}
            >
              <Filter className="w-4 h-4" />
              <span>筛选</span>
              {filterCount > 0 && (
                <span
                  className="ml-1 h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-full text-xs font-medium"
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
                  按状态筛选
                </h4>
                {filterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onClick={clearFilters}
                  >
                    清除
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {statusOptions.map((status) => (
                  <FilterOption
                    key={status}
                    status={status}
                    selected={filterValue.operation_status?.includes(status) || false}
                    onToggle={() => toggleStatusFilter(status)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 搜索框 */}
        <div className="relative">
          <Search 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
          <Input
            placeholder="搜索..."
            value={searchValue}
            onChange={onSearchChange}
            className="w-48 pl-8 h-9 text-sm"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { LogTabFilter }
export default LogTabFilter

import React, { memo } from 'react'
import { ArrowUpDown, LayoutGrid, List, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ViewToggle } from '@/components/ui/view-toggle'
import { CustomSelect } from '@/components/ui/custom-select'
import { FilterPopover, type FilterConfig, type FilterValue } from '@/components/ui/filter-popover'
import type { SearchTimeFormat } from './utils'

interface SearchToolbarProps {
  keyword: string
  onKeywordChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  sortBy: 'update_time' | 'create_time' | 'name'
  onSortByChange: (value: 'update_time' | 'create_time' | 'name') => void
  sortDesc: boolean
  onSortDescToggle: () => void
  timeFormat: SearchTimeFormat
  onTimeFormatChange: (value: SearchTimeFormat) => void
  filterConfigs: FilterConfig[]
  filterValue: FilterValue
  onFilterChange: (value: FilterValue) => void
}

const SearchToolbar: React.FC<SearchToolbarProps> = ({
  keyword,
  onKeywordChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  sortDesc,
  onSortDescToggle,
  timeFormat,
  onTimeFormatChange,
  filterConfigs,
  filterValue,
  onFilterChange,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1 max-w-md">
        <Input
          type="search"
          value={keyword}
          placeholder="搜索应用名称..."
          onChange={(e) => onKeywordChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="flex items-center space-x-2">
        <FilterPopover
          filters={filterConfigs}
          value={filterValue}
          onChange={onFilterChange}
        />

        <div className="w-[160px]">
          <CustomSelect
            value={sortBy}
            size="sm"
            onChange={(value) => onSortByChange(value as 'update_time' | 'create_time' | 'name')}
            options={[
              { value: 'update_time', label: '按更新时间' },
              { value: 'create_time', label: '按创建时间' },
              { value: 'name', label: '按名称' },
            ]}
          />
        </div>

        <CustomSelect
          options={[
            { value: 'detailed', label: '详细时间' },
            { value: 'compact', label: '简洁时间' },
            { value: 'relative', label: '相对时间' },
          ]}
          value={timeFormat}
          onChange={(value) => onTimeFormatChange(value as SearchTimeFormat)}
          size="sm"
          className="min-w-[100px]"
        />

        <button
          type="button"
          onClick={onSortDescToggle}
          className="h-9 px-2 rounded-radius-md border border-border-default bg-background-subtle flex items-center gap-1 text-xs text-text-secondary hover:bg-surface-secondary"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>{sortDesc ? '倒序' : '正序'}</span>
        </button>

        <ViewToggle
          value={viewMode}
          onChange={onViewModeChange}
          size="md"
          options={[
            { value: 'grid', icon: <LayoutGrid /> },
              { value: 'list', icon: <List /> },
            ]}
          />
      </div>
    </div>
  )
}

export default memo(SearchToolbar)

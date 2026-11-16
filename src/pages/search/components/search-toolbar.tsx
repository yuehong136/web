import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, LayoutGrid, List, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FilterPopover,
  type FilterConfig,
  type FilterValue,
} from '@/components/ui/filter-popover'
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
  const { t } = useTranslation()

  return (
    <div className="flex items-center space-x-4">
      <div className="max-w-md flex-1">
        <Input
          type="search"
          value={keyword}
          placeholder={t(
            'searchPage.toolbar.searchPlaceholder',
            '搜索应用名称...',
          )}
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
          <Select
            value={sortBy}
            onValueChange={(value) =>
              onSortByChange(value as 'update_time' | 'create_time' | 'name')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="update_time">
                {t('searchPage.toolbar.sortUpdated', '按更新时间')}
              </SelectItem>
              <SelectItem value="create_time">
                {t('searchPage.toolbar.sortCreated', '按创建时间')}
              </SelectItem>
              <SelectItem value="name">
                {t('searchPage.toolbar.sortName', '按名称')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select
          value={timeFormat}
          onValueChange={(value) =>
            onTimeFormatChange(value as SearchTimeFormat)
          }
        >
          <SelectTrigger className="min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="detailed">
              {t('searchPage.toolbar.detailedTime', '详细时间')}
            </SelectItem>
            <SelectItem value="compact">
              {t('searchPage.toolbar.compactTime', '简洁时间')}
            </SelectItem>
            <SelectItem value="relative">
              {t('searchPage.toolbar.relativeTime', '相对时间')}
            </SelectItem>
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={onSortDescToggle}
          className="flex h-9 items-center gap-1 rounded-radius-md border border-border-default bg-background-subtle px-2 text-xs text-text-secondary hover:bg-surface-secondary"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>
            {sortDesc
              ? t('searchPage.toolbar.descending', '倒序')
              : t('searchPage.toolbar.ascending', '正序')}
          </span>
        </button>

        <SegmentedControl
          aria-label={t('common.viewToggle')}
          iconOnly
          value={viewMode}
          onValueChange={onViewModeChange}
          options={[
            {
              value: 'grid',
              icon: <LayoutGrid />,
              label: t('searchPage.toolbar.gridView', '网格视图'),
            },
            {
              value: 'list',
              icon: <List />,
              label: t('searchPage.toolbar.listView', '列表视图'),
            },
          ]}
        />
      </div>
    </div>
  )
}

export default memo(SearchToolbar)

/**
 * 列表筛选栏组件
 * 统一的列表页头部，含图标、标题、搜索、筛选、操作按钮
 */

import React, { useMemo, type ReactNode, type ChangeEventHandler } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// 筛选器选项
export interface FilterOption {
  value: string
  label: string
}

// 筛选器配置
export interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
}

// 筛选器值类型
export type FilterValue = Record<string, string[]>

interface ListFilterBarProps {
  /** 标题图标 */
  icon?: ReactNode
  /** 标题文本 */
  title: ReactNode
  /** 搜索字符串 */
  searchString?: string
  /** 搜索变化回调 */
  onSearchChange?: ChangeEventHandler<HTMLInputElement>
  /** 搜索占位符 */
  searchPlaceholder?: string
  /** 搜索框宽度类名 */
  searchWidth?: string
  /** 是否显示筛选 */
  showFilter?: boolean
  /** 筛选器配置 */
  filters?: FilterConfig[]
  /** 筛选值 */
  filterValue?: FilterValue
  /** 筛选值变化回调 */
  onFilterChange?: (value: FilterValue) => void
  /** 左侧自定义内容（替代标题） */
  leftPanel?: ReactNode
  /** 子内容（右侧操作按钮区） */
  children?: ReactNode
  /** 自定义类名 */
  className?: string
}

export const ListFilterBar: React.FC<ListFilterBarProps> = ({
  icon,
  title,
  searchString = '',
  onSearchChange,
  searchPlaceholder = '搜索...',
  searchWidth = 'w-48',
  showFilter = true,
  filters = [],
  filterValue = {},
  onFilterChange,
  leftPanel,
  children,
  className,
}) => {
  // 计算活跃筛选数量
  const filterCount = useMemo(() => {
    if (!filterValue || typeof filterValue !== 'object') return 0
    return Object.values(filterValue).reduce((total, arr) => {
      if (Array.isArray(arr)) {
        return total + arr.length
      }
      return total
    }, 0)
  }, [filterValue])

  // 切换筛选值
  const toggleFilterValue = (filterKey: string, optionValue: string) => {
    if (!onFilterChange) return
    
    const currentValues = filterValue[filterKey] || []
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue]
    
    onFilterChange({
      ...filterValue,
      [filterKey]: newValues,
    })
  }

  // 清除所有筛选
  const clearAllFilters = () => {
    if (!onFilterChange) return
    const clearedValue: FilterValue = {}
    filters.forEach(filter => {
      clearedValue[filter.key] = []
    })
    onFilterChange(clearedValue)
  }

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* 左侧：图标 + 标题 */}
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="shrink-0 text-text-accent">
            {icon}
          </div>
        )}
        {leftPanel || (
          <h1 className="text-xl font-semibold text-text-primary truncate">
            {title}
          </h1>
        )}
      </div>

      {/* 右侧：搜索 + 筛选 + 操作按钮 */}
      <div className="flex items-center gap-3 shrink-0">
        {/* 搜索框 */}
        {onSearchChange && (
          <Input
            value={searchString}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className={cn(searchWidth, 'h-9')}
            leftIcon={<Search className="w-icon-sm h-icon-sm" />}
          />
        )}

        {/* 筛选按钮 */}
        {showFilter && filters.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-2 h-9',
                  filterCount > 0 && 'border-text-accent text-text-accent'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                筛选
                {filterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-text-accent text-white rounded-full">
                    {filterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                {/* 筛选器头部 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">筛选条件</span>
                  {filterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-7 px-2 text-xs text-text-tertiary hover:text-text-primary"
                    >
                      <X className="h-3 w-3 mr-1" />
                      清除
                    </Button>
                  )}
                </div>

                {/* 筛选器列表 */}
                {filters.map((filter) => (
                  <div key={filter.key}>
                    <Label className="text-xs font-medium text-text-secondary mb-2 block">
                      {filter.label}
                    </Label>
                    <div className="space-y-2">
                      {filter.options.map((option) => {
                        const isChecked = (filterValue[filter.key] || []).includes(option.value)
                        return (
                          <div
                            key={option.value}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`${filter.key}-${option.value}`}
                              checked={isChecked}
                              onCheckedChange={() => toggleFilterValue(filter.key, option.value)}
                            />
                            <Label
                              htmlFor={`${filter.key}-${option.value}`}
                              className="text-sm text-text-secondary cursor-pointer"
                            >
                              {option.label}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* 操作按钮区 */}
        {children}
      </div>
    </div>
  )
}

ListFilterBar.displayName = 'ListFilterBar'

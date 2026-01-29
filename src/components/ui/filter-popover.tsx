/**
 * 筛选弹出框组件
 * 从 ListFilterBar 中提取的独立筛选组件，可在不同布局中复用
 */

import React, { useMemo } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface FilterPopoverProps {
  /** 筛选器配置 */
  filters: FilterConfig[]
  /** 筛选值 */
  value: FilterValue
  /** 筛选值变化回调 */
  onChange: (value: FilterValue) => void
  /** 按钮文本 */
  buttonText?: string
  /** 弹出框标题 */
  title?: string
  /** 自定义触发器 */
  trigger?: React.ReactNode
  /** 自定义类名 */
  className?: string
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  filters,
  value,
  onChange,
  buttonText = '筛选',
  title = '筛选条件',
  trigger,
  className,
}) => {
  // 计算活跃筛选数量
  const filterCount = useMemo(() => {
    if (!value || typeof value !== 'object') return 0
    return Object.values(value).reduce((total, arr) => {
      if (Array.isArray(arr)) {
        return total + arr.length
      }
      return total
    }, 0)
  }, [value])

  // 切换筛选值
  const toggleFilterValue = (filterKey: string, optionValue: string) => {
    const currentValues = value[filterKey] || []
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue]
    
    onChange({
      ...value,
      [filterKey]: newValues,
    })
  }

  // 清除所有筛选
  const clearAllFilters = () => {
    const clearedValue: FilterValue = {}
    filters.forEach(filter => {
      clearedValue[filter.key] = []
    })
    onChange(clearedValue)
  }

  if (filters.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9',
              filterCount > 0 && 'border-text-accent text-text-accent',
              className
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            {buttonText}
            {filterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-text-accent text-white rounded-full">
                {filterCount}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* 筛选器头部 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">{title}</span>
            {filterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs text-text-tertiary hover:text-text-primary"
              >
                <X className="w-icon-xs h-icon-xs mr-1" />
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
                  const isChecked = (value[filter.key] || []).includes(option.value)
                  return (
                    <div
                      key={option.value}
                      className="flex items-center gap-space-sm"
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
  )
}

FilterPopover.displayName = 'FilterPopover'

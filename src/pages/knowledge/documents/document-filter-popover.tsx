/**
 * 文档筛选器组件
 *
 * 支持递归嵌套的筛选字段，参照 ragflow 的 filter-field.tsx 和 filter-popover.tsx
 */

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronUp, Funnel } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import type { FilterType, FilterCollection, FilterValue } from './types'

// ============================================================================
// FilterField 组件 - 支持递归嵌套
// ============================================================================

interface FilterFieldProps {
  item: FilterType
  parent: FilterType & { field: string }
  level?: number
  value: FilterValue
  onChange: (value: FilterValue) => void
}

const FilterField: React.FC<FilterFieldProps> = ({
  item,
  parent,
  level = 0,
  value,
  onChange,
}) => {
  const [showAll, setShowAll] = useState(false)
  const hasNestedList = item.list && item.list.length > 0

  // 处理 checkbox 变化
  const handleCheckChange = (
    checked: boolean,
    isNestedField = false,
    parentId = ''
  ) => {
    if (isNestedField && parentId) {
      // 嵌套字段（如 metadata.author）
      const fieldName = parent.field
      const currentValue =
        (value[fieldName] as Record<string, string[]>) || {}
      const currentParentValues = currentValue[parentId] || []

      const newParentValues = checked
        ? [...currentParentValues, item.id.toString()]
        : currentParentValues.filter((v) => v !== item.id.toString())

      const newFieldValue = newParentValues.length > 0
        ? { ...currentValue, [parentId]: newParentValues }
        : Object.fromEntries(
            Object.entries(currentValue).filter(([key]) => key !== parentId)
          )

      onChange({
        ...value,
        [fieldName]:
          Object.keys(newFieldValue).length > 0 ? newFieldValue : {},
      })
    } else {
      // 普通字段（如 type, run）
      const fieldName = parent.field
      const currentValues = (value[fieldName] as string[]) || []

      const newValues = checked
        ? [...currentValues, item.id.toString()]
        : currentValues.filter((v) => v !== item.id.toString())

      onChange({
        ...value,
        [fieldName]: newValues,
      })
    }
  }

  // 检查是否选中
  const isChecked = () => {
    const fieldName = parent.field
    const fieldValue = value[fieldName]

    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(item.id.toString())
    }
    return false
  }

  // 渲染嵌套列表（如 metadata 字段）
  if (hasNestedList) {
    return (
      <div className={`flex flex-col gap-2 ${level > 0 ? 'ml-1' : ''}`}>
        <div
          className="flex items-center justify-between cursor-pointer py-1 hover:bg-[var(--color-surface-secondary)] rounded transition-colors"
          onClick={() => setShowAll(!showAll)}
        >
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {item.label}
          </span>
          <div className="flex items-center gap-2">
            {item.count !== undefined && (
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {item.count}
              </span>
            )}
            {showAll ? (
              <ChevronUp
                className="h-3 w-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
            ) : (
              <ChevronDown
                className="h-3 w-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
            )}
          </div>
        </div>
        {showAll &&
          item.list?.map((child) => (
            <FilterField
              key={child.id}
              item={child}
              parent={{
                ...item,
                id: item.id,
                field: parent.field,
              }}
              level={level + 1}
              value={value}
              onChange={onChange}
            />
          ))}
      </div>
    )
  }

  // 渲染叶子节点（checkbox）
  const isNestedChild = level > 0
  const parentId = isNestedChild ? parent.id : ''

  // 检查嵌套字段是否选中
  const isNestedChecked = () => {
    if (!isNestedChild) return false
    const fieldName = parent.field
    const fieldValue = value[fieldName]
    if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
      const parentValues = fieldValue[parentId] || []
      return parentValues.includes(item.id.toString())
    }
    return false
  }

  const checked = isNestedChild ? isNestedChecked() : isChecked()
  const checkboxId = `filter-${parent.field}-${parentId || 'root'}-${item.id}`

  return (
    <div
      className={`flex items-center justify-between text-xs group ${level > 0 ? 'ml-4' : ''}`}
    >
      <div
        className="flex items-center gap-2 flex-1 min-w-0 py-1.5 px-1 -mx-1 rounded cursor-pointer hover:bg-[var(--color-surface-secondary)] transition-colors"
        onClick={() => handleCheckChange(!checked, isNestedChild, parentId)}
      >
        <Checkbox
          id={checkboxId}
          checked={checked}
          onCheckedChange={(c) =>
            handleCheckChange(!!c, isNestedChild, parentId)
          }
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
        <span
          className="truncate select-none"
          style={{ color: 'var(--color-text-primary)' }}
          title={item.label}
        >
          {item.label}
        </span>
      </div>
      {item.count !== undefined && (
        <span
          className="text-xs ml-2 tabular-nums"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {item.count}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// FilterPopover 组件
// ============================================================================

interface FilterPopoverProps {
  filters: FilterCollection[]
  value: FilterValue
  onChange: (value: FilterValue) => void
  onOpenChange?: (open: boolean) => void
  /** 筛选器分组配置，key 为组名，value 为该组包含的 field 数组 */
  filterGroup?: Record<string, string[]>
  children?: React.ReactNode
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  children,
  filters,
  value,
  onChange,
  onOpenChange,
  filterGroup,
}) => {
  const [open, setOpen] = useState(false)
  const [localValue, setLocalValue] = useState<FilterValue>(value)

  // 同步外部 value 变化
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen)
    setOpen(newOpen)
    if (newOpen) {
      setLocalValue(value)
    }
  }

  const handleSubmit = () => {
    onChange(localValue)
    setOpen(false)
  }

  const handleReset = () => {
    const emptyValue: FilterValue = {}
    filters.forEach((f) => {
      const hasNested = f.list?.some(
        (item) => item.list && item.list.length > 0
      )
      emptyValue[f.field] = hasNested ? {} : []
    })
    onChange(emptyValue)
    setOpen(false)
  }

  // 计算属于分组的 field 列表
  const groupedFields = useMemo(() => {
    if (!filterGroup) return new Set<string>()
    return Object.values(filterGroup).reduce<Set<string>>((pre, cur) => {
      cur.forEach((item) => pre.add(item))
      return pre
    }, new Set())
  }, [filterGroup])

  // 不属于任何分组的筛选器
  const ungroupedFilters = useMemo(() => {
    return filters.filter((f) => !groupedFields.has(f.field))
  }, [filters, groupedFields])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* 渲染分组筛选器 */}
          {filterGroup &&
            Object.entries(filterGroup).map(([groupName, fieldKeys]) => {
              const groupFilters = filters.filter((f) =>
                fieldKeys.includes(f.field)
              )
              if (groupFilters.length === 0) return null

              return (
                <div
                  key={groupName}
                  className="flex flex-col space-y-3 border-b pb-4"
                  style={{ borderColor: 'var(--color-border-default)' }}
                >
                  {/* 组标题 */}
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {groupName}
                  </div>
                  {/* 组内筛选器 - 直接渲染每个筛选器的选项列表 */}
                  <div className="flex flex-col space-y-3">
                    {groupFilters.map((collection) => (
                      <div key={collection.field} className="space-y-1">
                        <div
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {collection.label}
                        </div>
                        {collection.list?.map((item) => (
                          <FilterField
                            key={item.id}
                            item={item}
                            parent={{ ...collection, id: collection.field }}
                            value={localValue}
                            onChange={setLocalValue}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

          {/* 渲染未分组的筛选器 */}
          {ungroupedFilters.map((collection) => (
            <div key={collection.field} className="space-y-3">
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {collection.label}
              </div>
              <div className="space-y-1">
                {collection.list?.map((item) => (
                  <FilterField
                    key={item.id}
                    item={item}
                    parent={{ ...collection, id: collection.field }}
                    value={localValue}
                    onChange={setLocalValue}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          className="flex justify-end gap-3 px-4 py-3 border-t"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <Button variant="outline" size="sm" onClick={handleReset}>
            清除
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// FilterButton 组件 - 封装筛选按钮和徽标
// ============================================================================

interface FilterButtonProps {
  filters: FilterCollection[]
  value: FilterValue
  onChange: (value: FilterValue) => void
  filterCount: number
  filterGroup?: Record<string, string[]>
  onOpenChange?: (open: boolean) => void
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  filters,
  value,
  onChange,
  filterCount,
  filterGroup,
  onOpenChange,
}) => {
  return (
    <FilterPopover
      filters={filters}
      value={value}
      onChange={onChange}
      filterGroup={filterGroup}
      onOpenChange={onOpenChange}
    >
      <Button
        variant="outline"
        size="sm"
        style={
          filterCount > 0
            ? {
                backgroundColor: 'var(--color-state-warning-subtle)',
                color: 'var(--color-state-warning)',
                borderColor: 'var(--color-border-warning)',
              }
            : {}
        }
      >
        <Funnel className="h-4 w-4 mr-2" />
        筛选
        {filterCount > 0 && (
          <span
            className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full"
            style={{
              color: 'var(--color-components-badge-warning-text)',
              backgroundColor: 'var(--color-state-warning)',
            }}
          >
            {filterCount}
          </span>
        )}
      </Button>
    </FilterPopover>
  )
}

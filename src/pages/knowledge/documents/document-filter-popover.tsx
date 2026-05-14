/**
 * 文档筛选器组件
 *
 * 支持递归嵌套的筛选字段，参照 ragflow 的 filter-field.tsx 和 filter-popover.tsx
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Funnel } from 'lucide-react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
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
    parentId = '',
  ) => {
    if (isNestedField && parentId) {
      // 嵌套字段（如 metadata.author）
      const fieldName = parent.field
      const currentValue = (value[fieldName] as Record<string, string[]>) || {}
      const currentParentValues = currentValue[parentId] || []

      const newParentValues = checked
        ? [...currentParentValues, item.id.toString()]
        : currentParentValues.filter((v) => v !== item.id.toString())

      const newFieldValue =
        newParentValues.length > 0
          ? { ...currentValue, [parentId]: newParentValues }
          : Object.fromEntries(
              Object.entries(currentValue).filter(([key]) => key !== parentId),
            )

      onChange({
        ...value,
        [fieldName]: Object.keys(newFieldValue).length > 0 ? newFieldValue : {},
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
          className="flex cursor-pointer items-center justify-between rounded py-1 transition-colors hover:bg-[var(--color-surface-secondary)]"
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
      className={`group flex items-center justify-between text-xs ${level > 0 ? 'ml-4' : ''}`}
    >
      <div
        className="-mx-1 flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-1 py-1.5 transition-colors hover:bg-[var(--color-surface-secondary)]"
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
          className="select-none truncate"
          style={{ color: 'var(--color-text-primary)' }}
          title={item.label}
        >
          {item.label}
        </span>
      </div>
      {item.count !== undefined && (
        <span
          className="ml-2 text-xs tabular-nums"
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

const filterNestedList = (
  list: FilterType[],
  searchTerm: string,
): FilterType[] => {
  if (!searchTerm) return list

  const term = searchTerm.toLowerCase()

  return list
    .filter((item) => {
      if (
        item.label.toString().toLowerCase().includes(term) ||
        item.id.toString().toLowerCase().includes(term)
      ) {
        return true
      }

      if (item.list?.length) {
        return filterNestedList(item.list, searchTerm).length > 0
      }

      return false
    })
    .map((item) => {
      if (!item.list?.length) return item
      return {
        ...item,
        list: filterNestedList(item.list, searchTerm),
      }
    })
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  children,
  filters,
  value,
  onChange,
  onOpenChange,
  filterGroup,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [localValue, setLocalValue] = useState<FilterValue>(value)
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})

  // 同步外部 value 变化
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen)
    setOpen(newOpen)
    if (newOpen) {
      setLocalValue(value)
      setSearchTerms({})
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
        (item) => item.list && item.list.length > 0,
      )
      emptyValue[f.field] = hasNested ? {} : []
    })
    onChange(emptyValue)
    setOpen(false)
  }

  const handleSearchChange = (field: string, keyword: string) => {
    setSearchTerms((prev) => ({
      ...prev,
      [field]: keyword,
    }))
  }

  const getFilteredCollection = useCallback(
    (collection: FilterCollection) => {
      if (!collection.canSearch) return collection

      const searchTerm = searchTerms[collection.field]?.trim()
      if (!searchTerm) return collection

      return {
        ...collection,
        list: filterNestedList(collection.list || [], searchTerm),
      }
    },
    [searchTerms],
  )

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
    return filters
      .filter((f) => !groupedFields.has(f.field))
      .map((item) => getFilteredCollection(item))
  }, [filters, groupedFields, getFilteredCollection])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-3 scrollbar-thin">
          {/* 渲染分组筛选器 */}
          {filterGroup &&
            Object.entries(filterGroup).map(([groupName, fieldKeys]) => {
              const groupFilters = filters
                .filter((f) => fieldKeys.includes(f.field))
                .map((item) => getFilteredCollection(item))
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
                        {collection.canSearch && (
                          <Input
                            placeholder={t(
                              'knowledge.documents.filterSearchPlaceholder',
                              { label: collection.label },
                            )}
                            value={searchTerms[collection.field] || ''}
                            onChange={(e) =>
                              handleSearchChange(
                                collection.field,
                                e.target.value,
                              )
                            }
                            className="h-8"
                          />
                        )}
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
              {collection.canSearch && (
                <Input
                  placeholder={t(
                    'knowledge.documents.filterSearchPlaceholder',
                    { label: collection.label },
                  )}
                  value={searchTerms[collection.field] || ''}
                  onChange={(e) =>
                    handleSearchChange(collection.field, e.target.value)
                  }
                  className="h-8"
                />
              )}
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
          className="flex justify-end gap-3 border-t px-4 py-3"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <Button variant="outline" size="sm" onClick={handleReset}>
            {t('knowledge.documents.clear')}
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            {t('knowledge.documents.confirm')}
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
  const { t } = useTranslation()
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
                backgroundColor: 'var(--color-state-focus-10)',
                color: 'var(--color-state-focus)',
                borderColor: 'var(--color-state-focus)',
              }
            : {}
        }
      >
        <Funnel className="mr-2 h-4 w-4" />
        {t('knowledge.documents.filter')}
        {filterCount > 0 && (
          <span
            className="ml-1 inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-bold leading-none"
            style={{
              color: '#ffffff',
              backgroundColor: 'var(--color-state-focus)',
            }}
          >
            {filterCount}
          </span>
        )}
      </Button>
    </FilterPopover>
  )
}

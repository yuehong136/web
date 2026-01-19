import React, { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MetadataFieldDefinition } from '@/types/api'

interface MetadataEntry {
  key: string
  value: string
}

interface DocumentMetadataEditorProps {
  /**
   * 当前 metadata 值
   */
  value: Record<string, any>
  /**
   * 值变更回调
   */
  onChange: (value: Record<string, any>) => void
  /**
   * 知识库定义的字段模板（可选）
   */
  fieldDefinitions?: MetadataFieldDefinition[]
  /**
   * 是否禁用
   */
  disabled?: boolean
  /**
   * 是否只读
   */
  readOnly?: boolean
  /**
   * 是否紧凑模式
   */
  compact?: boolean
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * 文档 Metadata 编辑器组件
 * 用于编辑单个文档的 metadata 键值对
 */
export const DocumentMetadataEditor: React.FC<DocumentMetadataEditorProps> = ({
  value,
  onChange,
  fieldDefinitions = [],
  disabled = false,
  readOnly = false,
  compact = false,
  className,
}) => {
  // 将 Record 转换为数组便于编辑
  const [entries, setEntries] = useState<MetadataEntry[]>([])

  // 初始化 entries
  useEffect(() => {
    const initialEntries = Object.entries(value || {}).map(([key, val]) => ({
      key,
      value: Array.isArray(val) ? val.join(', ') : String(val || ''),
    }))
    setEntries(initialEntries.length > 0 ? initialEntries : [])
  }, [value])

  // 同步更新到父组件
  const syncToParent = (newEntries: MetadataEntry[]) => {
    const newValue: Record<string, any> = {}
    newEntries.forEach(({ key, value: val }) => {
      if (key.trim()) {
        // 如果值包含逗号，转换为数组
        if (val.includes(',')) {
          newValue[key.trim()] = val.split(',').map((v) => v.trim()).filter(Boolean)
        } else {
          newValue[key.trim()] = val.trim()
        }
      }
    })
    onChange(newValue)
  }

  // 添加新条目
  const handleAdd = () => {
    const newEntries = [...entries, { key: '', value: '' }]
    setEntries(newEntries)
  }

  // 更新条目
  const handleUpdate = (index: number, field: 'key' | 'value', newValue: string) => {
    const newEntries = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: newValue } : entry
    )
    setEntries(newEntries)
    syncToParent(newEntries)
  }

  // 删除条目
  const handleRemove = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index)
    setEntries(newEntries)
    syncToParent(newEntries)
  }

  // 获取字段的预定义值
  const getFieldEnum = (fieldKey: string): string[] | undefined => {
    const def = fieldDefinitions.find((d) => d.key === fieldKey)
    return def?.enum
  }

  // 获取未使用的字段定义
  const getUnusedFields = (): MetadataFieldDefinition[] => {
    const usedKeys = new Set(entries.map((e) => e.key))
    return fieldDefinitions.filter((d) => !usedKeys.has(d.key))
  }

  if (readOnly) {
    return (
      <div className={cn('flex flex-col gap-space-xs', className)}>
        {entries.length === 0 ? (
          <span className="text-text-tertiary text-body-sm">无元数据</span>
        ) : (
          entries.map(({ key, value: val }, index) => (
            <div key={index} className="flex items-center gap-space-sm">
              <span className="text-text-secondary text-body-sm min-w-[80px]">
                {key}:
              </span>
              <span className="text-text-primary text-body-sm">{val || '-'}</span>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-space-sm', className)}>
      {/* 条目列表 */}
      {entries.map((entry, index) => {
        const enumValues = getFieldEnum(entry.key)
        const hasEnum = enumValues && enumValues.length > 0

        return (
          <div
            key={index}
            className={cn(
              'flex items-center gap-space-xs',
              compact ? 'gap-space-xs' : 'gap-space-sm'
            )}
          >
            {/* 字段名 */}
            {fieldDefinitions.length > 0 ? (
              <Select
                value={entry.key}
                onValueChange={(val) => handleUpdate(index, 'key', val)}
                disabled={disabled}
              >
                <SelectTrigger className={cn(compact ? 'w-[100px]' : 'w-[120px]')}>
                  <SelectValue placeholder="选择字段" />
                </SelectTrigger>
                <SelectContent>
                  {/* 当前选中的 */}
                  {entry.key && (
                    <SelectItem value={entry.key}>{entry.key}</SelectItem>
                  )}
                  {/* 未使用的字段 */}
                  {getUnusedFields().map((def) => (
                    <SelectItem key={def.key} value={def.key}>
                      {def.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={entry.key}
                onChange={(e) => handleUpdate(index, 'key', e.target.value)}
                placeholder="字段名"
                disabled={disabled}
                className={cn(compact ? 'w-[100px]' : 'w-[120px]')}
              />
            )}

            {/* 值 */}
            {hasEnum ? (
              <Select
                value={entry.value}
                onValueChange={(val) => handleUpdate(index, 'value', val)}
                disabled={disabled}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择值" />
                </SelectTrigger>
                <SelectContent>
                  {enumValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={entry.value}
                onChange={(e) => handleUpdate(index, 'value', e.target.value)}
                placeholder="值（多个值用逗号分隔）"
                disabled={disabled}
                className="flex-1"
              />
            )}

            {/* 删除按钮 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="h-[32px] w-[32px] p-0 hover:text-status-error shrink-0"
            >
              <X className="w-icon-sm h-icon-sm" />
            </Button>
          </div>
        )
      })}

      {/* 添加按钮 */}
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="w-icon-sm h-icon-sm mr-space-xs" />
          添加元数据
        </Button>
      )}

      {/* 空状态 */}
      {entries.length === 0 && disabled && (
        <span className="text-text-tertiary text-body-sm text-center py-space-sm">
          暂无元数据
        </span>
      )}
    </div>
  )
}

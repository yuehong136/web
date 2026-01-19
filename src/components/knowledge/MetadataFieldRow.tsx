import React from 'react'
import { Settings, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetadataValueTag } from './MetadataValueTag'
import { Button } from '@/components/ui/button'

interface MetadataFieldRowProps {
  /**
   * 字段名
   */
  field: string
  /**
   * 字段描述
   */
  description?: string
  /**
   * 值列表（可带计数）
   */
  values: Array<{ value: string; count?: number }>
  /**
   * 最多显示的值数量
   */
  maxDisplayValues?: number
  /**
   * 是否显示描述列
   */
  showDescription?: boolean
  /**
   * 是否允许删除单个值
   */
  allowRemoveValue?: boolean
  /**
   * 删除单个值回调
   */
  onRemoveValue?: (value: string) => void
  /**
   * 编辑按钮回调
   */
  onEdit?: () => void
  /**
   * 删除整行回调
   */
  onDelete?: () => void
  /**
   * 是否禁用操作
   */
  disabled?: boolean
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * Metadata 字段行组件
 * 用于在表格中展示单个 metadata 字段及其值
 * 参照 ragflow 设计，采用表格行布局
 */
export const MetadataFieldRow: React.FC<MetadataFieldRowProps> = ({
  field,
  description,
  values,
  maxDisplayValues = 2,
  showDescription = false,
  allowRemoveValue = false,
  onRemoveValue,
  onEdit,
  onDelete,
  disabled = false,
  className,
}) => {
  const displayValues = values.slice(0, maxDisplayValues)
  const remainingCount = Math.max(0, values.length - maxDisplayValues)

  return (
    <div
      className={cn(
        'group flex items-center',
        'border-b border-border-default last:border-b-0',
        'hover:bg-surface-secondary/50',
        'transition-colors duration-150',
        className
      )}
    >
      {/* 字段名 */}
      <div className="w-[140px] shrink-0 px-4 py-3">
        <span className="text-sm font-medium text-text-accent">
          {field}
        </span>
      </div>

      {/* 描述 */}
      {showDescription && (
        <div className="w-[160px] shrink-0 px-4 py-3">
          <span className="text-sm text-text-secondary truncate block" title={description}>
            {description || '-'}
          </span>
        </div>
      )}

      {/* 值列表 */}
      <div className="flex-1 px-4 py-2.5 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {displayValues.map(({ value, count }) => (
            <MetadataValueTag
              key={value}
              value={value}
              count={count}
              removable={allowRemoveValue}
              onRemove={() => onRemoveValue?.(value)}
              disabled={disabled}
              variant="outline"
            />
          ))}
          {remainingCount > 0 && (
            <span className="text-xs text-text-tertiary ml-1">
              ...
            </span>
          )}
          {values.length === 0 && (
            <span className="text-sm text-text-tertiary italic">-</span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="w-[80px] shrink-0 px-2 py-3 flex items-center justify-end gap-1">
        <div
          className={cn(
            'flex items-center gap-1',
            'opacity-0 group-hover:opacity-100',
            'transition-opacity duration-150'
          )}
        >
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              disabled={disabled}
              className="h-7 w-7 p-0 hover:bg-surface-tertiary"
            >
              <Settings className="w-4 h-4 text-text-secondary" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
              className="h-7 w-7 p-0 hover:bg-status-error/10 hover:text-status-error"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

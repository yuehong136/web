import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetadataValueTagProps {
  /**
   * 显示的值
   */
  value: string
  /**
   * 文档数量（可选，用于 Manage 模式显示统计）
   */
  count?: number
  /**
   * 是否可删除
   */
  removable?: boolean
  /**
   * 删除回调
   */
  onRemove?: () => void
  /**
   * 点击回调
   */
  onClick?: () => void
  /**
   * 是否禁用
   */
  disabled?: boolean
  /**
   * 尺寸
   */
  size?: 'sm' | 'md'
  /**
   * 变体样式
   */
  variant?: 'default' | 'outline' | 'ghost'
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * Metadata 值标签组件
 * 用于显示单个 metadata 值，支持计数和删除功能
 */
export const MetadataValueTag: React.FC<MetadataValueTagProps> = ({
  value,
  count,
  removable = false,
  onRemove,
  onClick,
  disabled = false,
  size = 'sm',
  variant = 'default',
  className,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  }

  const variantStyles = {
    default: cn(
      'bg-surface-secondary border border-border-default',
      'hover:bg-surface-tertiary hover:border-border-subtle',
      'transition-colors duration-150'
    ),
    outline: cn(
      'bg-transparent border border-border-default',
      'hover:bg-surface-secondary',
      'transition-colors duration-150'
    ),
    ghost: cn(
      'bg-surface-accent/10 border border-transparent',
      'hover:bg-surface-accent/20',
      'transition-colors duration-150'
    ),
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md',
        'text-text-primary font-normal',
        'select-none',
        sizeStyles[size],
        variantStyles[variant],
        disabled && 'opacity-50 pointer-events-none',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <span className="truncate max-w-[100px]" title={value}>
        {value}
      </span>

      {count !== undefined && count > 0 && (
        <span className="text-text-tertiary font-medium shrink-0">
          {count}
        </span>
      )}

      {removable && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className={cn(
            'flex items-center justify-center shrink-0',
            'w-3.5 h-3.5 -mr-0.5 ml-0.5',
            'rounded-sm',
            'text-text-tertiary hover:text-status-error',
            'hover:bg-status-error/10',
            'transition-colors duration-150'
          )}
          aria-label={`删除 ${value}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

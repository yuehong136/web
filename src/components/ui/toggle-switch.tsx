import React from 'react'
import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
  className?: string
  leftLabel?: string  // 左侧标签，如 "禁用"
  rightLabel?: string // 右侧标签，如 "启用"
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className,
  leftLabel,
  rightLabel
}) => {
  const sizeClasses = {
    sm: {
      switch: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4'
    },
    md: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'h-7 w-[52px]',
      thumb: 'h-6 w-6',
      translate: 'translate-x-[26px]'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={cn('flex items-center', className)}>
      {leftLabel && (
        <span className={cn(
          'text-sm font-medium mr-3 transition-colors duration-200'
        )} style={{ color: checked ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
          {leftLabel}
        </span>
      )}
      
      <div className="flex flex-col">
        {label && (
          <label className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        
        <button
          type="button"
          className={cn(
            // 基础样式
            'relative inline-flex shrink-0 cursor-pointer rounded-full',
            // 边框
            'border-2 border-transparent',
            // 过渡动画 - 更平滑的 200ms 过渡
            'transition-all duration-200 ease-out',
            // 焦点样式 - 现代化的 ring 效果
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            // 尺寸
            currentSize.switch,
            // 禁用状态
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            backgroundColor: checked 
              ? 'var(--color-components-switch-bg-checked)' 
              : 'var(--color-components-switch-bg)',
            '--tw-ring-color': 'var(--color-state-focus)',
            '--tw-ring-offset-color': 'var(--color-background-body)'
          } as React.CSSProperties}
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
        >
          <span className="sr-only">
            {label || (checked ? '启用' : '禁用')}
          </span>
          
          {/* 滑块 - 现代化样式 */}
          <span
            className={cn(
              // 基础样式
              'pointer-events-none inline-block rounded-full',
              // 过渡动画 - 弹性效果
              'transition-transform duration-200 ease-out',
              // 阴影 - 现代化的多层阴影
              'shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]',
              // 尺寸和位置
              currentSize.thumb,
              checked ? currentSize.translate : 'translate-x-0'
            )}
            style={{ backgroundColor: 'var(--color-components-switch-thumb)' }}
          />
        </button>
        
        {description && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      
      {rightLabel && (
        <span className={cn(
          'text-sm font-medium ml-3 transition-colors duration-200',
          checked && 'font-semibold'
        )} style={{ color: checked ? 'var(--color-text-accent)' : 'var(--color-text-muted)' }}>
          {rightLabel}
        </span>
      )}
    </div>
  )
}

export { ToggleSwitch } 
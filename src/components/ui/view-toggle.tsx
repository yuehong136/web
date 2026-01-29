import * as React from 'react'
import { cn } from './utils'

/**
 * 视图切换组件
 * 用于在不同视图模式之间切换（如网格/列表视图）
 * 
 * 设计规范：
 * - 选中状态使用 components-button-primary 令牌（浅色黑/深色蓝）
 * - 未选中状态使用透明背景 + 次要文字色
 * - 自动支持深色/浅色模式切换
 * - 纯展示组件，通过 props 接收状态和回调
 */

export interface ViewToggleOption<T extends string = string> {
  value: T
  icon: React.ReactNode
  label?: string
}

export interface ViewToggleProps<T extends string = string> {
  /** 当前选中的值 */
  value: T
  /** 可选项列表 */
  options: ViewToggleOption<T>[]
  /** 值变化时的回调 */
  onChange: (value: T) => void
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 自定义类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
}

const sizeClasses = {
  sm: {
    container: 'h-8 p-0.5',
    button: 'px-2 h-full',
    icon: 'h-4 w-4',
  },
  md: {
    container: 'h-9 p-0.5',
    button: 'px-2.5 h-full',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'h-10 p-1',
    button: 'px-3 h-full',
    icon: 'h-5 w-5',
  },
}

export function ViewToggle<T extends string = string>({
  value,
  options,
  onChange,
  size = 'md',
  className,
  disabled = false,
}: ViewToggleProps<T>) {
  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg gap-0.5',
        sizes.container,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        border: '1px solid var(--color-border-default)',
        backgroundColor: 'var(--color-background-subtle)',
      }}
      role="group"
      aria-label="视图切换"
    >
      {options.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={option.label}
            title={option.label}
            className={cn(
              // 基础样式
              'inline-flex items-center justify-center rounded-md transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset',
              sizes.button,
              // 选中/未选中状态 - 使用 CSS 类确保样式正确应用
              isSelected ? 'view-toggle-selected' : 'view-toggle-unselected',
              // 禁用状态
              disabled && 'pointer-events-none'
            )}
          >
            <span className={cn(sizes.icon, '[&>svg]:h-full [&>svg]:w-full')}>
              {option.icon}
            </span>
          </button>
        )
      })}
    </div>
  )
}

ViewToggle.displayName = 'ViewToggle'

export default ViewToggle

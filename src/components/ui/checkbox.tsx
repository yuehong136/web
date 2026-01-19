'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean
}

/**
 * Checkbox 组件 - 基于 Radix UI Checkbox 原语
 * 
 * 使用 Radix UI 提供完整的无障碍支持：
 * - 正确的键盘导航 (Space 键切换)
 * - 正确的 ARIA 属性
 * - 点击整个组件区域都能触发选中
 * 
 * @example
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 * <Checkbox indeterminate /> // 半选状态
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate = false, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // 基础样式
      'peer size-4 shrink-0 rounded-sm border outline-0 transition-colors',
      // 默认状态 - 未选中
      'border-[var(--color-border-default)] bg-[var(--color-background-surface)]',
      // 未选中时的 hover 状态
      'data-[state=unchecked]:hover:border-[var(--color-border-accent)] data-[state=unchecked]:hover:bg-[var(--color-surface-secondary)]',
      // focus 状态
      'focus-visible:ring-2 focus-visible:ring-[var(--color-border-accent)] focus-visible:ring-offset-2',
      // disabled 状态
      'disabled:cursor-not-allowed disabled:opacity-50',
      // checked 状态 - 使用设计令牌
      'data-[state=checked]:bg-[var(--color-components-checkbox-bg-checked)] data-[state=checked]:border-[var(--color-components-checkbox-border-checked)] data-[state=checked]:text-[var(--color-components-checkbox-icon)]',
      // checked 状态的 hover - 保持选中样式，稍微变亮
      'data-[state=checked]:hover:opacity-90',
      // indeterminate 状态
      'data-[state=indeterminate]:bg-[var(--color-components-checkbox-bg-checked)] data-[state=indeterminate]:border-[var(--color-components-checkbox-border-checked)] data-[state=indeterminate]:text-[var(--color-components-checkbox-icon)]',
      // indeterminate 状态的 hover
      'data-[state=indeterminate]:hover:opacity-90',
      className
    )}
    checked={indeterminate ? 'indeterminate' : checked}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      {indeterminate ? (
        <Minus className="size-3" />
      ) : (
        <Check className="size-3" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
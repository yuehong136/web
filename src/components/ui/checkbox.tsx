'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
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
      'peer size-icon-sm shrink-0 rounded-radius-sm border outline-0 transition-colors duration-150 motion-reduce:transition-none',
      'border-line-strong bg-surface',
      'data-[state=unchecked]:hover:border-line-strong',
      'focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-accent-solid data-[state=checked]:bg-accent-solid data-[state=checked]:text-accent-on-solid',
      'data-[state=indeterminate]:border-accent-solid data-[state=indeterminate]:bg-accent-solid data-[state=indeterminate]:text-accent-on-solid',
      className,
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

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Badge 徽标组件
 *
 * 用于标签、状态指示等场景
 *
 * 变体说明：
 * - default: 默认主色调
 * - secondary: 次要色调
 * - destructive: 危险/错误状态
 * - success: 成功状态
 * - warning: 警告状态
 * - outline: 轮廓样式
 * - blue: 蓝色 (用于原始记忆、向量模型等信息标签)
 * - orange: 橙色 (用于程序记忆、可选变量等标签)
 * - purple: 紫色 (用于语义记忆等标签)
 * - green: 绿色 (用于情景记忆等标签)
 */
const badgeVariants = cva(
  // DreamJira lozenge: 4px corners, 12/16 medium text, a tight inline box.
  'inline-flex max-w-full shrink-0 items-center gap-space-xs rounded-radius-sm px-space-sm py-space-2xs text-xs leading-4 font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:outline-hidden',
  {
    variants: {
      variant: {
        default: 'bg-fill-muted text-fg-muted',
        secondary: 'bg-sunken text-fg-muted',
        destructive: 'bg-danger-soft text-danger-fg',
        success: 'bg-success-soft text-success-fg',
        warning: 'bg-warning-soft text-warning-fg',
        outline: 'border border-line text-fg-muted',
        blue: 'bg-avatar-6-bg text-avatar-6-fg',
        orange: 'bg-avatar-2-bg text-avatar-2-fg',
        purple: 'bg-avatar-7-bg text-avatar-7-fg',
        green: 'bg-avatar-4-bg text-avatar-4-fg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

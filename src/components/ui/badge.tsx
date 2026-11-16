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
  'inline-flex max-w-full shrink-0 items-center gap-space-xs rounded-radius-sm px-space-sm py-space-2xs text-xs leading-4 font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-offset-2 focus-visible:outline-hidden',
  {
    variants: {
      variant: {
        default: 'bg-components-badge-bg text-components-badge-text',
        secondary: 'bg-background-subtle text-text-secondary',
        destructive:
          'bg-components-badge-error-bg text-components-badge-error-text',
        success:
          'bg-components-badge-success-bg text-components-badge-success-text',
        warning:
          'bg-components-badge-warning-bg text-components-badge-warning-text',
        outline: 'border border-border-default text-text-secondary',
        blue: 'bg-components-badge-blue-bg text-components-badge-blue-text',
        orange:
          'bg-components-badge-orange-bg text-components-badge-orange-text',
        purple:
          'bg-components-badge-purple-bg text-components-badge-purple-text',
        green: 'bg-components-badge-green-bg text-components-badge-green-text',
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

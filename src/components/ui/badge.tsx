import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' | 'blue' | 'orange'
}

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
 * - blue: 蓝色 (用于向量模型等信息标签)
 * - orange: 橙色 (用于可选变量等标签)
 */
const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      style={getVariantStyles(variant)}
      {...props}
    />
  )
}

function getVariantStyles(variant: BadgeProps['variant']): React.CSSProperties {
  switch (variant) {
    case 'default':
      return {
        backgroundColor: 'var(--color-components-badge-bg)',
        color: 'var(--color-components-badge-text)',
      }
    case 'secondary':
      return {
        backgroundColor: 'var(--color-background-subtle)',
        color: 'var(--color-text-secondary)',
      }
    case 'destructive':
      return {
        backgroundColor: 'var(--color-status-error-bg)',
        color: 'var(--color-status-error-text)',
      }
    case 'success':
      return {
        backgroundColor: 'var(--color-status-success-bg)',
        color: 'var(--color-status-success-text)',
      }
    case 'warning':
      return {
        backgroundColor: 'var(--color-status-warning-bg)',
        color: 'var(--color-status-warning-text)',
      }
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border-default)',
      }
    case 'blue':
      return {
        backgroundColor: 'var(--color-components-badge-blue-bg)',
        color: 'var(--color-components-badge-blue-text)',
      }
    case 'orange':
      return {
        backgroundColor: 'var(--color-components-badge-orange-bg)',
        color: 'var(--color-components-badge-orange-text)',
      }
    default:
      return {
        backgroundColor: 'var(--color-components-badge-bg)',
        color: 'var(--color-components-badge-text)',
      }
  }
}

export { Badge }
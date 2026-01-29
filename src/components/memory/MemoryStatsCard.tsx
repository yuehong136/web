/**
 * 记忆库统计卡片组件
 * 风格与知识库管理页面保持一致
 */

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MemoryStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isUp: boolean
  }
  /** 颜色主题，对应不同的状态色 */
  color?: 'info' | 'success' | 'warning' | 'purple'
  className?: string
}

// 图标背景色映射 - 与知识库页面一致的风格
const iconStyles = {
  info: {
    bg: 'var(--color-state-info-subtle)',
    text: 'var(--color-state-info)',
  },
  success: {
    bg: 'var(--color-state-success-subtle)',
    text: 'var(--color-state-success)',
  },
  warning: {
    bg: 'var(--color-state-warning-subtle)',
    text: 'var(--color-state-warning)',
  },
  purple: {
    bg: 'var(--color-state-info-subtle)',
    text: 'var(--color-state-info)',
  },
}

export const MemoryStatsCard: React.FC<MemoryStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'info',
  className,
}) => {
  const style = iconStyles[color]

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: style.bg }}
        >
          <Icon className="h-5 w-5" style={{ color: style.text }} />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-text-secondary">
            {title}
          </p>
          <div className="flex items-baseline gap-space-sm">
            <p className="text-2xl font-bold text-text-primary">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  trend.isUp ? 'text-text-success' : 'text-text-error'
                )}
              >
                {trend.isUp ? (
                  <TrendingUp className="w-icon-xs h-icon-xs mr-0.5" />
                ) : (
                  <TrendingDown className="w-icon-xs h-icon-xs mr-0.5" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

MemoryStatsCard.displayName = 'MemoryStatsCard'

/**
 * 团队统计卡片组件
 * 扁平卡片：分类色图标底 + 悬停时的焦点边框与 elevation 阴影
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'info' | 'success' | 'warning' | 'purple'
  className?: string
}

const toneClasses = {
  info: 'bg-components-badge-blue-bg text-components-badge-blue-text',
  success: 'bg-components-badge-green-bg text-components-badge-green-text',
  warning: 'bg-components-badge-orange-bg text-components-badge-orange-text',
  purple: 'bg-components-badge-purple-bg text-components-badge-purple-text',
} as const

export const TeamStatsCard: React.FC<TeamStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-components-card-border bg-components-card-bg p-5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-state-focus hover:shadow-elevation-medium',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            toneClasses[color],
          )}
        >
          <Icon className="size-icon-lg" />
        </div>

        {/* 文本 */}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium text-text-secondary">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-text-primary">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  )
}

TeamStatsCard.displayName = 'TeamStatsCard'

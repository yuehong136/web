/**
 * 记忆库统计卡片组件
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
  gradient?: 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const gradientClasses = {
  blue: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
  green: 'from-green-500/10 to-teal-500/10 dark:from-green-500/20 dark:to-teal-500/20',
  purple: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20',
  orange: 'from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20',
}

const iconBgClasses = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
}

export const MemoryStatsCard: React.FC<MemoryStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'blue',
  className,
}) => {
  return (
    <Card
      className={cn(
        'p-4 bg-gradient-to-br border-border-default',
        gradientClasses[gradient],
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2.5 rounded-xl',
            iconBgClasses[gradient]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-secondary truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-text-primary">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  trend.isUp ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isUp ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
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

/**
 * 团队统计卡片组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Card } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface TeamStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'info' | 'success' | 'warning' | 'purple'
}

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

export const TeamStatsCard: React.FC<TeamStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
}) => {
  const style = iconStyles[color]

  return (
    <Card className="p-4">
      <div className="flex items-center">
        <div className="p-2 rounded-lg" style={{ backgroundColor: style.bg }}>
          <Icon className="h-5 w-5" style={{ color: style.text }} />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text-primary">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </Card>
  )
}

TeamStatsCard.displayName = 'TeamStatsCard'

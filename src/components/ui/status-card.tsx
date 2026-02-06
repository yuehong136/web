import React, { memo } from 'react'
import { cn } from '@/lib/utils'

interface StatusCardProps {
  title: string
  icon: React.ReactNode
  status: 'green' | 'red' | 'yellow'
  metrics: Record<string, string | number>
  error?: string
  className?: string
}

const statusConfig = {
  green: {
    label: '正常',
    border: 'border-l-state-success',
    badgeBg: 'bg-state-success-subtle',
    badgeText: 'text-state-success',
    iconBg: 'bg-state-success-subtle',
    iconText: 'text-state-success',
    dotBg: 'bg-state-success',
  },
  red: {
    label: '异常',
    border: 'border-l-state-error',
    badgeBg: 'bg-state-error-subtle',
    badgeText: 'text-state-error',
    iconBg: 'bg-state-error-subtle',
    iconText: 'text-state-error',
    dotBg: 'bg-state-error',
  },
  yellow: {
    label: '警告',
    border: 'border-l-state-warning',
    badgeBg: 'bg-state-warning-subtle',
    badgeText: 'text-state-warning',
    iconBg: 'bg-state-warning-subtle',
    iconText: 'text-state-warning',
    dotBg: 'bg-state-warning',
  },
} as const

const StatusCard: React.FC<StatusCardProps> = memo(({
  title,
  icon,
  status,
  metrics,
  error,
  className
}) => {
  const config = statusConfig[status]

  // 提取响应时间作为主要指标
  const responseTime = metrics['响应时间']
  const otherMetrics = Object.entries(metrics).filter(([key]) => key !== '响应时间')

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border-default bg-components-card-bg',
        'border-l-[3px] transition-all duration-200',
        'hover:shadow-elevation-low hover:border-border-strong',
        config.border,
        className
      )}
    >
      <div className="p-5">
        {/* Header: icon + title + status badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', config.iconBg)}>
              <span className={config.iconText}>{icon}</span>
            </div>
            <h3 className="text-sm font-semibold text-text-primary leading-tight">{title}</h3>
          </div>
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
            config.badgeBg, config.badgeText
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', config.dotBg)} />
            {config.label}
          </span>
        </div>

        {/* Primary metric: response time */}
        {responseTime && (
          <div className="mb-3">
            <p className="text-xs text-text-tertiary mb-0.5">响应时间</p>
            <p className="text-2xl font-semibold text-text-primary tracking-tight font-mono">
              {responseTime}
            </p>
          </div>
        )}

        {/* Secondary metrics */}
        {otherMetrics.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-border-subtle">
            {otherMetrics.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">{key}</span>
                <span className="font-medium text-text-secondary font-mono">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-2.5 bg-state-error-subtle rounded-lg">
            <p className="text-xs text-text-error leading-relaxed">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
})

StatusCard.displayName = 'StatusCard'

export { StatusCard }

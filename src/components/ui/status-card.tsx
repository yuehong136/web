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
    border: 'border-l-components-system-status-ok-border',
    badgeBg: 'bg-components-system-status-ok-bg',
    badgeText: 'text-components-system-status-ok-text',
    iconBg: 'bg-components-system-status-ok-bg',
    iconText: 'text-components-system-status-ok-text',
    dotBg: 'bg-components-system-status-ok-text',
  },
  red: {
    label: '异常',
    border: 'border-l-components-system-status-error-border',
    badgeBg: 'bg-components-system-status-error-bg',
    badgeText: 'text-components-system-status-error-text',
    iconBg: 'bg-components-system-status-error-bg',
    iconText: 'text-components-system-status-error-text',
    dotBg: 'bg-components-system-status-error-text',
  },
  yellow: {
    label: '警告',
    border: 'border-l-components-system-status-warning-border',
    badgeBg: 'bg-components-system-status-warning-bg',
    badgeText: 'text-components-system-status-warning-text',
    iconBg: 'bg-components-system-status-warning-bg',
    iconText: 'text-components-system-status-warning-text',
    dotBg: 'bg-components-system-status-warning-text',
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
        'relative rounded-xl border border-components-system-status-card-border bg-components-system-status-card-bg shadow-components-system-status-card-shadow',
        'border-l-[3px] transition-all duration-200',
        'hover:border-components-system-status-card-border-hover',
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
            <h3 className="text-sm font-semibold text-components-system-header-title leading-tight">{title}</h3>
          </div>
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold',
            status === 'green' && 'border-components-system-status-ok-border',
            status === 'yellow' && 'border-components-system-status-warning-border',
            status === 'red' && 'border-components-system-status-error-border',
            config.badgeBg, config.badgeText
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', config.dotBg)} />
            {config.label}
          </span>
        </div>

        {/* Primary metric: response time */}
        {responseTime && (
          <div className="mb-3">
            <p className="mb-0.5 text-xs text-components-system-header-description">响应时间</p>
            <p className="font-mono text-2xl font-semibold tracking-tight text-components-system-header-title">
              {responseTime}
            </p>
          </div>
        )}

        {/* Secondary metrics */}
        {otherMetrics.length > 0 && (
          <div className="space-y-1.5 border-t border-components-system-section-divider pt-3">
            {otherMetrics.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-components-system-version-tag-label">{key}</span>
                <span className="font-mono font-medium text-components-system-version-tag-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 rounded-lg border border-components-system-health-error-border bg-components-system-health-error-bg p-2.5">
            <p className="text-xs leading-relaxed text-components-system-health-error-text">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
})

StatusCard.displayName = 'StatusCard'

export { StatusCard }

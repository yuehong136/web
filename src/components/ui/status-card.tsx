import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
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
    labelKey: 'common.statusCard.healthy',
    border: 'border-l-success-line',
    badgeBg: 'bg-success-soft',
    badgeText: 'text-success-fg',
    iconBg: 'bg-success-soft',
    iconText: 'text-success-fg',
    dotBg: 'bg-success-fg',
    metricText: 'text-success-fg',
  },
  red: {
    labelKey: 'common.statusCard.unhealthy',
    border: 'border-l-danger-line',
    badgeBg: 'bg-danger-soft',
    badgeText: 'text-danger-fg',
    iconBg: 'bg-danger-soft',
    iconText: 'text-danger-fg',
    dotBg: 'bg-danger-fg',
    metricText: 'text-danger-fg',
  },
  yellow: {
    labelKey: 'common.statusCard.warning',
    border: 'border-l-warning-line',
    badgeBg: 'bg-warning-soft',
    badgeText: 'text-warning-fg',
    iconBg: 'bg-warning-soft',
    iconText: 'text-warning-fg',
    dotBg: 'bg-warning-fg',
    metricText: 'text-warning-fg',
  },
} as const

const StatusCard: React.FC<StatusCardProps> = memo(
  ({ title, icon, status, metrics, error, className }) => {
    const { t } = useTranslation()
    const config = statusConfig[status]
    const maxSecondaryMetrics = 4

    // 提取响应时间作为主要指标；'响应时间' 是调用方传入的指标 key，不是展示文案
    const responseTime = metrics['响应时间']
    const otherMetrics = Object.entries(metrics).filter(
      ([key]) => key !== '响应时间',
    )
    const displayedSecondaryMetrics = otherMetrics.slice(0, maxSecondaryMetrics)
    const remainingSecondaryMetricsCount = Math.max(
      otherMetrics.length - displayedSecondaryMetrics.length,
      0,
    )

    return (
      <div
        className={cn(
          'relative rounded-xl border border-line bg-raised shadow-elevation-low',
          'border-l-[3px] transition-all duration-200',
          'hover:border-line-strong hover:bg-accent-soft',
          config.border,
          className,
        )}
      >
        <div className="p-5">
          {/* Header: icon + title + status badge */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  config.iconBg,
                )}
              >
                <span className={config.iconText}>{icon}</span>
              </div>
              <h3 className="text-sm leading-tight font-semibold text-fg">
                {title}
              </h3>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold',
                status === 'green' && 'border-success-line',
                status === 'yellow' && 'border-warning-line',
                status === 'red' && 'border-danger-line',
                config.badgeBg,
                config.badgeText,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', config.dotBg)} />
              {t(config.labelKey)}
            </span>
          </div>

          {/* Primary metric: response time */}
          {responseTime && (
            <div className="mb-3">
              <p className="mb-0.5 text-xs text-fg-muted">
                {t('common.statusCard.responseTime')}
              </p>
              <p
                className={cn(
                  'font-mono text-2xl font-semibold tracking-tight',
                  config.metricText,
                )}
              >
                {responseTime}
              </p>
            </div>
          )}

          {/* Secondary metrics */}
          {otherMetrics.length > 0 && (
            <div className="space-y-1.5 border-t border-line-subtle pt-3">
              {displayedSecondaryMetrics.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-fg-muted">{key}</span>
                  <span className="font-mono font-medium text-fg-muted">
                    {value}
                  </span>
                </div>
              ))}
              {remainingSecondaryMetricsCount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">
                    {t('common.statusCard.moreMetrics')}
                  </span>
                  <span className="font-medium text-accent-fg">
                    +{remainingSecondaryMetricsCount}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 rounded-lg border border-danger-line bg-danger-soft p-2.5">
              <p className="text-xs leading-relaxed text-danger-fg">{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  },
)

StatusCard.displayName = 'StatusCard'

export { StatusCard }

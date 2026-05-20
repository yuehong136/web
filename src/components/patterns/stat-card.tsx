import React from 'react'
import { cn } from '@/lib/utils'
import { SectionCard } from './section-card'

type StatTone = 'neutral' | 'info' | 'success' | 'warning' | 'error'

interface StatCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title: React.ReactNode
  value: React.ReactNode
  icon?: React.ReactNode
  tone?: StatTone
  description?: React.ReactNode
}

const toneClasses: Record<StatTone, string> = {
  neutral: 'bg-background-subtle text-text-secondary',
  info: 'bg-status-info-subtle text-status-info',
  success: 'bg-status-success-subtle text-status-success',
  warning: 'bg-status-warning-subtle text-status-warning',
  error: 'bg-status-error-subtle text-status-error',
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  tone = 'neutral',
  description,
  className,
  ...props
}) => {
  return (
    <SectionCard padding="default" className={className} {...props}>
      <div className="gap-space-md flex items-start justify-between">
        <div className="gap-space-xs flex flex-col">
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-2xl font-semibold text-text-primary">{value}</p>
          {description ? (
            <p className="text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'rounded-radius-lg flex h-10 w-10 items-center justify-center',
              toneClasses[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}

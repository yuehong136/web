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
  neutral: 'bg-sunken text-fg-muted',
  info: 'bg-info-soft text-info-fg',
  success: 'bg-success-soft text-success-fg',
  warning: 'bg-warning-soft text-warning-fg',
  error: 'bg-danger-soft text-danger-fg',
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
      <div className="flex items-start justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <p className="text-sm text-fg-muted">{title}</p>
          <p className="text-2xl font-semibold text-fg">{value}</p>
          {description ? (
            <p className="text-sm text-fg-muted">{description}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-radius-lg',
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

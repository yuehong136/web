import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  actions?: React.ReactNode
  padding?: 'none' | 'sm' | 'default' | 'lg'
  children: React.ReactNode
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  actions,
  padding = 'default',
  children,
  className,
  ...props
}) => {
  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'rounded-radius-xl border border-components-console-border bg-components-console-surface',
        className,
      )}
      {...props}
    >
      {title || actions ? (
        <div className="flex items-center justify-between gap-space-sm border-b border-border-subtle px-space-lg py-space-base">
          {title ? <h3 className="text-base font-semibold text-text-primary">{title}</h3> : <div />}
          {actions ? <div className="flex items-center gap-space-sm">{actions}</div> : null}
        </div>
      ) : null}
      <div
        className={cn(
          padding === 'none' && '',
          padding === 'sm' && 'p-space-base',
          padding === 'default' && 'p-space-lg',
          padding === 'lg' && 'p-space-xl',
        )}
      >
        {children}
      </div>
    </Card>
  )
}

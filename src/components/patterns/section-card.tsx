import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title?: React.ReactNode
  headingLevel?: 2 | 3
  actions?: React.ReactNode
  padding?: 'none' | 'sm' | 'default' | 'lg'
  children: React.ReactNode
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  headingLevel = 3,
  actions,
  padding = 'default',
  children,
  className,
  ...props
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
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
          {title ? (
            <Heading className="text-base font-semibold text-text-primary">
              {title}
            </Heading>
          ) : (
            <div />
          )}
          {actions ? (
            <div className="flex items-center gap-space-sm">{actions}</div>
          ) : null}
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

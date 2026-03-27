import React from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

export const PageSection: React.FC<PageSectionProps> = ({
  title,
  description,
  actions,
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn('flex flex-col gap-space-md', className)} {...props}>
      {title || description || actions ? (
        <div className="flex items-start justify-between gap-space-md">
          <div className="min-w-0 flex-1">
            {title ? <h2 className="text-lg font-semibold text-text-primary">{title}</h2> : null}
            {description ? <p className="mt-space-xs text-sm text-text-secondary">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-space-sm">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

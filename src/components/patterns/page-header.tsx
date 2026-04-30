import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  compact?: boolean
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumb,
  compact = false,
  className,
  ...props
}) => {
  return (
    <header
      className={cn(
        'border-b border-components-page-header-border',
        compact ? 'px-space-lg py-space-base' : 'px-space-lg py-space-lg',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-space-lg">
        <div className="min-w-0 flex-1">
          {breadcrumb ? (
            <div className={cn(compact ? 'mb-space-xs' : 'mb-space-sm')}>{breadcrumb}</div>
          ) : null}
          <div className="flex flex-col gap-space-xs">
            <h1 className="text-2xl font-semibold text-components-page-header-title">{title}</h1>
            {description ? (
              <p className="max-w-3xl text-sm text-components-page-header-description">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-space-sm">{actions}</div> : null}
      </div>
    </header>
  )
}

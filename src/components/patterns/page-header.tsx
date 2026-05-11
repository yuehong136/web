import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  compact?: boolean
  align?: 'start' | 'center'
  surface?: 'default' | 'elevated'
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumb,
  compact = false,
  align = 'start',
  surface = 'default',
  className,
  ...props
}) => {
  return (
    <header
      className={cn(
        'border-b border-components-page-header-border',
        surface === 'elevated'
          ? 'bg-background-surface'
          : 'bg-components-page-header-bg',
        compact ? 'px-space-lg py-space-base' : 'px-space-lg py-space-lg',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'gap-space-lg flex justify-between',
          align === 'center' ? 'items-center' : 'items-start',
        )}
      >
        <div className="min-w-0 flex-1">
          {breadcrumb ? (
            <div className={cn(compact ? 'mb-space-xs' : 'mb-space-sm')}>
              {breadcrumb}
            </div>
          ) : null}
          <div className="gap-space-xs flex flex-col">
            <h1 className="text-2xl font-semibold text-components-page-header-title">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm text-components-page-header-description">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="gap-space-sm flex shrink-0 items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}

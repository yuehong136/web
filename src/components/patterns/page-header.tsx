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
  /**
   * Content rendered to the left of the title block (avatar, icon, back button).
   * Vertically centered with the title group.
   */
  leading?: React.ReactNode
  compact?: boolean
  align?: 'start' | 'center'
  surface?: 'default' | 'elevated'
  /**
   * Title font size. Defaults to `'lg'` (text-2xl). Use `'md'` (text-xl) for
   * dense detail headers (e.g. resource detail with avatar + stats).
   */
  titleSize?: 'md' | 'lg'
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumb,
  leading,
  compact = false,
  align = 'start',
  surface = 'default',
  titleSize = 'lg',
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
        <div className="gap-space-base flex min-w-0 flex-1 items-center">
          {leading ? (
            <div className="gap-space-sm flex shrink-0 items-center">
              {leading}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            {breadcrumb ? (
              <div className={cn(compact ? 'mb-space-xs' : 'mb-space-sm')}>
                {breadcrumb}
              </div>
            ) : null}
            <div className="gap-space-xs flex flex-col">
              <h1
                className={cn(
                  'font-semibold text-components-page-header-title',
                  titleSize === 'md' ? 'text-xl' : 'text-2xl',
                )}
              >
                {title}
              </h1>
              {description ? (
                <p className="max-w-3xl text-sm text-components-page-header-description">
                  {description}
                </p>
              ) : null}
            </div>
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

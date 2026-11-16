import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export interface PageTitleCrumb {
  label: ReactNode
  /** Route to the ancestor page. Without it the crumb is plain text. */
  to?: string
}

export interface PageTitleBarProps {
  title: ReactNode
  /** Ancestors shown before the title, e.g. the knowledge base name. */
  crumbs?: PageTitleCrumb[]
  /** Avatar or icon before the title. */
  leading?: ReactNode
  /** Item count shown after the title. */
  count?: ReactNode
  /** Screen-reader wording for the count ("Apps: 20"). */
  countLabel?: string
  /** Second line: `InlineStats` or a short description. */
  subline?: ReactNode
  /** Header actions; put the primary action last. */
  actions?: ReactNode
  /**
   * `page` is the template's own 48px header row. `workbench` is the same
   * content laid into the shell card header: one line, the subline beside
   * the title, crumbs and subline dropped on narrow screens.
   */
  placement?: 'page' | 'workbench'
  className?: string
}

/**
 * The 48px page head shared by collection and detail templates: crumbs, the
 * h1 title, its count, an optional second line and trailing actions.
 */
export function PageTitleBar({
  title,
  crumbs = [],
  leading,
  count,
  countLabel,
  subline,
  actions,
  placement = 'page',
  className,
}: PageTitleBarProps) {
  const { t } = useTranslation()
  const workbench = placement === 'workbench'
  const Root = workbench ? 'div' : 'header'
  return (
    <Root
      data-slot="page-title-bar"
      data-placement={placement}
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-x-space-sm gap-y-space-xs',
        workbench
          ? 'min-w-0 flex-1'
          : 'min-h-[var(--workbench-header-height)] border-b border-border-subtle py-space-sm pr-space-sm pl-space-md',
        className,
      )}
    >
      {leading ? (
        <div className={cn('flex shrink-0', workbench && 'max-md:hidden')}>
          {leading}
        </div>
      ) : null}
      <div
        className={cn(
          'flex min-w-0 flex-1',
          workbench
            ? 'basis-40 items-center gap-space-sm'
            : 'basis-60 flex-col gap-space-2xs',
        )}
      >
        <div className="flex min-w-0 items-center gap-space-xs">
          {crumbs.length ? (
            <nav
              aria-label={t('common.patterns.breadcrumb')}
              className={cn(
                'flex min-w-0 shrink items-center gap-space-xs text-sm text-text-secondary',
                workbench && 'max-md:hidden',
              )}
            >
              {crumbs.map((crumb, index) => (
                <Fragment key={index}>
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="truncate rounded-radius-sm outline-hidden hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate">{crumb.label}</span>
                  )}
                  <span aria-hidden="true" className="text-text-tertiary">
                    /
                  </span>
                </Fragment>
              ))}
            </nav>
          ) : null}
          <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-text-primary">
            {title}
          </h1>
          {count !== undefined && count !== null ? (
            <span className="shrink-0 text-sm text-text-tertiary tabular-nums">
              {countLabel ? (
                <span className="sr-only">{countLabel}</span>
              ) : null}
              <span aria-hidden={countLabel ? true : undefined}>{count}</span>
            </span>
          ) : null}
        </div>
        {subline ? (
          <div
            data-slot="page-title-subline"
            className={cn(
              'min-w-0',
              workbench && 'hidden shrink-2 truncate md:block',
            )}
          >
            {subline}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-space-sm">
          {actions}
        </div>
      ) : null}
    </Root>
  )
}

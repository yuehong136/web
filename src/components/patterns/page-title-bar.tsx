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
  className,
}: PageTitleBarProps) {
  const { t } = useTranslation()
  return (
    <header
      data-slot="page-title-bar"
      className={cn(
        'flex min-h-[var(--workbench-header-height)] shrink-0 flex-wrap items-center gap-x-space-sm gap-y-space-xs border-b border-border-subtle py-space-sm pr-space-sm pl-space-md',
        className,
      )}
    >
      {leading ? <div className="flex shrink-0">{leading}</div> : null}
      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-space-2xs">
        <div className="flex min-w-0 items-center gap-space-xs">
          {crumbs.length ? (
            <nav
              aria-label={t('common.patterns.breadcrumb')}
              className="flex min-w-0 shrink items-center gap-space-xs text-sm text-text-secondary"
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
        {subline ? <div className="min-w-0">{subline}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-space-sm">
          {actions}
        </div>
      ) : null}
    </header>
  )
}

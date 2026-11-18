import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ContextRailGroup } from '@/components/patterns/context-rail'

export const SecondaryNavigationContent = ({
  title,
  groups,
  currentPath,
  backLink,
  children,
  onNavigate,
  contentOnly = false,
  touchTargets = false,
  scroll = 'self',
  headerDivider = true,
  quickActions,
}: {
  title: string
  groups: ContextRailGroup[]
  currentPath: string
  backLink?: { href: string; label: string }
  children?: ReactNode
  onNavigate?: () => void
  contentOnly?: boolean
  touchTargets?: boolean
  /** Mobile navigation delegates scrolling to the sheet viewport. */
  scroll?: 'self' | 'parent'
  /** The docked panel sits on the shell tone without a rule under its title. */
  headerDivider?: boolean
  /** Panel-top actions such as "New chat" and "Search", above the groups. */
  quickActions?: ReactNode
}) => (
  <>
    {contentOnly && quickActions ? (
      <div className="shrink-0 pt-space-sm">{quickActions}</div>
    ) : null}
    {!contentOnly && (
      <>
        <header
          className={cn(
            'flex min-h-[calc(var(--control-height)+var(--space-sm))] shrink-0 items-center px-space-base py-space-sm',
            headerDivider && 'border-b border-line-subtle',
          )}
        >
          <p className="truncate text-sm font-semibold text-fg">{title}</p>
        </header>
        {quickActions}
        {backLink && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mx-space-sm mt-space-sm shrink-0 justify-start text-fg-muted"
          >
            <Link to={backLink.href} onClick={onNavigate}>
              <ArrowLeft className="size-icon-sm" aria-hidden="true" />
              {backLink.label}
            </Link>
          </Button>
        )}
        {groups.length > 0 && (
          <nav
            aria-label={title}
            className={cn(
              'p-space-sm',
              scroll === 'self' && 'min-h-0 overflow-y-auto overscroll-contain',
              !children && 'flex-1',
            )}
          >
            {groups.map((group, index) => (
              <section
                key={group.label ?? index}
                aria-label={group.label}
                className={cn(
                  index > 0 &&
                    'mt-space-base border-t border-line-subtle pt-space-sm',
                )}
              >
                {group.label && (
                  <p
                    aria-hidden="true"
                    className="px-space-sm py-space-xs text-xs font-medium text-fg-subtle"
                  >
                    {group.label}
                  </p>
                )}
                <ul className="flex flex-col gap-space-2xs">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = item.matcher
                      ? item.matcher(currentPath)
                      : currentPath === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => {
                            item.onSelect?.()
                            onNavigate?.()
                          }}
                          className={cn(
                            'flex min-h-[var(--control-height-sm)] items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus',
                            touchTargets && 'min-h-11',
                            active
                              ? 'bg-accent-soft font-medium text-accent-fg'
                              : 'text-fg-muted hover:bg-fill-hover hover:text-fg',
                          )}
                        >
                          {Icon && (
                            <Icon
                              className="size-icon-sm shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {item.title}
                          </span>
                          {Boolean(item.badge) && (
                            <span
                              aria-label={item.badgeLabel}
                              className="rounded-radius-sm bg-sunken px-space-xs text-xs text-fg-muted tabular-nums"
                            >
                              {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </nav>
        )}
      </>
    )}
    {children && (
      <div
        data-secondary-content
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          scroll === 'self' && 'min-h-0 overflow-hidden',
        )}
      >
        {children}
      </div>
    )}
  </>
)

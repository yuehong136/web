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
}) => (
  <>
    {!contentOnly && (
      <>
        <header className="flex min-h-[calc(var(--control-height)+var(--space-sm))] shrink-0 items-center border-b border-border-subtle px-space-base py-space-sm">
          <p className="truncate text-sm font-semibold text-text-primary">
            {title}
          </p>
        </header>
        {backLink && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mx-space-sm mt-space-sm shrink-0 justify-start text-text-secondary"
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
                    'mt-space-base border-t border-border-subtle pt-space-sm',
                )}
              >
                {group.label && (
                  <p
                    aria-hidden="true"
                    className="px-space-sm py-space-xs text-xs font-medium text-text-tertiary"
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
                            'flex min-h-[var(--control-height-sm)] items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus',
                            touchTargets && 'min-h-11',
                            active
                              ? 'bg-state-selected-bg font-medium text-state-selected-text'
                              : 'text-text-secondary hover:bg-state-hover hover:text-text-primary',
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
                              className="rounded-radius-sm bg-background-subtle px-space-xs text-xs text-text-secondary tabular-nums"
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

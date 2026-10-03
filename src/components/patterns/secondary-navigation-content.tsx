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
}: {
  title: string
  groups: ContextRailGroup[]
  currentPath: string
  backLink?: { href: string; label: string }
  children?: ReactNode
  onNavigate?: () => void
  contentOnly?: boolean
  touchTargets?: boolean
}) => (
  <>
    {!contentOnly && (
      <>
        <header className="flex min-h-12 shrink-0 items-center border-b border-border-subtle px-space-base">
          <p className="truncate text-sm font-medium">{title}</p>
        </header>
        {backLink && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mx-space-sm mt-space-sm justify-start text-text-secondary"
          >
            <Link to={backLink.href} onClick={onNavigate}>
              <ArrowLeft className="size-icon-sm" />
              {backLink.label}
            </Link>
          </Button>
        )}
        <nav aria-label={title} className="min-h-0 overflow-y-auto p-space-sm">
          {groups.map((group, index) => (
            <ul
              key={group.label ?? index}
              aria-label={group.label}
              className={cn(
                'flex flex-col gap-space-xs',
                index > 0 &&
                  'mt-space-sm border-t border-border-subtle pt-space-sm',
              )}
            >
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
                        'flex min-h-9 items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
                        touchTargets && 'min-h-[44px]',
                        active
                          ? 'bg-components-sidebar-item-bg-active font-medium text-text-primary'
                          : 'text-text-secondary hover:bg-state-hover hover:text-text-primary',
                      )}
                    >
                      {Icon && <Icon className="size-icon-sm shrink-0" />}
                      <span className="flex-1 truncate">{item.title}</span>
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
          ))}
        </nav>
      </>
    )}
    {children}
  </>
)

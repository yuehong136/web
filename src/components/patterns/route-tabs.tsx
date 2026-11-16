import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface RouteTab {
  to: string
  label: ReactNode
  /** Small count after the label. */
  count?: ReactNode
  /** Match the route exactly (for an index tab). */
  end?: boolean
}

export interface RouteTabsProps {
  /** Accessible name of the tab navigation. */
  label: string
  tabs: RouteTab[]
  className?: string
}

/**
 * Underlined section links for detail pages whose tabs are routes. Links keep
 * history and deep links working; the current one gets aria-current="page".
 * For in-page state tabs use ui/tabs inside `DetailTemplate`'s `tabs` slot.
 */
export function RouteTabs({ label, tabs, className }: RouteTabsProps) {
  return (
    <nav
      aria-label={label}
      className={cn('flex min-w-0 items-stretch gap-space-md', className)}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              '-mb-px inline-flex items-center gap-space-xs border-b-2 border-transparent text-sm whitespace-nowrap text-text-secondary outline-hidden transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus',
              isActive && 'border-text-primary font-medium text-text-primary',
            )
          }
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className="text-xs text-text-tertiary tabular-nums">
              {tab.count}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  )
}

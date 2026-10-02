import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface SettingsRailItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  matcher?: (pathname: string) => boolean
}

export interface SettingsRailGroup {
  label?: string
  items: SettingsRailItem[]
}

interface SettingsRailUser {
  avatar?: string
  nickname?: string
  username?: string
  email?: string
}

interface SettingsRailProps extends React.HTMLAttributes<HTMLElement> {
  groups: SettingsRailGroup[]
  currentPath: string
  footer?: React.ReactNode
  user?: SettingsRailUser | null
  /**
   * Accessible label for the inner `<nav>` landmark. Recommended whenever the
   * rail is used as primary navigation (e.g. settings rail, knowledge nav).
   */
  navAriaLabel?: string
}

export const SettingsRail: React.FC<SettingsRailProps> = ({
  groups,
  currentPath,
  footer,
  user,
  navAriaLabel,
  className,
  ...props
}) => {
  return (
    <aside
      className={cn(
        'flex h-full w-[280px] shrink-0 flex-col border-r border-components-settings-rail-border',
        className,
      )}
      {...props}
    >
      {user ? (
        <div className="border-b border-border-subtle px-space-lg py-space-base">
          <div className="flex items-center gap-space-base">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="h-10 w-10 rounded-radius-full object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-radius-full text-sm font-semibold text-text-inverted"
                style={{
                  background: 'var(--color-components-gradient-secondary)',
                }}
              >
                {user.nickname?.[0] || user.username?.[0] || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-components-settings-rail-title">
                {user.nickname || user.username || '用户'}
              </p>
              <p className="truncate text-xs text-components-settings-rail-description">
                {user.email || ''}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label={navAriaLabel}
        className="flex-1 overflow-auto py-space-sm"
      >
        {groups.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`}>
            {group.label ? (
              <div className="px-space-lg pt-space-sm pb-space-xs">
                <span className="text-xs font-medium tracking-wider text-components-settings-rail-section-text uppercase">
                  {group.label}
                </span>
              </div>
            ) : null}
            <div className="space-y-1 px-space-sm">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.matcher
                  ? item.matcher(currentPath)
                  : currentPath === item.href

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'relative flex items-center gap-space-sm rounded-radius-lg px-space-base py-space-sm text-sm transition-colors',
                      isActive
                        ? 'bg-components-sidebar-item-bg-active font-semibold text-components-sidebar-item-text-active shadow-xs before:absolute before:top-2 before:bottom-2 before:left-0 before:w-1 before:rounded-r-full before:bg-state-focus'
                        : 'font-medium text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                    <span className="truncate font-medium">{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {footer ? <div className="px-space-sm py-space-sm">{footer}</div> : null}
    </aside>
  )
}

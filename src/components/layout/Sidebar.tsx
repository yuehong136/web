import * as React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { SidebarUtilities } from '@/components/layout/sidebar-utilities'
import { navItems } from '@/components/layout/sidebar-config'
import {
  getWorkbenchSection,
  type SecondaryNavigation,
  type WorkbenchSection,
} from '@/components/layout/workbench-navigation'
import { NavigationTooltip } from '@/components/ui/navigation-tooltip'
import { NavigationFlyout } from '@/components/patterns/navigation-flyout'
import { SecondaryNavigationContent } from '@/components/patterns/secondary-navigation-content'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
} from '@/components/ui/action-menu'

export const primaryNavItems = navItems.filter((item) =>
  (
    [ROUTES.HOME, ROUTES.EXPLORE, ROUTES.KNOWLEDGE, ROUTES.AGENTS] as string[]
  ).includes(item.href),
)
export const moreNavItems = navItems.filter(
  (item) => !primaryNavItems.includes(item),
)

interface SidebarProps {
  className?: string
  secondaryCollapsed: boolean
  section: WorkbenchSection
  navigation: Record<WorkbenchSection, SecondaryNavigation>
}

/** The primary rail stays fixed; only the adjacent secondary panel collapses. */
export const Sidebar = ({
  className,
  secondaryCollapsed,
  section,
  navigation,
}: SidebarProps) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const scope = `${pathname}:${secondaryCollapsed}`
  const [preview, setPreview] = React.useState<{
    scope: string
    section: WorkbenchSection | null
  }>({ scope, section: null })
  if (preview.scope !== scope) setPreview({ scope, section: null })
  const flyout = preview.scope === scope ? preview.section : null
  const setFlyout: React.Dispatch<
    React.SetStateAction<WorkbenchSection | null>
  > = (next) =>
    setPreview((current) => ({
      scope,
      section: typeof next === 'function' ? next(current.section) : next,
    }))
  return (
    <aside
      aria-label={t('layout.sidebar.primaryNavigation')}
      data-primary-navigation
      className={cn(
        'flex h-full w-[56px] shrink-0 flex-col border-r border-border-subtle bg-components-sidebar-bg py-space-sm',
        className,
      )}
    >
      <nav
        aria-label={t('layout.sidebar.primaryNavigation')}
        className="flex flex-col gap-space-xs px-space-sm"
      >
        {primaryNavItems.map((item) => {
          const itemSection = getWorkbenchSection(item.href)
          const definition = navigation[itemSection]
          const title = t(item.titleKey)
          const Icon = item.icon
          const link = (
            <Link
              to={item.href}
              aria-label={title}
              aria-current={section === itemSection ? 'page' : undefined}
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-radius-lg focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden focus-visible:ring-inset',
                section === itemSection
                  ? 'bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active'
                  : 'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
              )}
            >
              <Icon className="size-icon-md" />
            </Link>
          )
          return secondaryCollapsed ? (
            <NavigationFlyout
              key={item.href}
              label={title}
              open={flyout === itemSection}
              onOpenChange={(open) =>
                setFlyout((current) =>
                  open ? itemSection : current === itemSection ? null : current,
                )
              }
              content={
                <SecondaryNavigationContent
                  {...definition}
                  currentPath={pathname}
                  onNavigate={() => setFlyout(null)}
                >
                  {definition.content}
                </SecondaryNavigationContent>
              }
            >
              {link}
            </NavigationFlyout>
          ) : (
            <NavigationTooltip key={item.href} content={title}>
              {link}
            </NavigationTooltip>
          )
        })}
        <ActionMenu>
          <NavigationTooltip content={t('layout.sidebar.more')}>
            <ActionMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'w-full text-text-secondary',
                  section === 'tools' &&
                    'bg-components-sidebar-item-bg-active text-text-primary',
                )}
                aria-label={t('layout.sidebar.more')}
              >
                <MoreHorizontal className="size-icon-md" />
              </Button>
            </ActionMenuTrigger>
          </NavigationTooltip>
          <ActionMenuContent side="right" align="start" sideOffset={8}>
            {moreNavItems.map((item) => {
              const Icon = item.icon
              return (
                <ActionMenuItem key={item.href} asChild>
                  <NavLink to={item.href}>
                    <Icon className="size-icon-sm" />
                    {t(item.titleKey)}
                  </NavLink>
                </ActionMenuItem>
              )
            })}
          </ActionMenuContent>
        </ActionMenu>
      </nav>
      <div className="flex-1" />
      <div className="border-t border-border-subtle px-space-xs pt-space-sm">
        <SidebarUtilities collapsed />
      </div>
    </aside>
  )
}

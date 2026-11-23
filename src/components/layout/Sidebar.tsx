import * as React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal, SquarePen } from 'lucide-react'
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
import { Tooltip } from '@/components/ui/tooltip'
import { NavigationFlyout } from '@/components/patterns/navigation-flyout'
import { SecondaryNavigationContent } from '@/components/patterns/secondary-navigation-content'
import { WorkbenchQuickActions } from '@/components/layout/workbench-quick-actions'
import { TideMark } from '@/components/layout/brand-mark'
import { Button } from '@/components/ui/button'
import {
  getCommandShortcutKeys,
  ProductCommandId,
  useOptionalApplicationCommands,
} from '@/lib/commands'
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
        'flex h-full min-h-0 w-[calc(var(--nav-rail-item)+var(--space-md))] shrink-0 flex-col bg-canvas py-space-sm',
        className,
      )}
    >
      <div className="flex shrink-0 justify-center pt-space-2xs pb-space-base">
        <TideMark size="md" />
      </div>
      <RailNewChat />
      <nav
        aria-label={t('layout.sidebar.primaryNavigation')}
        className="flex min-h-0 flex-col gap-space-xs overflow-y-auto overscroll-contain px-space-sm"
      >
        {primaryNavItems.map((item) => {
          const itemSection = getWorkbenchSection(item.href)
          const definition = navigation[itemSection]
          const title = t(item.titleKey)
          const Icon = item.icon
          const link = (
            <Link
              to={item.href}
              onKeyDown={(event) => {
                if (
                  !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
                )
                  return
                const links = Array.from(
                  event.currentTarget
                    .closest('nav')
                    ?.querySelectorAll<HTMLElement>('a[href]') ?? [],
                )
                const current = links.indexOf(event.target as HTMLElement)
                if (current < 0) return
                event.preventDefault()
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? links.length - 1
                      : (current +
                          (event.key === 'ArrowDown' ? 1 : -1) +
                          links.length) %
                        links.length
                links[next]?.focus()
              }}
              aria-label={title}
              aria-current={section === itemSection ? 'page' : undefined}
              className={cn(
                'flex min-h-[var(--nav-rail-item)] w-full items-center justify-center rounded-radius-lg transition-colors focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-hidden focus-visible:ring-inset motion-reduce:transition-none',
                section === itemSection
                  ? 'bg-fill-selected text-fg shadow-elevation-low'
                  : 'text-fg-muted hover:bg-fill-hover hover:text-fg',
              )}
            >
              <Icon className="size-icon-md" aria-hidden="true" />
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
                  quickActions={
                    <WorkbenchQuickActions
                      newConversation={itemSection === 'home'}
                      onDismiss={() => setFlyout(null)}
                    />
                  }
                >
                  {definition.content}
                </SecondaryNavigationContent>
              }
            >
              {link}
            </NavigationFlyout>
          ) : (
            <Tooltip
              key={item.href}
              content={title}
              side="right"
              sideOffset={12}
              delayDuration={100}
              asChild
              portal
            >
              {link}
            </Tooltip>
          )
        })}
        <ActionMenu>
          <Tooltip
            content={t('layout.sidebar.more')}
            side="right"
            sideOffset={12}
            delayDuration={100}
            asChild
            portal
          >
            <ActionMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-[var(--nav-rail-item)] w-full text-fg-muted',
                  section === 'tools' && 'bg-fill-selected text-fg',
                )}
                aria-label={t('layout.sidebar.more')}
              >
                <MoreHorizontal className="size-icon-md" aria-hidden="true" />
              </Button>
            </ActionMenuTrigger>
          </Tooltip>
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
      <div className="min-h-space-sm flex-1" />
      <div className="border-t border-line-subtle px-space-xs pt-space-sm">
        <SidebarUtilities collapsed />
      </div>
    </aside>
  )
}

/**
 * "New chat" stays on the rail in every section and with the panel collapsed,
 * as in ChatGPT and Codex; it runs the same command as the shortcut.
 */
function RailNewChat() {
  const { t } = useTranslation()
  const commands = useOptionalApplicationCommands()
  if (!commands) return null
  const keys = getCommandShortcutKeys(ProductCommandId.NEW_CONVERSATION)
  return (
    <div className="flex shrink-0 justify-center px-space-sm pb-space-sm">
      <Tooltip
        content={t('layout.sidebar.newChat')}
        shortcut={keys}
        side="right"
        asChild
        portal
      >
        <button
          type="button"
          data-rail-new-chat
          aria-label={t('layout.sidebar.newChat')}
          aria-keyshortcuts={keys
            ?.map((key) =>
              key === '⌘' ? 'Meta' : key === 'Ctrl' ? 'Control' : key,
            )
            .join('+')}
          onClick={() =>
            void commands.execute(ProductCommandId.NEW_CONVERSATION)
          }
          className="flex min-h-[var(--nav-rail-item)] w-full items-center justify-center rounded-radius-lg text-fg-muted transition-colors hover:bg-fill-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-hidden focus-visible:ring-inset motion-reduce:transition-none"
        >
          <SquarePen className="size-icon-md" aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  )
}

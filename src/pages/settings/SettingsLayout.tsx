import * as React from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Database,
  Server,
  Users,
  User,
  Activity,
  Key,
  UserCog,
  MessageCircleMore,
  Plug,
  Palette,
  Terminal,
  Waypoints,
} from 'lucide-react'
import { useUIStore } from '@/stores'
import { SidebarUtilities } from '@/components/layout/sidebar-utilities'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ConsolePageTemplate } from '@/components/page-templates'
import { ContextRail, type ContextRailGroup } from '@/components/patterns'
import { ROUTES } from '@/constants'
import { useRegisterSecondaryNavigation } from '@/components/layout/workbench-navigation'
import { usePendingTeamInvitations } from '@/hooks/use-pending-team-invitations'
import { useTeamStore } from '@/stores/team'
import { API_DOCS_PATH, API_KEYS_PATH, MCP_PATH } from './settings-routes'

export const SettingsIndexRedirect = () => {
  const { state } = useLocation()
  return <Navigate to={ROUTES.SETTINGS_PROFILE} state={state} replace />
}

export const SettingsLayout: React.FC = () => {
  const { t } = useTranslation()
  const { pendingCount } = usePendingTeamInvitations()
  const setActiveTab = useTeamStore((state) => state.setActiveTab)
  const location = useLocation()
  const [returnTo] = React.useState(() => {
    const origin = location.state?.returnTo
    return typeof origin === 'string' &&
      origin.startsWith('/') &&
      !origin.startsWith('//') &&
      !origin.startsWith('/settings')
      ? origin
      : '/home'
  })
  const railCollapsed = useUIStore((state) => state.contextSidebarCollapsed)
  const setRailCollapsed = useUIStore(
    (state) => state.setContextSidebarCollapsed,
  )

  const settingsGroups = React.useMemo<ContextRailGroup[]>(
    () => [
      {
        label: t('settings.groups.account'),
        items: [
          {
            title: t('settings.nav.profile'),
            href: '/settings/profile',
            icon: User,
          },
          {
            title: t('appearance.title'),
            href: '/settings/appearance',
            icon: Palette,
          },
        ],
      },
      {
        label: t('settings.groups.models'),
        items: [
          {
            title: t('settings.nav.modelProviders'),
            href: '/settings/model-providers',
            icon: Server,
          },
          {
            title: t('settings.nav.modelGateway'),
            href: '/settings/model-gateway',
            icon: Waypoints,
          },
        ],
      },
      {
        label: t('settings.groups.integrations'),
        items: [
          {
            title: t('settings.nav.mcp'),
            href: MCP_PATH,
            icon: Plug,
            matcher: (pathname) => pathname.startsWith(MCP_PATH),
          },
          {
            title: t('settings.nav.datasource'),
            href: '/settings/datasource',
            icon: Database,
            matcher: (pathname) => pathname.startsWith('/settings/datasource'),
          },
          {
            title: t('settings.nav.channels'),
            href: '/settings/channels',
            icon: MessageCircleMore,
          },
          {
            title: t('settings.nav.apiKeys'),
            href: API_KEYS_PATH,
            icon: Key,
          },
          {
            title: t('settings.nav.apiDocs'),
            href: API_DOCS_PATH,
            icon: BookOpen,
          },
        ],
      },
      {
        label: t('settings.groups.admin'),
        items: [
          {
            title: t('settings.nav.team'),
            href: '/settings/team',
            icon: Users,
            badge: pendingCount,
            badgeLabel: t('layout.invitations.pending', {
              count: pendingCount,
            }),
            onSelect:
              pendingCount > 0 ? () => setActiveTab('joined-teams') : undefined,
          },
          {
            title: t('settings.nav.userManagement'),
            href: '/settings/admin',
            icon: UserCog,
          },
          {
            title: t('sandbox.title'),
            href: '/settings/sandbox',
            icon: Terminal,
          },
          {
            title: t('settings.nav.systemStatus'),
            href: '/settings/system',
            icon: Activity,
          },
        ],
      },
    ],
    [t, pendingCount, setActiveTab],
  )

  const pathname = location.pathname.replace(/\/+$/, '') || '/'
  const currentItem = settingsGroups
    .flatMap((group) => group.items)
    .find((item) =>
      item.matcher ? item.matcher(pathname) : pathname.startsWith(item.href),
    )
  const pageTitles: Record<string, string> = {
    '/settings': t('settings.nav.profile'),
    [MCP_PATH]: t('mcp.servers.title'),
    '/settings/datasource-detail': t('datasource.configuration'),
  }
  const currentTitle =
    pageTitles[pathname] || currentItem?.title || t('settings.title')
  const isDatasourceDetail = pathname === '/settings/datasource-detail'
  const parentHref = isDatasourceDetail ? currentItem?.href : undefined
  const parentTitle = currentItem?.title
  // Data source details name the entity in their own h1, and the MCP page's
  // collection title bar is its h1; every other page's h1 is this crumb.
  const CurrentTitle =
    isDatasourceDetail || pathname === MCP_PATH ? 'span' : 'h1'
  const breadcrumb = React.useMemo(
    () => (
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap gap-space-xs">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink asChild>
              <Link to="/settings/profile">{t('settings.title')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {parentHref && (
            <>
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink asChild>
                  <Link to={parentHref}>{parentTitle}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            <CurrentTitle className="min-w-0 truncate text-sm font-medium">
              <BreadcrumbPage className="font-medium">
                {currentTitle}
              </BreadcrumbPage>
            </CurrentTitle>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
    [CurrentTitle, currentTitle, parentHref, parentTitle, t],
  )

  const navigationManaged = useRegisterSecondaryNavigation(
    React.useMemo(
      () => ({
        section: 'settings' as const,
        title: t('settings.title'),
        groups: settingsGroups,
        header: breadcrumb,
        backLink: {
          href: returnTo,
          label: t('layout.sidebar.backToWorkspace'),
        },
      }),
      [settingsGroups, breadcrumb, returnTo, t],
    ),
  )

  return (
    <ConsolePageTemplate
      rail={
        navigationManaged ? undefined : (
          <ContextRail
            title={t('settings.title')}
            navAriaLabel={t('settings.title')}
            groups={settingsGroups}
            currentPath={pathname}
            collapsed={railCollapsed}
            onCollapsedChange={setRailCollapsed}
            labels={{
              expand: t('layout.sidebar.expandPageNavigation'),
              collapse: t('layout.sidebar.collapsePageNavigation'),
              open: t('layout.sidebar.openPageNavigation'),
              close: t('layout.sidebar.closePageNavigation'),
            }}
            backLink={{
              href: returnTo,
              label: t('layout.sidebar.backToWorkspace'),
            }}
            footer={(collapsed) => <SidebarUtilities collapsed={collapsed} />}
          />
        )
      }
      header={
        !navigationManaged && (
          <div className="flex h-12 shrink-0 items-center border-b border-border-subtle px-space-lg">
            {breadcrumb}
          </div>
        )
      }
    >
      <div className="h-full bg-components-settings-content-bg">
        <Outlet />
      </div>
    </ConsolePageTemplate>
  )
}

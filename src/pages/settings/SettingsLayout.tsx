import * as React from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Database,
  Server,
  Users,
  User,
  Activity,
  Key,
  UserCog,
  MessageCircleMore,
  Plug,
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

export const SettingsIndexRedirect = () => {
  const { state } = useLocation()
  return <Navigate to={ROUTES.SETTINGS_PROFILE} state={state} replace />
}

export const SettingsLayout: React.FC = () => {
  const { t } = useTranslation()
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
        ],
      },
      {
        label: t('settings.groups.workspace'),
        items: [
          {
            title: t('settings.nav.team'),
            href: '/settings/team',
            icon: Users,
          },
          {
            title: t('settings.nav.modelProviders'),
            href: '/settings/model-providers',
            icon: Server,
          },
          {
            title: t('settings.nav.datasource'),
            href: '/settings/datasource',
            icon: Database,
            matcher: (pathname) => pathname.startsWith('/settings/datasource'),
          },
          {
            title: t('settings.nav.mcp'),
            href: '/settings/mcp-servers',
            icon: Plug,
            matcher: (pathname) => pathname.startsWith('/settings/mcp'),
          },
          {
            title: t('settings.nav.channels'),
            href: '/settings/channels',
            icon: MessageCircleMore,
          },
          {
            title: t('settings.nav.api'),
            href: '/settings/api-keys',
            icon: Key,
          },
        ],
      },
      {
        label: t('settings.groups.admin'),
        items: [
          {
            title: t('settings.nav.userManagement'),
            href: '/settings/admin',
            icon: UserCog,
          },
          {
            title: t('settings.nav.systemStatus'),
            href: '/settings/system',
            icon: Activity,
          },
        ],
      },
    ],
    [t],
  )

  const currentTitle =
    settingsGroups
      .flatMap((group) => group.items)
      .find((item) =>
        item.matcher
          ? item.matcher(location.pathname)
          : location.pathname.startsWith(item.href),
      )?.title || t('settings.title')

  const navigationManaged = useRegisterSecondaryNavigation(
    React.useMemo(
      () => ({
        section: 'settings' as const,
        title: t('settings.title'),
        groups: settingsGroups,
        backLink: {
          href: returnTo,
          label: t('layout.sidebar.backToWorkspace'),
        },
      }),
      [settingsGroups, returnTo, t],
    ),
  )

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList className="gap-space-xs">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/settings/profile">{t('settings.title')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )

  return (
    <ConsolePageTemplate
      rail={
        navigationManaged ? undefined : (
          <ContextRail
            title={t('settings.title')}
            navAriaLabel={t('settings.title')}
            groups={settingsGroups}
            currentPath={location.pathname}
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
        <div className="border-b border-border-subtle px-space-lg py-space-sm">
          {breadcrumb}
        </div>
      }
    >
      <div className="h-full bg-components-settings-content-bg">
        <Outlet />
      </div>
    </ConsolePageTemplate>
  )
}

import * as React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Database,
  Server,
  Users,
  User,
  House,
  Activity,
  LogOut,
  Key,
  UserCog,
  Settings as SettingsIcon,
  MessageCircleMore,
} from 'lucide-react'
import { useAuthStore } from '@/stores'
import { IconFontFill } from '@/components/ui/icon-font'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  PageHeader,
  SettingsRail,
  type SettingsRailGroup,
} from '@/components/patterns'

const McpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconFontFill name="mcp" className={className} />
)

export const SettingsLayout: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const defaultPageDescription = t('settings.description')
  const settingsGroups = React.useMemo<SettingsRailGroup[]>(
    () => [
      {
        label: t('settings.groups.workspace'),
        items: [
          {
            title: t('settings.nav.datasource'),
            href: '/settings/datasource',
            icon: Database,
          },
          {
            title: t('settings.nav.modelProviders'),
            href: '/settings/model-providers',
            icon: Server,
          },
          {
            title: t('settings.nav.mcp'),
            href: '/settings/mcp-servers',
            icon: McpIcon,
            matcher: (pathname) => pathname.startsWith('/settings/mcp'),
          },
          {
            title: t('settings.nav.channels'),
            href: '/settings/channels',
            icon: MessageCircleMore,
          },
        ],
      },
      {
        label: t('settings.groups.collaboration'),
        items: [
          {
            title: t('settings.nav.team'),
            href: '/settings/team',
            icon: Users,
          },
        ],
      },
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
        label: t('settings.groups.developer'),
        items: [
          {
            title: t('settings.nav.api'),
            href: '/settings/api-keys',
            icon: Key,
          },
        ],
      },
      {
        label: t('settings.groups.system'),
        items: [
          {
            title: t('settings.nav.systemStatus'),
            href: '/settings/system',
            icon: Activity,
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
        ],
      },
    ],
    [t],
  )

  const pageMeta = React.useMemo<
    Record<string, { title: string; description: string }>
  >(
    () => ({
      '/settings/datasource': {
        title: t('settings.nav.datasource'),
        description: defaultPageDescription,
      },
      '/settings/model-providers': {
        title: t('settings.nav.modelProviders'),
        description: defaultPageDescription,
      },
      '/settings/mcp-servers': {
        title: t('settings.nav.mcp'),
        description: defaultPageDescription,
      },
      '/settings/mcp-tools': {
        title: t('settings.nav.mcpTools'),
        description: defaultPageDescription,
      },
      '/settings/mcp-test': {
        title: t('settings.nav.mcpTest'),
        description: defaultPageDescription,
      },
      '/settings/mcp-batch': {
        title: t('settings.nav.mcpBatch'),
        description: defaultPageDescription,
      },
      '/settings/channels': {
        title: t('channel.title'),
        description: t('channel.description'),
      },
      '/settings/team': {
        title: t('settings.nav.team'),
        description: defaultPageDescription,
      },
      '/settings/profile': {
        title: t('settings.nav.profile'),
        description: t('settings.profileDescription'),
      },
      '/settings/system': {
        title: t('settings.nav.systemStatus'),
        description: defaultPageDescription,
      },
      '/settings/api-keys': {
        title: t('settings.nav.api'),
        description: defaultPageDescription,
      },
      '/settings/admin': {
        title: t('settings.nav.userManagement'),
        description: defaultPageDescription,
      },
    }),
    [defaultPageDescription, t],
  )

  const handleLogout = React.useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [logout])

  const currentMeta = pageMeta[location.pathname] || {
    title: t('settings.title'),
    description: defaultPageDescription,
  }

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList className="gap-space-xs">
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => navigate('/home')}
            className="rounded-radius-md p-space-xs hover:bg-surface-secondary inline-flex items-center"
          >
            <House className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => navigate('/settings/profile')}
            className="gap-space-xs inline-flex items-center"
          >
            <SettingsIcon className="h-4 w-4" />
            {t('settings.title')}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentMeta.title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )

  const railFooter = (
    <div className="px-space-sm">
      <Button
        variant="outline"
        className="w-full justify-center"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        {t('settings.logout')}
      </Button>
    </div>
  )

  return (
    <ConsolePageTemplate
      rail={
        <SettingsRail
          groups={settingsGroups}
          currentPath={location.pathname}
          footer={railFooter}
        />
      }
      header={
        <PageHeader
          title={currentMeta.title}
          description={currentMeta.description}
          breadcrumb={breadcrumb}
          compact
        />
      }
    >
      <div className="h-full bg-components-settings-content-bg">
        <Outlet />
      </div>
    </ConsolePageTemplate>
  )
}

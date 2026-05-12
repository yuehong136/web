import React, { useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
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

const settingsGroups: SettingsRailGroup[] = [
  {
    label: '工作空间',
    items: [
      { title: '数据源', href: '/settings/datasource', icon: Database },
      { title: '模型提供商', href: '/settings/model-providers', icon: Server },
      {
        title: 'MCP',
        href: '/settings/mcp-servers',
        icon: McpIcon,
        matcher: (pathname) => pathname.startsWith('/settings/mcp'),
      },
    ],
  },
  {
    label: '团队与协作',
    items: [{ title: '团队', href: '/settings/team', icon: Users }],
  },
  {
    label: '账户',
    items: [{ title: '个人资料', href: '/settings/profile', icon: User }],
  },
  {
    label: '开发者',
    items: [{ title: 'API', href: '/settings/api-keys', icon: Key }],
  },
  {
    label: '系统',
    items: [{ title: '系统状态', href: '/settings/system', icon: Activity }],
  },
  {
    label: '管理',
    items: [{ title: '用户管理', href: '/settings/admin', icon: UserCog }],
  },
]

const defaultPageDescription =
  '统一管理工作空间配置、团队能力和开发者接入能力。'

const pageMeta: Record<string, { title: string; description: string }> = {
  '/settings/datasource': {
    title: '数据源',
    description: defaultPageDescription,
  },
  '/settings/model-providers': {
    title: '模型提供商',
    description: defaultPageDescription,
  },
  '/settings/mcp-servers': {
    title: 'MCP',
    description: defaultPageDescription,
  },
  '/settings/mcp-tools': {
    title: 'MCP工具',
    description: defaultPageDescription,
  },
  '/settings/mcp-test': {
    title: 'MCP测试',
    description: defaultPageDescription,
  },
  '/settings/mcp-batch': {
    title: 'MCP批处理',
    description: defaultPageDescription,
  },
  '/settings/team': {
    title: '团队',
    description: defaultPageDescription,
  },
  '/settings/profile': {
    title: '个人资料',
    description: '管理您的头像、身份信息和账户安全设置。',
  },
  '/settings/system': {
    title: '系统状态',
    description: defaultPageDescription,
  },
  '/settings/api-keys': {
    title: 'API',
    description: defaultPageDescription,
  },
  '/settings/admin': {
    title: '用户管理',
    description: defaultPageDescription,
  },
}

export const SettingsLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [logout])

  const currentMeta = pageMeta[location.pathname] || {
    title: '设置',
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
            设置
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
        退出登录
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

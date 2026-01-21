import React, { useCallback } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { 
  Database, 
  Server,
  Users,
  User,
  Unplug,
  Sun,
  Moon,
  House
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores'
import { Theme, setTheme as setAppTheme, getResolvedTheme } from '@/themes'
import { IconFontFill } from '@/components/ui/icon-font'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }> | 'mcp'
}

const settingsItems: SidebarItem[] = [
  {
    title: '数据源',
    href: '/settings/datasource',
    icon: Database,
  },
  {
    title: '模型提供商',
    href: '/settings/model-providers',
    icon: Server,
  },
  {
    title: 'MCP',
    href: '/settings/mcp-servers',
    icon: 'mcp',
  },
  {
    title: '团队',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: '概要',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'API',
    href: '/settings/api-keys',
    icon: Unplug,
  }
]

// 主题切换组件 - 仿 ragflow 的太阳月亮开关
const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = React.useState(() => getResolvedTheme() === 'dark')

  React.useEffect(() => {
    const updateTheme = () => {
      setIsDark(getResolvedTheme() === 'dark')
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [])

  const handleThemeChange = useCallback((dark: boolean) => {
    setAppTheme(dark ? Theme.DARK : Theme.LIGHT)
    setIsDark(dark)
  }, [])

  return (
    <button
      type="button"
      aria-label="切换主题"
      aria-pressed={isDark}
      onClick={() => handleThemeChange(!isDark)}
      className="relative inline-flex h-8 w-16 items-center rounded-full border border-border bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span
        className="absolute inset-0.5 rounded-full bg-muted/40 dark:bg-muted/60"
        aria-hidden="true"
      />
      <span className="absolute inset-0.5 grid grid-cols-2" aria-hidden="true">
        <span
          className={cn(
            'col-span-1 flex items-center justify-center transition-all duration-300 ease-out',
            isDark ? 'col-start-2' : 'col-start-1'
          )}
        >
          <span className="h-6 w-6 rounded-full bg-background shadow-sm" />
        </span>
      </span>
      <span className="relative flex w-full items-center justify-between px-3 text-xs">
        <Sun
          className={cn(
            'h-4 w-4 transition-colors',
            isDark ? 'text-text-tertiary' : 'text-amber-400 drop-shadow'
          )}
        />
        <Moon
          className={cn(
            'h-4 w-4 transition-colors',
            isDark ? 'text-indigo-300 drop-shadow' : 'text-text-tertiary'
          )}
        />
      </span>
    </button>
  )
}

// 页面标题映射
const pageTitles: Record<string, string> = {
  '/settings/datasource': '数据源',
  '/settings/model-providers': '模型提供商',
  '/settings/mcp-servers': 'MCP',
  '/settings/mcp-tools': 'MCP工具',
  '/settings/mcp-test': 'MCP测试',
  '/settings/mcp-batch': 'MCP批处理',
  '/settings/team': '团队',
  '/settings/profile': '概要',
  '/settings/api-keys': 'API',
}

export const SettingsLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // 获取当前页面标题
  const currentTitle = pageTitles[location.pathname] || '设置'

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部面包屑导航 */}
      <header className="flex items-center bg-card border-b border-border px-5 py-4 shrink-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/home')}>
                <House className="w-4 h-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-[280px] bg-background flex flex-col border-r border-border shrink-0">
          {/* 用户信息 */}
          <div className="px-6 py-4 flex gap-3 items-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user?.nickname?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
            )}
            <p className="text-sm text-text-primary truncate">{user?.email || 'user@example.com'}</p>
          </div>

          {/* 导航菜单 */}
          <div className="flex-1 overflow-auto">
            {settingsItems.map((item, idx) => {
              const isActive = location.pathname === item.href || 
                (item.href === '/settings/mcp-servers' && location.pathname.startsWith('/settings/mcp'))
              
              return (
                <div key={idx} className="mx-6 my-2">
                  <Link to={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 p-3 h-auto',
                      isActive 
                        ? 'bg-primary/10 text-text-primary border border-primary/20' 
                        : 'bg-transparent text-text-secondary hover:bg-muted hover:text-text-primary'
                    )}
                  >
                      {item.icon === 'mcp' ? (
                        <IconFontFill name="mcp" className="w-5 h-5" />
                      ) : (
                        <item.icon className="w-5 h-5" />
                      )}
                      <span className="text-sm">{item.title}</span>
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* 底部区域 */}
          <div className="p-6 mt-auto border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-primary">v0.9.7</span>
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: implement logout
              }}
            >
              退出登录
            </Button>
          </div>
        </aside>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto bg-background">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
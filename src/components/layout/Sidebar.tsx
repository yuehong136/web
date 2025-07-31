import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Wrench,
  Server,
  Briefcase,
  Settings,
  User,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Compass,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import { useUIStore, useAuthStore } from '@/stores'
import { Theme, setTheme as setAppTheme, getTheme, getResolvedTheme } from '@/themes'

interface SidebarProps {
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const navItems: NavItem[] = [
  {
    title: '仪表板',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: '智能对话',
    href: ROUTES.CHAT,
    icon: MessageSquare,
    badge: 'New'
  },
  {
    title: '知识库',
    href: ROUTES.KNOWLEDGE,
    icon: BookOpen,
  },
  {
    title: '探索',
    href: ROUTES.EXPLORE,
    icon: Compass,
    badge: 'New'
  },
  {
    title: '工作室',
    href: ROUTES.STUDIO,
    icon: Briefcase,
  },
  {
    title: 'AI工具箱',
    href: ROUTES.AI_TOOLS,
    icon: Wrench,
  },
  {
    title: 'MCP服务器',
    href: ROUTES.MCP_SERVERS,
    icon: Server,
  },
  {
    title: '系统',
    href: ROUTES.SYSTEM,
    icon: Settings,
  },
]

export const Sidebar: React.FC<SidebarProps> = ({ 
  className 
}) => {
  const location = useLocation()
  const { notifications } = useUIStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  
  // 使用新的主题系统
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(getTheme())
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(getResolvedTheme())
  
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showThemeMenu, setShowThemeMenu] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)

  const unreadCount = notifications.length

  // 监听主题变化
  React.useEffect(() => {
    const updateTheme = () => {
      const theme = getTheme()
      const resolved = getResolvedTheme()
      setCurrentTheme(theme)
      setResolvedTheme(resolved)
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (getTheme() === Theme.SYSTEM) {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setAppTheme(newTheme)
    setCurrentTheme(newTheme)
    
    if (newTheme === Theme.SYSTEM) {
      const resolved = getResolvedTheme()
      setResolvedTheme(resolved)
    } else {
      setResolvedTheme(newTheme as 'light' | 'dark')
    }
    
    setShowThemeMenu(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const ThemeIcon = () => {
    switch (currentTheme) {
      case Theme.LIGHT:
        return <Sun className="h-6 w-6" />
      case Theme.DARK:
        return <Moon className="h-6 w-6" />
      case Theme.SYSTEM:
        return <Monitor className="h-6 w-6" />
      default:
        return <Monitor className="h-6 w-6" />
    }
  }

  return (
    <aside
      className={cn(
        "bg-components-sidebar-bg h-full flex flex-col transition-all duration-300 shadow-lg rounded-2xl",
        "w-24",
        className
      )}
    >
      {/* Logo区域 */}
      <div className="p-4 border-b border-components-sidebar-border rounded-t-2xl">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-2">
            <span className="text-white font-bold text-lg">MR</span>
          </div>
          <span className="text-xs text-components-sidebar-item-text font-medium whitespace-nowrap">Multi-RAG</span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-6">
        <div className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.href)
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active shadow-sm ring-1 ring-border-default"
                    : "text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-components-sidebar-item-text-active"
                )}
                title={item.title}
              >
                <Icon className={cn("h-6 w-6 mb-1", isActive ? "fill-current" : "")} />
                <span className="text-xs font-medium leading-none whitespace-nowrap">{item.title}</span>
                
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}

                {/* 活跃状态指示器 */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gray-900 rounded-r-full" />
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* 底部功能区域 */}
      <div className="p-2 border-t border-components-sidebar-border space-y-1 rounded-b-2xl">
        {/* 通知按钮 */}
        <div className="relative group">
          <Button
            variant="ghost"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-full flex items-center justify-center p-3 text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-components-sidebar-item-text-active rounded-xl transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* 悬停提示 */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-components-tooltip-bg text-components-tooltip-text text-sm rounded-lg shadow-components-tooltip-shadow border border-components-dropdown-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
            通知
          </div>

          {showNotifications && (
            <div className="absolute left-full bottom-0 ml-2 bg-components-dropdown-bg border border-components-dropdown-border rounded-lg shadow-components-dropdown-shadow py-2 w-80 z-50">
              <div className="px-4 py-2 border-b border-components-dropdown-border">
                <h3 className="font-medium text-components-dropdown-item-text">通知</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-components-dropdown-item-text text-sm">
                    暂无通知
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-components-dropdown-item-bg-hover border-b border-components-dropdown-border last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'error' ? 'bg-red-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' :
                          notification.type === 'success' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-components-dropdown-item-text">
                            {notification.title}
                          </p>
                          <p className="text-sm text-text-secondary mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-text-tertiary mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 主题切换 */}
        <div className="relative group">
          <Button
            variant="ghost"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="w-full flex items-center justify-center p-3 text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-components-sidebar-item-text-active rounded-xl transition-all duration-200"
          >
            <ThemeIcon />
          </Button>

          {/* 悬停提示 */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-components-dropdown-bg text-components-dropdown-item-text text-sm rounded-lg shadow-components-dropdown-shadow border border-components-dropdown-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
            主题设置
          </div>
          
          {showThemeMenu && (
            <div className="absolute left-full bottom-0 ml-2 bg-components-dropdown-bg border border-components-dropdown-border rounded-lg shadow-components-dropdown-shadow py-1 w-36 z-50">
              <button
                onClick={() => handleThemeChange(Theme.LIGHT)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-components-dropdown-item-bg-hover flex items-center gap-2 text-components-dropdown-item-text transition-colors",
                  currentTheme === Theme.LIGHT && "bg-components-dropdown-item-bg-hover"
                )}
              >
                <Sun className="h-4 w-4" />
                浅色主题
                {currentTheme === Theme.LIGHT && <Check className="h-4 w-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleThemeChange(Theme.DARK)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-components-dropdown-item-bg-hover flex items-center gap-2 text-components-dropdown-item-text transition-colors",
                  currentTheme === Theme.DARK && "bg-components-dropdown-item-bg-hover"
                )}
              >
                <Moon className="h-4 w-4" />
                深色主题
                {currentTheme === Theme.DARK && <Check className="h-4 w-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleThemeChange(Theme.SYSTEM)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-components-dropdown-item-bg-hover flex items-center gap-2 text-components-dropdown-item-text transition-colors",
                  currentTheme === Theme.SYSTEM && "bg-components-dropdown-item-bg-hover"
                )}
              >
                <Monitor className="h-4 w-4" />
                跟随系统
                {currentTheme === Theme.SYSTEM && <Check className="h-4 w-4 ml-auto" />}
              </button>
            </div>
          )}
        </div>

        {/* 用户信息 */}
        {isAuthenticated ? (
          <div className="relative group">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-center p-3 text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-components-sidebar-item-text-active rounded-xl transition-all duration-200"
            >
              <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.nickname?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
            </Button>

            {/* 悬停提示 */}
            <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-components-tooltip-bg text-components-tooltip-text text-sm rounded-lg shadow-components-tooltip-shadow border border-components-dropdown-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
              {user?.nickname || user?.username || '用户'}
            </div>

            {showUserMenu && (
              <div className="absolute left-full bottom-0 ml-2 bg-components-dropdown-bg border border-components-dropdown-border rounded-lg shadow-components-dropdown-shadow py-1 w-48 z-50">
                <div className="px-3 py-2 border-b border-components-dropdown-border">
                  <p className="text-sm font-medium text-components-dropdown-item-text">
                    {user?.nickname || user?.username}
                  </p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>
                
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-components-dropdown-item-bg-hover flex items-center gap-2 text-components-dropdown-item-text">
                  <User className="h-4 w-4" />
                  个人资料
                </button>
                
                <a 
                  href="/settings"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-components-dropdown-item-bg-hover flex items-center gap-2 text-components-dropdown-item-text"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  设置
                </a>
                
                <div className="border-t border-components-dropdown-border mt-1 pt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-components-dropdown-item-bg-hover flex items-center gap-2 text-text-error"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center p-3 text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-components-sidebar-item-text-active rounded-xl transition-all duration-200"
            >
              <User className="h-5 w-5" />
            </Button>

            {/* 悬停提示 */}
            <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-components-tooltip-bg text-components-tooltip-text text-sm rounded-lg shadow-components-tooltip-shadow border border-components-dropdown-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
              登录
            </div>
          </div>
        )}

        {/* 版本信息 */}
        <div className="text-center pt-2">
          <p className="text-xs text-text-tertiary">v0.6.0</p>
        </div>
      </div>

      {/* 点击外部关闭菜单的处理 */}
      {(showUserMenu || showThemeMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowThemeMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </aside>
  )
}
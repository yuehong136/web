import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Wrench,
  GitBranch,
  Server,
  Settings,
  User,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import { useUIStore, useAuthStore } from '@/stores'

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
    title: 'AI工具箱',
    href: ROUTES.AI_TOOLS,
    icon: Wrench,
  },
  {
    title: '工作流',
    href: ROUTES.WORKFLOW,
    icon: GitBranch,
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
  const { theme, setTheme, notifications } = useUIStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showThemeMenu, setShowThemeMenu] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)

  const unreadCount = notifications.length

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
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
    switch (theme) {
      case 'light':
        return <Sun className="h-6 w-6" />
      case 'dark':
        return <Moon className="h-6 w-6" />
      default:
        return <Monitor className="h-6 w-6" />
    }
  }

  return (
    <aside
      className={cn(
        "bg-white h-full flex flex-col transition-all duration-300 shadow-lg rounded-2xl",
        "w-24",
        className
      )}
    >
      {/* Logo区域 */}
      <div className="p-4 border-b border-gray-200 rounded-t-2xl">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-2">
            <span className="text-white font-bold text-lg">MR</span>
          </div>
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Multi-RAG</span>
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
                    ? "bg-gray-100 text-gray-900 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
      <div className="p-2 border-t border-gray-200 space-y-1 rounded-b-2xl">
        {/* 通知按钮 */}
        <div className="relative group">
          <Button
            variant="ghost"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-full flex items-center justify-center p-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* 悬停提示 */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-white text-gray-900 text-sm rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
            通知
          </div>

          {showNotifications && (
            <div className="absolute left-full bottom-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-80 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">通知</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    暂无通知
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'error' ? 'bg-red-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' :
                          notification.type === 'success' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
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
            className="w-full flex items-center justify-center p-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all duration-200"
          >
            <ThemeIcon />
          </Button>

          {/* 悬停提示 */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-white text-gray-900 text-sm rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
            主题设置
          </div>
          
          {showThemeMenu && (
            <div className="absolute left-full bottom-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-50">
              <button
                onClick={() => handleThemeChange('light')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-900"
              >
                <Sun className="h-4 w-4" />
                浅色主题
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-900"
              >
                <Moon className="h-4 w-4" />
                深色主题
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-900"
              >
                <Monitor className="h-4 w-4" />
                跟随系统
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
              className="w-full flex items-center justify-center p-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all duration-200"
            >
              <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.nickname?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
            </Button>

            {/* 悬停提示 */}
            <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-white text-gray-900 text-sm rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
              {user?.nickname || user?.username || '用户'}
            </div>

            {showUserMenu && (
              <div className="absolute left-full bottom-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nickname || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-900">
                  <User className="h-4 w-4" />
                  个人资料
                </button>
                
                <a 
                  href="/settings"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-900"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  设置
                </a>
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
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
              className="w-full flex items-center justify-center p-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all duration-200"
            >
              <User className="h-5 w-5" />
            </Button>

            {/* 悬停提示 */}
            <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-white text-gray-900 text-sm rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
              登录
            </div>
          </div>
        )}

        {/* 版本信息 */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">v0.6.0</p>
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
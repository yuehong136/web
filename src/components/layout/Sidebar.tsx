import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
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
  Check,
  Workflow,
  Home,
  PanelLeftClose
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { useUIStore, useAuthStore } from '@/stores'
import { Theme, setTheme as setAppTheme, getTheme } from '@/themes'

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: '首页',
    href: ROUTES.HOME,
    icon: Home,
  },
  {
    title: '智能对话',
    href: ROUTES.CHAT,
    icon: MessageSquare,
  },
  {
    title: 'MCP实验场',
    href: '/mcp-chat',
    icon: MessageSquare,
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
  },
  {
    title: '智能体',
    href: ROUTES.AGENTS,
    icon: Workflow,
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
  className,
  collapsed = false,
  onCollapsedChange
}) => {
  const location = useLocation()
  const { notifications } = useUIStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  
  // 内部折叠状态（如果没有外部控制）
  const [internalCollapsed, setInternalCollapsed] = React.useState(true) // 默认收起
  const isCollapsed = onCollapsedChange ? collapsed : internalCollapsed
  const setCollapsed = onCollapsedChange || setInternalCollapsed
  
  // 使用新的主题系统
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(getTheme())
  
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showThemeMenu, setShowThemeMenu] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)

  const unreadCount = notifications.length

  const handleThemeChange = (newTheme: Theme) => {
    setAppTheme(newTheme)
    setCurrentTheme(newTheme)
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
        return <Sun className="h-5 w-5" />
      case Theme.DARK:
        return <Moon className="h-5 w-5" />
      case Theme.SYSTEM:
        return <Monitor className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  return (
    <aside
      className={cn(
        "bg-white h-full flex flex-col rounded-2xl",
        // 使用 will-change 优化动画性能
        "transition-[width] duration-300 ease-out will-change-[width]",
        isCollapsed ? "w-16" : "w-56",
        className
      )}
    >
      {/* Logo区域 */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer min-w-0"
            onClick={isCollapsed ? () => setCollapsed(false) : undefined}
            title={isCollapsed ? "展开侧边栏" : undefined}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">MR</span>
            </div>
            {/* 文字使用独立的动画，延迟出现并滑入 */}
            {/* 长标题允许折行，若想单行显示改回 whitespace-nowrap */}
            <span 
              className={cn(
                "text-base font-semibold text-gray-900 break-words max-w-[160px]",
                "transition-all duration-300 ease-out",
                isCollapsed 
                  ? "opacity-0 w-0 translate-x-[-10px] pointer-events-none" 
                  : "opacity-100 w-auto translate-x-0 delay-100"
              )}
            >
              Datav AI平台
            </span>
          </div>
          {/* 折叠按钮 - 放在logo旁边 */}
          <button
            onClick={() => setCollapsed(!isCollapsed)}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200",
              isCollapsed 
                ? "opacity-0 w-0 pointer-events-none" 
                : "opacity-100 delay-150"
            )}
            title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="py-4">
        <div className={cn(
          "space-y-1 transition-[padding] duration-300",
          isCollapsed ? "px-2" : "px-3"
        )}>
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = item.href === ROUTES.AI_TOOLS
              ? (location.pathname.startsWith(ROUTES.AI_TOOLS) || location.pathname.startsWith('/tools'))
              : item.href === ROUTES.HOME 
                ? (location.pathname === ROUTES.HOME || location.pathname === '/')
                : location.pathname.startsWith(item.href)
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex items-center rounded-xl group",
                  "transition-all duration-200 ease-out",
                  isCollapsed 
                    ? "justify-center p-2.5" 
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className={cn(
                  "flex-shrink-0 h-5 w-5 transition-transform duration-200",
                  isActive ? "text-blue-600" : ""
                )} />
                {/* 菜单文字使用延迟动画，每个菜单项延迟递增 */}
                <span 
                  className={cn(
                    "text-sm font-medium whitespace-nowrap",
                    "transition-all duration-300 ease-out",
                    isCollapsed 
                      ? "opacity-0 w-0 translate-x-[-10px] pointer-events-none" 
                      : "opacity-100 w-auto translate-x-0"
                  )}
                  style={{
                    transitionDelay: isCollapsed ? '0ms' : `${50 + index * 20}ms`
                  }}
                >
                  {item.title}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* 中间空白区域 - 将底部推到最下面 */}
      <div className="flex-1" />

      {/* 底部功能区域 */}
      <div className={cn(
        "border-t border-gray-100 space-y-1 py-2",
        "transition-[padding] duration-300",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {/* 通知按钮 */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "w-full flex items-center rounded-xl transition-all duration-200",
              isCollapsed 
                ? "justify-center p-2.5" 
                : "gap-3 px-3 py-2",
              "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            title={isCollapsed ? "通知" : undefined}
          >
            <Bell className="h-5 w-5 flex-shrink-0" />
            <span 
              className={cn(
                "text-sm whitespace-nowrap",
                "transition-all duration-300 ease-out",
                isCollapsed 
                  ? "opacity-0 w-0 translate-x-[-10px] pointer-events-none" 
                  : "opacity-100 w-auto translate-x-0 delay-[250ms]"
              )}
            >
              通知
            </span>
            {unreadCount > 0 && (
              <span className={cn(
                "bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center",
                isCollapsed ? "absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center" : "ml-auto px-1.5 py-0.5"
              )}>
                {isCollapsed ? '•' : (unreadCount > 9 ? '9+' : unreadCount)}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={cn(
              "absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50",
              isCollapsed ? "left-full ml-2 w-80" : "left-0 right-0 w-80"
            )}>
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">通知</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                    暂无通知
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
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
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={cn(
              "w-full flex items-center rounded-xl transition-all duration-200",
              isCollapsed 
                ? "justify-center p-2.5" 
                : "gap-3 px-3 py-2",
              "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            title={isCollapsed ? "主题设置" : undefined}
          >
            <ThemeIcon />
            <span 
              className={cn(
                "text-sm whitespace-nowrap",
                "transition-all duration-300 ease-out",
                isCollapsed 
                  ? "opacity-0 w-0 translate-x-[-10px] pointer-events-none" 
                  : "opacity-100 w-auto translate-x-0 delay-[270ms]"
              )}
            >
              主题
            </span>
          </button>
          
          {showThemeMenu && (
            <div className={cn(
              "absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50",
              isCollapsed ? "left-full ml-2 w-36" : "left-0 w-36"
            )}>
              <button
                onClick={() => handleThemeChange(Theme.LIGHT)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors",
                  currentTheme === Theme.LIGHT && "bg-gray-50"
                )}
              >
                <Sun className="h-4 w-4" />
                浅色主题
                {currentTheme === Theme.LIGHT && <Check className="h-4 w-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleThemeChange(Theme.DARK)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors",
                  currentTheme === Theme.DARK && "bg-gray-50"
                )}
              >
                <Moon className="h-4 w-4" />
                深色主题
                {currentTheme === Theme.DARK && <Check className="h-4 w-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleThemeChange(Theme.SYSTEM)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors",
                  currentTheme === Theme.SYSTEM && "bg-gray-50"
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
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "w-full flex items-center rounded-xl transition-all duration-200",
                isCollapsed 
                  ? "justify-center p-2.5" 
                  : "gap-3 px-3 py-2",
                "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={isCollapsed ? (user?.nickname || user?.username || '用户') : undefined}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {user?.nickname?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
              <span 
                className={cn(
                  "text-sm truncate whitespace-nowrap",
                  "transition-all duration-300 ease-out",
                  isCollapsed 
                    ? "opacity-0 w-0 translate-x-[-10px] pointer-events-none" 
                    : "opacity-100 w-auto translate-x-0 delay-[290ms]"
                )}
              >
                {user?.nickname || user?.username || '用户'}
              </span>
            </button>

            {showUserMenu && (
              <div className={cn(
                "absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50",
                isCollapsed ? "left-full ml-2 w-48" : "left-0 right-0"
              )}>
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nickname || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4" />
                  个人资料
                </button>
                
                <NavLink 
                  to="/settings"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  设置
                </NavLink>
                
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
          <NavLink
            to="/auth/login"
            className={cn(
              "flex items-center rounded-xl transition-all duration-200",
              isCollapsed 
                ? "justify-center p-2.5" 
                : "gap-3 px-3 py-2",
              "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            title={isCollapsed ? "登录" : undefined}
          >
            <User className="h-5 w-5 flex-shrink-0" />
            <span 
              className={cn(
                "text-sm whitespace-nowrap",
                "transition-all duration-300 ease-out",
                isCollapsed 
                  ? "opacity-0 w-0 translate-x-[-10px] pointer-events-none" 
                  : "opacity-100 w-auto translate-x-0 delay-[290ms]"
              )}
            >
              登录
            </span>
          </NavLink>
        )}

        {/* 版本信息 */}
        <div 
          className={cn(
            "text-center pt-2 overflow-hidden",
            "transition-all duration-300 ease-out",
            isCollapsed 
              ? "opacity-0 h-0" 
              : "opacity-100 h-auto delay-[350ms]"
          )}
        >
          <p className="text-xs text-gray-400 whitespace-nowrap">v0.9.0</p>
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

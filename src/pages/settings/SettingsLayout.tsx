import React from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Server,
  Key,
  Settings as SettingsIcon,
  ArrowLeft,
  Sparkles,
  Brain,
  Wrench,
  FlaskConical,
  Workflow
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string
  gradient?: string
}

const settingsItems: SidebarItem[] = [
  {
    title: '个人资料',
    href: '/settings/profile',
    icon: User,
    description: '管理您的基本信息和头像',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: '安全设置', 
    href: '/settings/security',
    icon: Shield,
    description: '密码、两步验证等安全选项',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: '通知设置',
    href: '/settings/notifications',
    icon: Bell,
    description: '邮件通知、系统提醒设置',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    title: '界面设置',
    href: '/settings/appearance',
    icon: Palette,
    description: '主题、语言等界面个性化',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: '模型供应商',
    href: '/settings/model-providers',
    icon: Database,
    description: '管理AI模型和供应商配置',
    badge: 'AI',
    gradient: 'from-indigo-500 to-blue-500'
  },
  {
    title: 'MCP服务器',
    href: '/settings/mcp-servers',
    icon: Server,
    description: '管理MCP服务器连接和配置',
    badge: 'Hot',
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    title: 'MCP工具',
    href: '/settings/mcp-tools',
    icon: Wrench,
    description: '查看和测试已连接服务器提供的工具',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'MCP测试',
    href: '/settings/mcp-test',
    icon: FlaskConical,
    description: '调试与连通性测试',
    gradient: 'from-fuchsia-500 to-pink-500'
  },
  {
    title: 'MCP批处理',
    href: '/settings/mcp-batch',
    icon: Workflow,
    description: '批量执行工具与自动化流程',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    title: 'API开放',
    href: '/settings/api-keys',
    icon: Key,
    description: 'API文档与测试&API密钥管理',
    gradient: 'from-slate-500 to-gray-500'
  }
]

export const SettingsLayout: React.FC = () => {
  const location = useLocation()
  
  // 获取当前页面信息
  const currentItem = settingsItems.find(item => item.href === location.pathname)
  const currentTitle = currentItem?.title || '系统设置'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden">
      {/* 背景装饰（为性能移除重度模糊） */}

      <div className="relative z-10 flex h-screen">
        {/* 侧边栏 */}
        <div className="w-80 bg-white border-r border-white/20 shadow-xl flex flex-col">
          {/* 侧边栏头部 */}
          <div className="p-6 border-b border-gray-100/50">
            <Link 
              to="/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150 group mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回主页
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">系统设置</h1>
                <p className="text-sm text-gray-500">个性化您的AI体验</p>
              </div>
            </div>
          </div>

          {/* 导航菜单 */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {settingsItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "group relative flex items-center p-4 rounded-2xl transition-colors duration-150",
                      isActive
                        ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-lg border border-blue-200/30"
                        : "hover:bg-white/60 hover:shadow-md"
                    )}
                  >
                    {/* 活跃状态指示器 */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"></div>
                    )}

                    {/* 图标背景 */}
                    <div className={cn(
                      "relative w-11 h-11 rounded-xl flex items-center justify-center mr-4 transition-colors duration-150",
                      isActive 
                        ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                        : "bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-gray-200 group-hover:to-gray-300"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-colors duration-150",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-gray-700"
                      )} />
                      
                      {/* Badge */}
                      {item.badge && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-[10px] font-bold text-white">{item.badge}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-semibold transition-colors duration-300 truncate",
                          isActive ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                        )}>
                          {item.title}
                        </span>
                        {isActive && <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />}
                      </div>
                      <p className={cn(
                        "text-sm transition-colors duration-300 truncate mt-0.5",
                        isActive ? "text-gray-600" : "text-gray-500 group-hover:text-gray-600"
                      )}>
                        {item.description}
                      </p>
                    </div>

                    {/* 悬停指示器 */}
                    {!isActive && (
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-opacity duration-150 opacity-0 group-hover:opacity-100"></div>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* AI助手卡片 */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-200/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">AI智能助手</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                根据您的使用习惯，我们推荐优化这些设置以获得更好的AI体验。
              </p>
              <button className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-colors duration-150">
                智能优化设置
              </button>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部面包屑（适配主题色）*/}
          <div className="h-16 bg-background border-b border-border flex items-center px-8">
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <span>系统设置</span>
              <span>/</span>
              <span className="text-text-primary font-medium">{currentTitle}</span>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-hidden bg-white/20">
            <div className="h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
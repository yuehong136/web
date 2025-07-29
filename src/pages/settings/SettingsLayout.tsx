import React from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Key,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const settingsItems: SidebarItem[] = [
  {
    title: '个人资料',
    href: '/settings/profile',
    icon: User,
    description: '管理您的基本信息和头像'
  },
  {
    title: '安全设置',
    href: '/settings/security',
    icon: Shield,
    description: '密码、两步验证等安全选项'
  },
  {
    title: '通知设置',
    href: '/settings/notifications',
    icon: Bell,
    description: '邮件通知、系统提醒设置'
  },
  {
    title: '界面设置',
    href: '/settings/appearance',
    icon: Palette,
    description: '主题、语言等界面个性化'
  },
  {
    title: '模型供应商',
    href: '/settings/model-providers',
    icon: Database,
    description: '管理AI模型和供应商配置'
  },
  {
    title: 'API密钥',
    href: '/settings/api-keys',
    icon: Key,
    description: '管理第三方服务API密钥'
  }
]

export const SettingsLayout: React.FC = () => {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard"
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                返回主页
              </Link>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                系统设置
              </h1>
            </div>
            <div className="w-20" /> {/* 占位符保持标题居中 */}
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 居中的分栏布局 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex h-[calc(100vh-140px)] gap-6">
          {/* 左侧固定导航栏 */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
              {/* 导航菜单 */}
              <div className="p-6">
                <nav className="space-y-2">
                  {settingsItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                          isActive
                            ? "bg-blue-50 text-blue-700 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 mr-3 flex-shrink-0",
                          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                        )} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.title}</div>
                          {!isActive && (
                            <div className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-600">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden">
              <div className="h-full overflow-y-auto">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
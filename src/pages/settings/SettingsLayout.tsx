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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 独立的设置页面顶部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronRight className="h-5 w-5 rotate-180 mr-2" />
                返回主页
              </Link>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                <SettingsIcon className="h-6 w-6 mr-2" />
                系统设置
              </h1>
            </div>
            <div className="w-20" /> {/* 占位符保持标题居中 */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* 左侧导航 - 更紧凑的设计 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <nav className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 mr-3 flex-shrink-0",
                        isActive ? "text-blue-600" : "text-gray-400"
                      )} />
                      <span className="truncate">{item.title}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* 右侧内容区域 - 更大的空间 */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
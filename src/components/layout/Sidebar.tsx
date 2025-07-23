import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  FileText,
  Wrench,
  GitBranch,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { ROUTES } from '../../constants'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
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
    title: '文件中心',
    href: ROUTES.DOCUMENTS,
    icon: FileText,
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
  collapsed, 
  onToggleCollapse, 
  className 
}) => {
  const location = useLocation()

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* 折叠按钮 */}
      <div className="p-4 border-b border-gray-200 flex justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          className="hidden lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group",
                  isActive
                    ? "bg-primary-50 text-primary-700 border border-primary-200"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )
              }
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {/* 折叠状态下的提示 */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                  {item.title}
                  {item.badge && (
                    <span className="ml-2 bg-primary-600 text-white px-1.5 py-0.5 rounded text-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs text-gray-500">Multi-RAG v0.6.0</p>
            <p className="text-xs text-gray-400 mt-1">
              © 2025 All rights reserved
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-600 font-medium">MR</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
import React from 'react'
import { Toaster } from '@/pages/ai-tools/ref/sonner'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AuthGuard } from '@/components/auth'

export const Layout: React.FC = () => {
  
  const location = useLocation()
  const isSettingsPage = location.pathname.startsWith('/settings')
  
  // 侧边栏折叠状态
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true) // 默认收起

  return (
    <AuthGuard requireAuth={true}>
      <div className="h-screen bg-[#F7F8FA] relative overflow-hidden p-4">
        <div className="h-full flex gap-4">
          {/* Desktop Sidebar - 左侧导航栏 */}
          {!isSettingsPage && (
            <div className="hidden lg:block flex-shrink-0">
              <Sidebar 
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
              />
            </div>
          )}

          {/* Main Content Area - 右侧整体容器（白色圆角） */}
          <main className="flex-1 h-full overflow-hidden bg-white rounded-2xl shadow-sm">
            <Outlet />
          </main>
        </div>

        {/* Sonner Toaster */}
        <Toaster position="top-right" richColors closeButton />
      </div>
    </AuthGuard>
  )
}
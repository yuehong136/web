import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { AuthGuard } from '../auth'
import { useUIStore } from '../../stores'
import { cn } from '../../lib/utils'

export const Layout: React.FC = () => {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    isMobile,
    notifications,
    removeNotification
  } = useUIStore()
  
  const location = useLocation()
  const isSettingsPage = location.pathname.startsWith('/settings')

  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  const handleToggleSidebar = () => {
    if (isMobile()) {
      setMobileSidebarOpen(!mobileSidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const handleCloseMobileSidebar = () => {
    setMobileSidebarOpen(false)
  }

  // 处理窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <AuthGuard requireAuth={true}>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <Header 
          onToggleSidebar={handleToggleSidebar} 
          showSidebarToggle={!isSettingsPage}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar - 只在非设置页面显示 */}
          {!isSettingsPage && (
            <div className="hidden lg:block">
              <Sidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>
          )}

          {/* Mobile Sidebar Overlay - 只在非设置页面显示 */}
          {!isSettingsPage && mobileSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={handleCloseMobileSidebar}
              />
              <div className="fixed left-0 top-16 bottom-0 z-50 lg:hidden">
                <Sidebar
                  collapsed={false}
                  onToggleCollapse={handleCloseMobileSidebar}
                  className="h-full"
                />
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Toast Notifications */}
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "max-w-sm rounded-lg shadow-lg p-4 text-white animate-slide-down",
                notification.type === 'error' && "bg-red-500",
                notification.type === 'warning' && "bg-yellow-500",
                notification.type === 'success' && "bg-green-500",
                notification.type === 'info' && "bg-blue-500"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{notification.title}</h4>
                  <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-3 text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  )
}
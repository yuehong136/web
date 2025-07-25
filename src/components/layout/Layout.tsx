import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AuthGuard } from '@/components/auth'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

export const Layout: React.FC = () => {
  const { 
    notifications,
    removeNotification
  } = useUIStore()
  
  const location = useLocation()
  const isSettingsPage = location.pathname.startsWith('/settings')

  return (
    <AuthGuard requireAuth={true}>
      <div className="h-screen bg-gray-50 relative overflow-hidden">
        {/* Desktop Sidebar - 浮动在页面上 */}
        {!isSettingsPage && (
          <div className="hidden lg:block fixed left-4 top-4 bottom-4 z-10">
            <Sidebar />
          </div>
        )}

        {/* Main Content Area - 占据整个页面 */}
        <div className="h-full overflow-hidden">
          {/* Main Content */}
          <main className={cn(
            "h-full overflow-auto",
            !isSettingsPage ? "lg:pl-8" : ""
          )}>
            <div className={cn(
              "h-full",
              !isSettingsPage ? "lg:bg-white lg:rounded-l-2xl lg:shadow-sm lg:ml-20" : ""
            )}>
              <Outlet />
            </div>
          </main>
        </div>

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
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
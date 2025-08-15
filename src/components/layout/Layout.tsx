import React from 'react'
import { Toaster } from '@/pages/ai-tools/ref/sonner'
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

        {/* Sonner Toaster */}
        <Toaster position="top-right" richColors closeButton />
      </div>
    </AuthGuard>
  )
}
import React from 'react'
import { Sidebar } from './Sidebar'
import { MainWorkbench } from './main-workbench'
import { MobileSidebarSheet } from './mobile-sidebar-sheet'
import { useUIStore } from '@/stores'

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  return (
    <div className="h-screen overflow-hidden bg-components-app-shell-bg p-space-sm lg:p-space-base">
      <div
        className="flex h-full gap-space-base rounded-radius-xl border border-components-app-shell-border bg-components-app-shell-surface p-space-xs lg:p-space-sm"
        style={{ boxShadow: 'var(--color-components-app-shell-shadow)' }}
      >
        <div className="hidden h-full shrink-0 lg:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>

        <MainWorkbench onOpenSidebar={() => setMobileSidebarOpen(true)}>
          {children}
        </MainWorkbench>
      </div>

      <MobileSidebarSheet
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />
    </div>
  )
}

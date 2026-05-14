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
    <div className="p-space-sm lg:p-space-base h-dvh overflow-hidden bg-components-app-shell-bg">
      <div
        className="rounded-radius-xl flex h-full gap-0 overflow-hidden border border-components-main-workbench-border"
        style={{ boxShadow: 'var(--color-components-main-workbench-shadow)' }}
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

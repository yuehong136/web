import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainWorkbench } from '@/components/layout/main-workbench'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { MobileSidebarSheet } from '@/components/layout/mobile-sidebar-sheet'
import {
  WorkbenchNavigationProvider,
  useWorkbenchNavigation,
  useDefaultSecondaryNavigation,
  getWorkbenchSection,
} from '@/components/layout/workbench-navigation'
import { SecondaryNavigationContent } from '@/components/patterns/secondary-navigation-content'
import { useUIStore } from '@/stores'

export const AppShell = ({ children }: React.PropsWithChildren) => (
  <WorkbenchNavigationProvider>
    <WorkbenchFrame>{children}</WorkbenchFrame>
  </WorkbenchNavigationProvider>
)

const WorkbenchFrame = ({ children }: React.PropsWithChildren) => {
  const collapsed = useUIStore((state) => state.sidebarCollapsed)
  const setCollapsed = useUIStore((state) => state.setSidebarCollapsed)
  const { pathname } = useLocation()
  const [mobileNavigation, setMobileNavigation] = React.useState({
    pathname,
    open: false,
  })
  if (mobileNavigation.pathname !== pathname)
    setMobileNavigation({ pathname, open: false })
  const mobileOpen =
    mobileNavigation.pathname === pathname && mobileNavigation.open
  const setMobileOpen = (open: boolean) =>
    setMobileNavigation({ pathname, open })
  const section = getWorkbenchSection(pathname)
  const defaults = useDefaultSecondaryNavigation()
  const context = useWorkbenchNavigation()
  const definition =
    context?.definition?.section === section
      ? context.definition
      : defaults[section]
  const navigation = { ...defaults, [section]: definition }
  const panelId = React.useId()
  const mobileToggle = React.useRef<HTMLButtonElement>(null)
  return (
    <div className="h-dvh overflow-hidden bg-components-app-shell-bg p-space-sm lg:p-space-base">
      <div className="flex h-full overflow-hidden rounded-radius-xl border border-components-main-workbench-border shadow-elevation-low">
        <div className="hidden h-full shrink-0 md:block">
          <Sidebar
            secondaryCollapsed={collapsed}
            section={section}
            navigation={navigation}
          />
        </div>
        <div
          id={panelId}
          data-secondary-panel
          data-collapsed={collapsed}
          className={
            collapsed
              ? 'hidden'
              : 'hidden h-full w-[208px] shrink-0 border-r border-border-subtle bg-components-sidebar-bg md:flex md:flex-col'
          }
        >
          {!collapsed && (
            <SecondaryNavigationContent {...definition} currentPath={pathname}>
              {definition.content}
            </SecondaryNavigationContent>
          )}
        </div>
        <MainWorkbench
          header={
            <AppTopBar
              mobileToggleRef={mobileToggle}
              onOpenSidebar={() => setMobileOpen(true)}
              secondaryCollapsed={collapsed}
              onToggleSecondary={() => setCollapsed(!collapsed)}
              secondaryPanelId={panelId}
            />
          }
        >
          {children}
        </MainWorkbench>
      </div>
      <MobileSidebarSheet
        returnFocusRef={mobileToggle}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        navigation={definition}
      />
    </div>
  )
}

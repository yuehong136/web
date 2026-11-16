import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useWorkbenchViewport } from '@/components/layout/use-workbench-viewport'
import { SecondaryNavigationContent } from '@/components/patterns/secondary-navigation-content'
import { useUIStore } from '@/stores'

export const AppShell = ({ children }: React.PropsWithChildren) => (
  <WorkbenchNavigationProvider>
    <WorkbenchFrame>{children}</WorkbenchFrame>
  </WorkbenchNavigationProvider>
)

const WorkbenchFrame = ({ children }: React.PropsWithChildren) => {
  const { t } = useTranslation()
  const collapsed = useUIStore((state) => state.sidebarCollapsed)
  const setCollapsed = useUIStore((state) => state.setSidebarCollapsed)
  const { pathname, key } = useLocation()
  const viewport = useWorkbenchViewport()
  const scope = `${key}:${viewport.desktop}:${viewport.wide}`
  const [mobileNavigation, setMobileNavigation] = React.useState({
    scope,
    open: false,
  })
  if (mobileNavigation.scope !== scope)
    setMobileNavigation({ scope, open: false })
  const mobileOpen = mobileNavigation.scope === scope && mobileNavigation.open
  const setMobileOpen = (open: boolean) => setMobileNavigation({ scope, open })
  const section = getWorkbenchSection(pathname)
  const defaults = useDefaultSecondaryNavigation()
  const context = useWorkbenchNavigation()
  const definition =
    context?.definition?.section === section
      ? context.definition
      : defaults[section]
  const navigation = { ...defaults, [section]: definition }
  const panelId = React.useId()
  const mobilePanelId = React.useId()
  const contentId = React.useId()
  const mobileToggle = React.useRef<HTMLButtonElement>(null)
  const secondaryToggle = React.useRef<HTMLButtonElement>(null)
  const navigationReturnFocus = React.useRef<HTMLElement | null>(null)
  const overlayNavigation = !viewport.wide
  const hasSecondaryContent = definition.hasSecondaryContent !== false
  const effectiveCollapsed =
    collapsed || overlayNavigation || !hasSecondaryContent
  return (
    <div
      data-workbench-shell
      data-navigation-mode={
        viewport.wide ? 'docked' : viewport.desktop ? 'overlay' : 'mobile'
      }
      className="relative h-dvh overflow-hidden bg-components-app-shell-bg"
      style={viewport.height > 0 ? { height: viewport.height } : undefined}
    >
      <a
        href={`#${contentId}`}
        onClick={() => document.getElementById(contentId)?.focus()}
        className="sr-only z-50 rounded-radius-md bg-background-surface p-space-base text-sm text-text-primary focus:not-sr-only focus:absolute focus:top-space-sm focus:left-space-sm focus:ring-2 focus:ring-state-focus"
      >
        {t('layout.workspace.skipToTask')}
      </a>
      {/* Navigation sits on the shell tone; only the task area is raised. */}
      <div className="flex h-full min-h-0 min-w-0 overflow-hidden">
        {viewport.desktop && (
          <Sidebar
            secondaryCollapsed={effectiveCollapsed}
            section={section}
            navigation={navigation}
          />
        )}
        <div
          id={panelId}
          data-secondary-panel
          data-collapsed={effectiveCollapsed}
          className={
            effectiveCollapsed
              ? 'hidden'
              : 'flex h-full min-h-0 w-[calc(16rem*var(--text-scale,1))] max-w-[28vw] shrink-0 flex-col overflow-hidden bg-components-sidebar-bg'
          }
        >
          {viewport.desktop && !effectiveCollapsed && (
            <SecondaryNavigationContent
              {...definition}
              currentPath={pathname}
              headerDivider={false}
            >
              {definition.content}
            </SecondaryNavigationContent>
          )}
        </div>
        <MainWorkbench
          className="md:my-space-sm md:mr-space-sm md:h-auto md:self-stretch md:rounded-radius-xl md:border md:border-components-main-workbench-border md:shadow-elevation-low"
          contentId={contentId}
          contentLabel={t('layout.workspace.mainTask')}
          header={
            <AppTopBar
              showSecondaryToggle={hasSecondaryContent}
              mobileToggleRef={mobileToggle}
              secondaryToggleRef={secondaryToggle}
              onOpenSidebar={() => {
                navigationReturnFocus.current = mobileToggle.current
                setMobileOpen(true)
              }}
              navigationOpen={mobileOpen}
              mobilePanelId={mobilePanelId}
              secondaryCollapsed={overlayNavigation ? !mobileOpen : collapsed}
              secondaryAsDialog={overlayNavigation}
              onToggleSecondary={() => {
                if (overlayNavigation) {
                  navigationReturnFocus.current = secondaryToggle.current
                  setMobileOpen(true)
                } else setCollapsed(!collapsed)
              }}
              secondaryPanelId={overlayNavigation ? mobilePanelId : panelId}
              sectionLabel={definition.title}
            >
              {definition.header}
            </AppTopBar>
          }
        >
          {children}
        </MainWorkbench>
      </div>
      <MobileSidebarSheet
        id={mobilePanelId}
        viewportHeight={viewport.height}
        returnFocusRef={navigationReturnFocus}
        fallbackFocusRef={viewport.desktop ? secondaryToggle : mobileToggle}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        navigation={definition}
      />
    </div>
  )
}

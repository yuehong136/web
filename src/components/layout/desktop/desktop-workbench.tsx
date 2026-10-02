import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel, Group, Separator, usePanelRef } from 'react-resizable-panels'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui'
import { ActivityRail } from './activity-rail'
import { DesktopContextPanel } from './context-panel'
import { DesktopToolbar } from './desktop-toolbar'

export const DesktopWorkbench: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { t } = useTranslation()
  const collapsed = useUIStore((state) => state.desktopSidebarCollapsed)
  const width = useUIStore((state) => state.desktopSidebarWidth)
  const setCollapsed = useUIStore((state) => state.setDesktopSidebarCollapsed)
  const setWidth = useUIStore((state) => state.setDesktopSidebarWidth)
  const panelRef = usePanelRef()

  useEffect(() => {
    if (collapsed) panelRef.current?.collapse()
    else if (panelRef.current?.isCollapsed())
      panelRef.current.resize(`${width}%`)
  }, [collapsed, panelRef, width])

  return (
    <div
      className="flex h-dvh overflow-hidden bg-components-app-shell-bg"
      data-client-runtime="desktop"
      data-desktop-workbench="true"
    >
      <ActivityRail />
      <Group orientation="horizontal">
        <Panel
          panelRef={panelRef}
          id="desktop-context-panel"
          defaultSize={`${collapsed ? 0 : width}%`}
          minSize="16%"
          maxSize="30%"
          collapsible
          collapsedSize="0%"
          onResize={({ asPercentage }) => {
            setCollapsed(asPercentage === 0)
            if (asPercentage > 0) setWidth(asPercentage)
          }}
        >
          <DesktopContextPanel />
        </Panel>
        <Separator
          disabled={collapsed}
          className={cn(
            'bg-components-split-pane-border transition-colors focus:outline-none',
            collapsed
              ? 'w-0'
              : 'w-px hover:bg-state-focus focus:bg-state-focus',
          )}
          aria-label={t('desktop.workbench.resizeContext')}
          aria-hidden={collapsed}
        />
        <Panel
          id="desktop-main-workspace"
          minSize="60%"
          defaultSize={`${collapsed ? 100 : 100 - width}%`}
        >
          <main className="flex h-full min-w-0 flex-col overflow-hidden bg-components-main-workbench-bg">
            <DesktopToolbar />
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </main>
        </Panel>
      </Group>
    </div>
  )
}

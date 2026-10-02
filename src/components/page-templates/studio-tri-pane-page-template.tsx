import React, { useMemo } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import { createPanelLayoutStorage } from '@/components/ui/panel-layout-storage'
import { cn } from '@/lib/utils'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

type ResizablePanelProps = Omit<
  React.ComponentProps<typeof ResizablePanel>,
  'children'
>

interface StudioTriPanePageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  leftPane: React.ReactNode
  centerPane: React.ReactNode
  rightPane: React.ReactNode
  layoutId: string
  leftPanelProps?: ResizablePanelProps
  centerPanelProps?: ResizablePanelProps
  rightPanelProps?: ResizablePanelProps
  leftPanelRef?: React.Ref<PanelImperativeHandle | null>
  rightPanelRef?: React.Ref<PanelImperativeHandle | null>
}

export const StudioTriPanePageTemplate: React.FC<
  StudioTriPanePageTemplateProps
> = ({
  header,
  leftPane,
  centerPane,
  rightPane,
  layoutId,
  leftPanelProps,
  centerPanelProps,
  rightPanelProps,
  leftPanelRef,
  rightPanelRef,
  className,
  ...props
}) => {
  const panelIds = useMemo(
    () => [
      String(leftPanelProps?.id ?? 'studio-left'),
      String(centerPanelProps?.id ?? 'studio-center'),
      String(rightPanelProps?.id ?? 'studio-right'),
    ],
    [leftPanelProps?.id, centerPanelProps?.id, rightPanelProps?.id],
  )
  const storage = useMemo(
    () => createPanelLayoutStorage(window.localStorage, layoutId, panelIds),
    [layoutId, panelIds],
  )
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: layoutId,
    panelIds,
    storage,
  })
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-components-studio-bg',
        className,
      )}
      {...props}
    >
      {header}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full min-h-0"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
        >
          <ResizablePanel
            id={panelIds[0]}
            panelRef={leftPanelRef}
            {...leftPanelProps}
          >
            <div className="h-full min-h-0 border-r border-components-studio-border">
              {leftPane}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-transparent transition-colors hover:bg-border-accent" />

          <ResizablePanel id={panelIds[1]} {...centerPanelProps}>
            <div className="h-full min-h-0 border-r border-components-studio-border">
              {centerPane}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-transparent transition-colors hover:bg-border-accent" />

          <ResizablePanel
            id={panelIds[2]}
            panelRef={rightPanelRef}
            {...rightPanelProps}
          >
            <div className="h-full min-h-0">{rightPane}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

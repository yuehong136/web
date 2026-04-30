import React from 'react'
import { cn } from '@/lib/utils'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

type ResizablePanelProps = Omit<React.ComponentProps<typeof ResizablePanel>, 'children'>

interface StudioTriPanePageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  leftPane: React.ReactNode
  centerPane: React.ReactNode
  rightPane: React.ReactNode
  autoSaveId?: string
  leftPanelProps?: ResizablePanelProps
  centerPanelProps?: ResizablePanelProps
  rightPanelProps?: ResizablePanelProps
  leftPanelRef?: React.Ref<React.ElementRef<typeof ResizablePanel>>
  rightPanelRef?: React.Ref<React.ElementRef<typeof ResizablePanel>>
}

export const StudioTriPanePageTemplate: React.FC<StudioTriPanePageTemplateProps> = ({
  header,
  leftPane,
  centerPane,
  rightPane,
  autoSaveId,
  leftPanelProps,
  centerPanelProps,
  rightPanelProps,
  leftPanelRef,
  rightPanelRef,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)} {...props}>
      {header}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full min-h-0"
          autoSaveId={autoSaveId}
        >
          <ResizablePanel ref={leftPanelRef} {...leftPanelProps}>
            <div className="h-full min-h-0 border-r border-components-studio-border">
              {leftPane}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-transparent transition-colors hover:bg-border-accent" />

          <ResizablePanel {...centerPanelProps}>
            <div className="h-full min-h-0 border-r border-components-studio-border">
              {centerPane}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-transparent transition-colors hover:bg-border-accent" />

          <ResizablePanel ref={rightPanelRef} {...rightPanelProps}>
            <div className="h-full min-h-0">
              {rightPane}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

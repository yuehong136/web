import React from 'react'
import { cn } from '@/lib/utils'

interface SplitDetailPageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  leftPane: React.ReactNode
  rightPane: React.ReactNode
  leftWidth?: number | string
  minLeft?: number | string
}

export const SplitDetailPageTemplate: React.FC<SplitDetailPageTemplateProps> = ({
  header,
  leftPane,
  rightPane,
  leftWidth = 360,
  minLeft = 280,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-components-split-pane-bg', className)} {...props}>
      {header}
      <div className="flex min-h-0 flex-1">
        <aside
          className="shrink-0 overflow-auto border-r border-components-split-pane-border"
          style={{ width: leftWidth, minWidth: minLeft }}
        >
          {leftPane}
        </aside>
        <div className="min-w-0 flex-1 overflow-auto">{rightPane}</div>
      </div>
    </div>
  )
}

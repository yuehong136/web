import React from 'react'
import { cn } from '@/lib/utils'

interface StudioPageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  toolbar?: React.ReactNode
  sidePanel?: React.ReactNode
  children: React.ReactNode
}

export const StudioPageTemplate: React.FC<StudioPageTemplateProps> = ({
  toolbar,
  sidePanel,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-components-studio-bg', className)} {...props}>
      {toolbar}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto bg-components-studio-surface">{children}</div>
        {sidePanel ? (
          <aside className="w-80 shrink-0 border-l border-components-studio-border bg-components-studio-surface">
            {sidePanel}
          </aside>
        ) : null}
      </div>
    </div>
  )
}

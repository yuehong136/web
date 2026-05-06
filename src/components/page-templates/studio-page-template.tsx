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
        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
        {sidePanel ? (
          <aside className="flex w-80 min-h-0 shrink-0 flex-col border-l border-components-studio-border">
            {sidePanel}
          </aside>
        ) : null}
      </div>
    </div>
  )
}

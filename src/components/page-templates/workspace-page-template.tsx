import React from 'react'
import { cn } from '@/lib/utils'

interface WorkspacePageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}

export const WorkspacePageTemplate: React.FC<WorkspacePageTemplateProps> = ({
  header,
  footer,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-components-workspace-bg', className)} {...props}>
      {header}
      <div className="flex-1 min-h-0 overflow-auto bg-components-workspace-surface">{children}</div>
      {footer}
    </div>
  )
}

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
    <div
      className={cn(
        'flex h-dvh min-h-0 flex-col bg-components-workspace-bg',
        className,
      )}
      {...props}
    >
      {header}
      <div
        data-scroll-root="workspace-body"
        className="scroll-area min-h-0 flex-1 overflow-auto"
      >
        {children}
      </div>
      {footer}
    </div>
  )
}

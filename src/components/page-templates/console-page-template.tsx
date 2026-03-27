import React from 'react'
import { cn } from '@/lib/utils'

interface ConsolePageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  toolbar?: React.ReactNode
  rail?: React.ReactNode
  children: React.ReactNode
}

export const ConsolePageTemplate: React.FC<ConsolePageTemplateProps> = ({
  header,
  toolbar,
  rail,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex h-full min-h-0 bg-components-console-bg', className)} {...props}>
      {rail}
      <div className="flex min-w-0 flex-1 flex-col bg-components-console-surface">
        {header}
        {toolbar}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}

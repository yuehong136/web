import React from 'react'
import { cn } from '@/lib/utils'

export const MainSurface: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden bg-components-main-workbench-surface',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

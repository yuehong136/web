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
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-radius-xl border border-components-main-workbench-border bg-components-main-workbench-surface',
        className,
      )}
      style={{ boxShadow: 'var(--color-components-main-workbench-shadow)' }}
      {...props}
    >
      {children}
    </div>
  )
}

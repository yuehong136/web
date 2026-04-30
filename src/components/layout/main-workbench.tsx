import React from 'react'
import { cn } from '@/lib/utils'
import { AppTopBar } from './app-top-bar'
import { MainSurface } from './main-surface'

interface MainWorkbenchProps extends React.HTMLAttributes<HTMLDivElement> {
  onOpenSidebar: () => void
}

export const MainWorkbench: React.FC<MainWorkbenchProps> = ({
  onOpenSidebar,
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col', className)} {...props}>
      <MainSurface>
        <AppTopBar onOpenSidebar={onOpenSidebar} />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </MainSurface>
    </div>
  )
}

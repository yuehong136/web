import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MainSurface } from '@/components/layout/main-surface'

interface MainWorkbenchProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode
}

export const MainWorkbench = ({
  header,
  className,
  children,
  ...props
}: MainWorkbenchProps) => (
  <div
    className={cn(
      'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
      className,
    )}
    {...props}
  >
    <MainSurface>
      {header}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </MainSurface>
  </div>
)

import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MainSurface } from '@/components/layout/main-surface'

interface MainWorkbenchProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode
  contentId?: string
  contentLabel?: string
}
export const MainWorkbench = ({
  header,
  contentId,
  contentLabel,
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
      <section
        id={contentId}
        data-main-task-area
        aria-label={contentLabel}
        tabIndex={contentId ? -1 : undefined}
        className="min-h-0 min-w-0 flex-1 overflow-hidden outline-hidden"
      >
        {children}
      </section>
    </MainSurface>
  </div>
)

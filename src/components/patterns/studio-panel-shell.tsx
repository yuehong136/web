import React from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface StudioPanelShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  actions?: React.ReactNode
  scrollMode?: 'none' | 'y'
  collapsed?: boolean
  collapsedContent?: React.ReactNode
  bodyClassName?: string
  viewportClassName?: string
}

export const StudioPanelShell: React.FC<StudioPanelShellProps> = ({
  title,
  actions,
  scrollMode = 'none',
  collapsed = false,
  collapsedContent,
  className,
  bodyClassName,
  viewportClassName,
  children,
  ...props
}) => {
  if (collapsed) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-col bg-components-studio-surface',
          className,
        )}
        {...props}
      >
        <div className="flex h-full min-h-0 flex-col">{collapsedContent}</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-components-studio-surface',
        className,
      )}
      {...props}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-components-studio-border bg-components-studio-surface px-space-base">
        <div className="min-w-0 flex-1 text-base font-semibold text-components-page-toolbar-text">
          {title}
        </div>
        {actions ? <div className="ml-space-sm flex shrink-0 items-center gap-space-xs">{actions}</div> : null}
      </div>

      {scrollMode === 'y' ? (
        <ScrollArea
          className="min-h-0 flex-1"
          viewportClassName={cn('overscroll-contain', viewportClassName)}
        >
          <div className={cn('min-h-full', bodyClassName)}>{children}</div>
        </ScrollArea>
      ) : (
        <div className={cn('min-h-0 flex-1', bodyClassName)}>{children}</div>
      )}
    </div>
  )
}

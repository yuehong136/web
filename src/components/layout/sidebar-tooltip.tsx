import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

interface SidebarTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  enabled?: boolean
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
  content,
  children,
  enabled = true,
}) => {
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={12}
            className={cn(
              'rounded-radius-md px-space-sm py-space-xs shadow-elevation-medium z-50 bg-components-tooltip-bg text-sm text-components-tooltip-text',
              'animate-in fade-in-0 zoom-in-95 data-[side=right]:slide-in-from-left-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

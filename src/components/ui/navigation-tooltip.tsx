import type * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

interface NavigationTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  enabled?: boolean
}

/** Labels icon-only navigation without changing its native link behavior. */
export const NavigationTooltip: React.FC<NavigationTooltipProps> = ({
  content,
  children,
  enabled = true,
}) => {
  if (!enabled) return <>{children}</>
  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={12}
            className="animate-in fade-in-0 zoom-in-95 data-[side=right]:slide-in-from-left-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 rounded-radius-md bg-components-tooltip-bg px-space-sm py-space-xs text-sm text-components-tooltip-text shadow-elevation-medium motion-reduce:animate-none"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

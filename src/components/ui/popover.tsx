'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/lib/utils'
import { useActivePortalTheme, usePortalContainer } from './portal-theme'
import { popoverMotionClass } from './overlay-motion'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => {
  const portalContainer = usePortalContainer()
  const theme = useActivePortalTheme(true)

  return (
    <PopoverPrimitive.Portal container={portalContainer}>
      <PopoverPrimitive.Content
        ref={ref}
        data-theme={theme}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-radius-xl border border-line bg-overlay p-space-md text-fg shadow-elevation-medium outline-hidden',
          popoverMotionClass,
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

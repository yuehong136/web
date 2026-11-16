'use client'

import * as React from 'react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { cn } from '@/lib/utils'
import { useActivePortalTheme, usePortalContainer } from './portal-theme'
import {
  menuContentClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
} from './action-menu'

const ContextMenu = ContextMenuPrimitive.Root
const ContextMenuTrigger = ContextMenuPrimitive.Trigger
const ContextMenuGroup = ContextMenuPrimitive.Group
const ContextMenuPortal = ContextMenuPrimitive.Portal
const ContextMenuSub = ContextMenuPrimitive.Sub
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuContent = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => {
  const portalContainer = usePortalContainer()
  const theme = useActivePortalTheme(true)

  return (
    <ContextMenuPortal container={portalContainer}>
      <ContextMenuPrimitive.Content
        ref={ref}
        data-theme={theme}
        className={cn(
          menuContentClass,
          'max-h-[var(--radix-context-menu-content-available-height)]',
          className,
        )}
        {...props}
      />
    </ContextMenuPortal>
  )
})
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(menuItemClass, className)}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn(menuSeparatorClass, className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

const ContextMenuLabel = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(menuLabelClass, className)}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuRadioGroup,
}

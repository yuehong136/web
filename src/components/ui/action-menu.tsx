import * as React from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useActivePortalTheme,
  usePortalContainer,
} from '@/components/ui/portal-theme'
import { dropdownMotionClass } from './overlay-motion'

export const ActionMenu = Menu.Root
export const ActionMenuTrigger = Menu.Trigger
export const ActionMenuRadioGroup = Menu.RadioGroup
export const ActionMenuGroup = Menu.Group
export const ActionMenuSub = Menu.Sub

/**
 * DreamJira menu geometry, shared by ActionMenu, DropdownMenu and
 * ContextMenu: a 12px panel with 4px inset, 32px rows with 6px corners.
 */
export const menuContentClass =
  'z-50 min-w-48 overflow-y-auto rounded-radius-xl border border-line bg-overlay p-space-xs text-sm text-fg shadow-elevation-medium outline-hidden'

export const menuItemClass =
  'relative flex min-h-[var(--control-height)] cursor-default items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm text-fg outline-hidden select-none data-[highlighted]:bg-fill-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:shrink-0'

export const menuLabelClass =
  'px-space-sm pt-space-sm pb-space-2xs text-xs font-medium text-fg-subtle'

export const menuSeparatorClass = '-mx-space-xs my-space-xs h-px bg-line'

export const menuShortcutClass =
  'ml-auto shrink-0 pl-space-md font-mono text-xs text-fg-subtle'

export const ActionMenuContent = React.forwardRef<
  React.ElementRef<typeof Menu.Content>,
  React.ComponentPropsWithoutRef<typeof Menu.Content>
>(({ className, sideOffset = 6, ...props }, ref) => {
  const portalContainer = usePortalContainer()
  const theme = useActivePortalTheme(true)
  return (
    <Menu.Portal container={portalContainer}>
      <Menu.Content
        ref={ref}
        data-theme={theme}
        sideOffset={sideOffset}
        className={cn(
          menuContentClass,
          dropdownMotionClass,
          'max-h-[var(--radix-dropdown-menu-content-available-height)]',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
})
ActionMenuContent.displayName = 'ActionMenuContent'

export const ActionMenuLabel = React.forwardRef<
  React.ElementRef<typeof Menu.Label>,
  React.ComponentPropsWithoutRef<typeof Menu.Label>
>(({ className, ...props }, ref) => (
  <Menu.Label ref={ref} className={cn(menuLabelClass, className)} {...props} />
))
ActionMenuLabel.displayName = 'ActionMenuLabel'

export const ActionMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Menu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof Menu.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <Menu.SubTrigger
    ref={ref}
    className={cn(menuItemClass, 'data-[state=open]:bg-fill-hover', className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-icon-sm shrink-0 text-fg-subtle" />
  </Menu.SubTrigger>
))
ActionMenuSubTrigger.displayName = 'ActionMenuSubTrigger'

export const ActionMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Menu.SubContent>,
  React.ComponentPropsWithoutRef<typeof Menu.SubContent>
>(({ className, ...props }, ref) => {
  const portalContainer = usePortalContainer()
  const theme = useActivePortalTheme(true)
  return (
    <Menu.Portal container={portalContainer}>
      <Menu.SubContent
        ref={ref}
        data-theme={theme}
        className={cn(
          menuContentClass,
          dropdownMotionClass,
          'max-h-[var(--radix-dropdown-menu-content-available-height)]',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
})
ActionMenuSubContent.displayName = 'ActionMenuSubContent'

export const ActionMenuItem = React.forwardRef<
  React.ElementRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item> & { danger?: boolean }
>(({ className, danger, ...props }, ref) => (
  <Menu.Item
    ref={ref}
    className={cn(
      menuItemClass,
      danger && 'text-danger-fg data-[highlighted]:bg-danger-soft',
      className,
    )}
    {...props}
  />
))
ActionMenuItem.displayName = 'ActionMenuItem'

export const ActionMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Menu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Menu.RadioItem>
>(({ className, children, ...props }, ref) => (
  <Menu.RadioItem ref={ref} className={cn(menuItemClass, className)} {...props}>
    {children}
    <span className="ml-auto flex size-icon-sm items-center justify-center text-accent-solid">
      <Menu.ItemIndicator>
        <Check className="size-icon-sm" />
      </Menu.ItemIndicator>
    </span>
  </Menu.RadioItem>
))
ActionMenuRadioItem.displayName = 'ActionMenuRadioItem'

export const ActionMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Menu.Separator>,
  React.ComponentPropsWithoutRef<typeof Menu.Separator>
>(({ className, ...props }, ref) => (
  <Menu.Separator
    ref={ref}
    className={cn(menuSeparatorClass, className)}
    {...props}
  />
))
ActionMenuSeparator.displayName = 'ActionMenuSeparator'

/** Trailing key hint inside a menu item, e.g. `Ctrl+Enter`. */
export const ActionMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn(menuShortcutClass, className)} {...props} />
)
ActionMenuShortcut.displayName = 'ActionMenuShortcut'

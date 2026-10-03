import * as React from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActivePortalTheme } from '@/components/ui/portal-theme'

export const ActionMenu = Menu.Root
export const ActionMenuTrigger = Menu.Trigger
export const ActionMenuRadioGroup = Menu.RadioGroup
export const ActionMenuLabel = Menu.Label
export const ActionMenuSub = Menu.Sub

const contentClass =
  'z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-48 overflow-y-auto rounded-radius-lg border border-border-default bg-components-dropdown-bg p-space-xs text-sm text-text-primary shadow-elevation-medium'

export const ActionMenuContent = React.forwardRef<
  React.ElementRef<typeof Menu.Content>,
  React.ComponentPropsWithoutRef<typeof Menu.Content>
>(({ className, sideOffset = 6, ...props }, ref) => {
  const theme = useActivePortalTheme(true)
  return (
    <Menu.Portal>
      <Menu.Content
        ref={ref}
        data-theme={theme}
        sideOffset={sideOffset}
        className={cn(contentClass, className)}
        {...props}
      />
    </Menu.Portal>
  )
})
ActionMenuContent.displayName = 'ActionMenuContent'

const itemClass =
  'flex min-h-8 cursor-default items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs outline-hidden data-[highlighted]:bg-state-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50'

export const ActionMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Menu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof Menu.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <Menu.SubTrigger ref={ref} className={cn(itemClass, className)} {...props}>
    {children}
    <ChevronRight className="ml-auto size-icon-sm shrink-0 text-text-tertiary" />
  </Menu.SubTrigger>
))
ActionMenuSubTrigger.displayName = 'ActionMenuSubTrigger'

export const ActionMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Menu.SubContent>,
  React.ComponentPropsWithoutRef<typeof Menu.SubContent>
>(({ className, ...props }, ref) => {
  const theme = useActivePortalTheme(true)
  return (
    <Menu.Portal>
      <Menu.SubContent
        ref={ref}
        data-theme={theme}
        className={cn(contentClass, className)}
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
      itemClass,
      danger && 'text-status-error data-[highlighted]:bg-status-error-subtle',
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
  <Menu.RadioItem ref={ref} className={cn(itemClass, className)} {...props}>
    {children}
    <span className="ml-auto flex size-icon-sm items-center justify-center">
      <Menu.ItemIndicator>
        <Check className="size-icon-sm" />
      </Menu.ItemIndicator>
    </span>
  </Menu.RadioItem>
))
ActionMenuRadioItem.displayName = 'ActionMenuRadioItem'

export const ActionMenuSeparator = () => (
  <Menu.Separator className="my-space-xs border-t border-border-subtle" />
)

'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-radius-xl bg-components-popover-bg text-text-primary',
      className,
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="flex items-center gap-space-sm px-space-base"
    data-cmdk-input-wrapper=""
  >
    <Search className="size-icon-sm shrink-0 text-text-tertiary" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex min-h-[var(--control-height)] w-full bg-transparent py-space-sm text-sm outline-hidden placeholder:text-components-input-text-placeholder disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[300px] overflow-x-hidden overflow-y-auto', className)}
    onWheel={(e) => e.stopPropagation()}
    onMouseEnter={(e) => e.currentTarget.focus()}
    tabIndex={-1}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-space-lg text-center text-sm text-text-tertiary"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-space-xs text-text-primary [&_[cmdk-group-heading]]:px-space-sm [&_[cmdk-group-heading]]:pt-space-sm [&_[cmdk-group-heading]]:pb-space-2xs [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary',
      className,
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('-mx-space-xs h-px bg-border-default', className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex min-h-[var(--control-height)] cursor-pointer items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected='true']:bg-state-hover data-[selected=true]:text-text-primary [&_svg]:pointer-events-none [&_svg]:size-icon-sm [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto pl-space-md font-mono text-xs text-text-tertiary',
        className,
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = 'CommandShortcut'

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
}

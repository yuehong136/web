import * as React from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import {
  ActionMenuContent,
  ActionMenuShortcut,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
} from './action-menu'

/**
 * The long-standing DropdownMenu API on Radix DropdownMenu, so every menu
 * shares ActionMenu's keyboard model (arrow keys, typeahead, Escape) and
 * geometry. Items keep `onClick`; Radix runs it for pointer and keyboard
 * selection alike.
 */
export interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

export interface DropdownMenuContentProps {
  align?: 'left' | 'right'
  className?: string
  children: React.ReactNode
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children: React.ReactNode
}

const DropdownMenuOpenContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  open,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange],
  )
  const context = React.useMemo(
    () => ({ open: isOpen, setOpen }),
    [isOpen, setOpen],
  )
  return (
    <DropdownMenuOpenContext.Provider value={context}>
      <Menu.Root open={isOpen} onOpenChange={setOpen}>
        {children}
      </Menu.Root>
    </DropdownMenuOpenContext.Provider>
  )
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  asChild = false,
  children,
  className,
}) => {
  const context = React.useContext(DropdownMenuOpenContext)
  return (
    <Menu.Trigger
      asChild={asChild}
      className={asChild ? undefined : className}
      onClick={(event) => {
        // Triggers sit inside clickable rows and cards; opening must not activate them.
        event.stopPropagation()
        // Radix opens on pointer down and on keys. A click without a pointer
        // (assistive technology, scripted activation) would otherwise do nothing.
        if (event.detail === 0) context?.setOpen(!context.open)
      }}
    >
      {children}
    </Menu.Trigger>
  )
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  align = 'right',
  className,
  children,
}) => (
  <ActionMenuContent
    align={align === 'right' ? 'end' : 'start'}
    sideOffset={8}
    className={cn('min-w-44', className)}
  >
    {children}
  </ActionMenuContent>
)

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, children, disabled, type = 'button', ...props }, ref) => (
  <Menu.Item asChild disabled={disabled}>
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        menuItemClass,
        'w-full text-left [&_svg]:text-fg-muted [&_svg:not([class*=size-])]:size-icon-sm',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  </Menu.Item>
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({
  className,
}) => <Menu.Separator className={cn(menuSeparatorClass, className)} />

export interface DropdownMenuLabelProps {
  className?: string
  children: React.ReactNode
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
  className,
  children,
}) => (
  <Menu.Label className={cn(menuLabelClass, className)}>{children}</Menu.Label>
)

export const DropdownMenuShortcut = ActionMenuShortcut

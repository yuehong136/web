import * as React from "react"
import { cn } from "@/lib/utils"
import { Dropdown, DropdownItem as BaseDropdownItem } from "./dropdown"

export interface DropdownMenuProps {
  children: React.ReactNode
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

const DropdownMenuContext = React.createContext<{
  trigger: React.ReactNode
  setTrigger: (trigger: React.ReactNode) => void
} | undefined>(undefined)

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [trigger, setTrigger] = React.useState<React.ReactNode>(null)

  return (
    <DropdownMenuContext.Provider value={{ trigger, setTrigger }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  asChild = false, 
  children,
  className,
  ...props 
}) => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within DropdownMenu')
  }

  React.useEffect(() => {
    context.setTrigger(
      asChild ? children : (
        <button className={className} {...props}>
          {children}
        </button>
      )
    )
  }, [children, asChild, className, context])

  return null
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  align = 'right',
  className,
  children 
}) => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenuContent must be used within DropdownMenu')
  }

  if (!context.trigger) {
    return null
  }

  return (
    <Dropdown 
      trigger={context.trigger} 
      align={align} 
      className={className}
    >
      {children}
    </Dropdown>
  )
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  className,
  children,
  onClick,
  ...props 
}) => {
  return (
    <BaseDropdownItem
      className={cn(
        "w-full flex items-center space-x-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors text-gray-700",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </BaseDropdownItem>
  )
}

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div 
      className={cn("h-px bg-border mx-2 my-1", className)} 
      role="separator" 
    />
  )
}
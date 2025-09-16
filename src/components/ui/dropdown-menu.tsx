import * as React from "react"
import { cn } from "@/lib/utils"
import { DropdownItem as BaseDropdownItem } from "./dropdown"

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
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  closeDropdown?: () => void
} | undefined>(undefined)

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const closeDropdown = React.useCallback(() => setIsOpen(false), [])

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, closeDropdown }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    context.setIsOpen(!context.isOpen)
  }

  if (asChild) {
    // 如果是asChild，我们需要clone children并添加onClick
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick
    })
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  align = 'right',
  className,
  children 
}) => {
  const context = React.useContext(DropdownMenuContext)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // 处理点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        context?.closeDropdown?.()
      }
    }

    if (context?.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [context?.isOpen, context?.closeDropdown])
  
  if (!context) {
    throw new Error('DropdownMenuContent must be used within DropdownMenu')
  }

  if (!context.isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" onClick={() => context.closeDropdown?.()} />
      
      {/* Dropdown content */}
      <div 
        ref={dropdownRef}
        className={cn(
          "absolute z-20 mt-2 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg",
          align === 'right' ? 'right-0' : 'left-0',
          className
        )}
      >
        <div className="py-1">
          {children}
        </div>
      </div>
    </>
  )
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  className,
  children,
  onClick,
  ...props 
}) => {
  const context = React.useContext(DropdownMenuContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }
    // 自动关闭下拉框
    context?.closeDropdown?.()
  }

  return (
    <BaseDropdownItem
      className={cn(
        "w-full flex items-center space-x-2 px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200",
        className
      )}
      onClick={handleClick}
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

export interface DropdownMenuLabelProps {
  className?: string
  children: React.ReactNode
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  className,
  children 
}) => {
  return (
    <div 
      className={cn("px-2 py-1.5 text-sm font-semibold text-gray-900", className)}
      role="label"
    >
      {children}
    </div>
  )
}
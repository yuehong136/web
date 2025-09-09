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
  trigger: React.ReactNode
  setTrigger: (trigger: React.ReactNode) => void
  closeDropdown?: () => void
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
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  
  // 总是创建contextWithClose，即使可能不会使用
  const contextWithClose = React.useMemo(() => {
    if (!context) {
      return undefined
    }
    return {
      ...context,
      closeDropdown: () => setIsOpen(false)
    }
  }, [context])

  // 处理点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  if (!context) {
    throw new Error('DropdownMenuContent must be used within DropdownMenu')
  }

  if (!context.trigger) {
    return null
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {context.trigger}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className={cn(
            "absolute z-20 mt-2 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg",
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}>
            <div className="py-1">
              <DropdownMenuContext.Provider value={contextWithClose!}>
                {children}
              </DropdownMenuContext.Provider>
            </div>
          </div>
        </>
      )}
    </div>
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
    if (context?.closeDropdown) {
      context.closeDropdown()
    }
  }

  return (
    <BaseDropdownItem
      className={cn(
        "w-full flex items-center space-x-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors text-gray-700",
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
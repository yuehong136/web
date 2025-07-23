import * as React from "react"
import { cn } from "../../lib/utils"

interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  children?: React.ReactNode
  items?: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, 
  children,
  items,
  align = 'right',
  className 
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown content */}
          <div className={cn(
            "absolute z-20 mt-2 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg",
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}>
            <div className="py-1">
              {items ? items.map((item, index) => (
                <DropdownItem
                  key={index}
                  icon={item.icon}
                  danger={item.destructive}
                  onClick={() => {
                    item.onClick()
                    setIsOpen(false)
                  }}
                >
                  {item.label}
                </DropdownItem>
              )) : children}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  icon?: React.ReactNode
  danger?: boolean
}

const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  icon, 
  danger = false, 
  className,
  ...props 
}) => {
  return (
    <button
      className={cn(
        "w-full flex items-center space-x-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700",
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

export { Dropdown, DropdownItem }
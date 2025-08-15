import * as React from "react"
import { ChevronDown, Check } from "lucide-react"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
  disabled?: boolean
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

export interface SelectContentProps {
  children?: React.ReactNode
  className?: string
}

export interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children?: React.ReactNode
}

export interface SelectValueProps {
  placeholder?: string
}

// Simple Select implementation without Radix UI
const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  placeholder?: string
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  placeholder, 
  children,
  disabled 
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
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
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, placeholder }}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = "", children, ...props }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(SelectContext)

    return (
      <button
        ref={ref}
        type="button"
        className={`flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value, placeholder: contextPlaceholder } = React.useContext(SelectContext)
  
  if (value) {
    return <span>{value}</span>
  }
  
  return (
    <span className="text-gray-500">
      {placeholder || contextPlaceholder || "请选择..."}
    </span>
  )
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = "" }) => {
  const { isOpen } = React.useContext(SelectContext)

  if (!isOpen) return null

  return (
    <div className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg ${className}`}>
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

export const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ value, children, className = "", ...props }, ref) => {
    const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext)
    const isSelected = selectedValue === value

    return (
      <button
        ref={ref}
        type="button"
        className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 transition-colors ${
          isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
        } ${className}`}
        onClick={() => {
          onValueChange?.(value)
          setIsOpen(false)
        }}
        {...props}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-4 w-4" />
          </span>
        )}
        {children}
      </button>
    )
  }
)
SelectItem.displayName = "SelectItem"

// Placeholder exports for compatibility
export const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>
}

export const SelectLabel: React.FC<{ children: React.ReactNode, className?: string }> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`py-1.5 pl-8 pr-2 text-sm font-semibold text-gray-900 ${className}`}>
      {children}
    </div>
  )
}

export const SelectSeparator: React.FC<{ className?: string }> = ({ className = "" }) => {
  return <hr className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} />
}
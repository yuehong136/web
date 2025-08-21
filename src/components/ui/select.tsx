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
        className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 py-3 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
        style={{
          backgroundColor: 'var(--color-components-select-bg)',
          borderColor: 'var(--color-components-select-border)',
          color: 'var(--color-components-select-text)',
          '--tw-ring-color': 'var(--color-components-select-border-focus)'
        } as React.CSSProperties}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-components-select-border-focus)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-components-select-border)'
        }}
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
    <span style={{ color: 'var(--color-components-select-placeholder)' }}>
      {placeholder || contextPlaceholder || "请选择..."}
    </span>
  )
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = "" }) => {
  const { isOpen } = React.useContext(SelectContext)

  if (!isOpen) return null

  return (
    <div 
      className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border shadow-lg ${className}`}
      style={{
        backgroundColor: 'var(--color-components-dropdown-bg)',
        borderColor: 'var(--color-components-dropdown-border)',
        boxShadow: 'var(--color-components-dropdown-shadow)'
      }}
    >
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
        className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors ${className}`}
        style={{
          backgroundColor: isSelected 
            ? 'rgba(59, 130, 246, 0.1)' 
            : 'transparent',
          color: isSelected 
            ? 'var(--color-text-accent)' 
            : 'var(--color-components-dropdown-item-text)'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--color-components-dropdown-item-bg-hover)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
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
    <div className={`py-1.5 pl-8 pr-2 text-sm font-semibold ${className}`} style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </div>
  )
}

export const SelectSeparator: React.FC<{ className?: string }> = ({ className = "" }) => {
  return <hr className={`-mx-1 my-1 h-px ${className}`} style={{ backgroundColor: 'var(--color-border-default)' }} />
}
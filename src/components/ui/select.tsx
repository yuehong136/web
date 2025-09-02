import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
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
  selectRef?: React.RefObject<HTMLDivElement>
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  placeholder, 
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null as HTMLDivElement | null)

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
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, placeholder, selectRef: selectRef as unknown as React.RefObject<HTMLDivElement> }}>
      <div ref={selectRef as unknown as React.RefObject<HTMLDivElement>} className="relative">
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
  const { isOpen, selectRef } = React.useContext(SelectContext)

  const [position, setPosition] = React.useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 })

  const updatePosition = React.useCallback(() => {
    if (!selectRef?.current) return
    const rect = selectRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const dropdownWidth = rect.width
    let left = rect.left
    if (left + dropdownWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - dropdownWidth - 8)
    }
    const top = rect.bottom
    setPosition({ left, top, width: dropdownWidth })
  }, [selectRef])

  React.useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
    const handler = () => updatePosition()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [isOpen, updatePosition])

  if (!isOpen) return null

  const content = (
    <div 
      className={`z-[1000] mt-1 max-h-60 overflow-auto scrollbar-thin rounded-xl border shadow-lg ${className}`}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        width: position.width,
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

  return createPortal(content, document.body)
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
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-components-dropdown-item-bg-hover)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
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
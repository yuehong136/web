import * as React from "react"

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  className?: string
}

export interface TabsListProps {
  children?: React.ReactNode
  className?: string
}

export interface TabsTriggerProps {
  value: string
  children?: React.ReactNode
  className?: string
  disabled?: boolean
}

export interface TabsContentProps {
  value: string
  children?: React.ReactNode
  className?: string
}

// Simple Tabs implementation without Radix UI
const TabsContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

export const Tabs: React.FC<TabsProps> = ({ 
  defaultValue, 
  value, 
  onValueChange, 
  children,
  className = ""
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  
  const currentValue = value !== undefined ? value : internalValue
  
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = "" }) => {
  return (
    <div className={`inline-flex h-12 items-center justify-center rounded-xl p-1 shadow-sm ${className}`}
         style={{ 
           backgroundColor: 'var(--color-components-tabs-bg)', 
           color: 'var(--color-components-tabs-inactive-text)',
           border: '1px solid var(--color-components-tabs-border)'
         }}>
      {children}
    </div>
  )
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  children, 
  className = "",
  disabled = false 
}) => {
  const { value: activeValue, onValueChange } = React.useContext(TabsContext)
  const isActive = activeValue === value

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onValueChange?.(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      style={{
        backgroundColor: isActive ? 'var(--color-components-tabs-active-bg)' : 'transparent',
        color: isActive ? 'var(--color-components-tabs-active-text)' : 'var(--color-components-tabs-inactive-text)',
        boxShadow: isActive ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.target as HTMLElement).style.backgroundColor = 'var(--color-state-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.target as HTMLElement).style.backgroundColor = 'transparent'
        }
      }}
    >
      {children}
    </button>
  )
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children, 
  className = "" 
}) => {
  const { value: activeValue } = React.useContext(TabsContext)
  
  if (activeValue !== value) {
    return null
  }

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  )
}
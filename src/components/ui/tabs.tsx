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
    <div className={`inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-600 border border-gray-200 shadow-sm ${className}`}>
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
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      } ${className}`}
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
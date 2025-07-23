import React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectOption {
  value: string
  label: string
  icon?: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "请选择",
  className,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'lg':
        return 'px-5 py-4 text-lg'
      default:
        return 'px-4 py-3'
    }
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* 选择器按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full text-left border rounded-lg bg-white transition-all duration-200",
          "hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
          getSizeClasses(),
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-300"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <span className="text-lg">{selectedOption.icon}</span>
                )}
                <span className="text-gray-900">{selectedOption.label}</span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0",
                    value === option.value && "bg-blue-50 border-blue-100"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {option.icon && (
                        <span className="text-lg">{option.icon}</span>
                      )}
                      <span className="text-gray-900">{option.label}</span>
                    </div>
                    {value === option.value && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
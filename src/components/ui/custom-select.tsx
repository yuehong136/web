import React from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Portal组件，将下拉菜单渲染到body
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) {
    return null
  }

  return createPortal(children, document.body)
}

// 全局z-index计数器，确保每个下拉框都有更高的层级
let globalZIndex = 10000

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "请选择",
  className,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [zIndex, setZIndex] = React.useState(globalZIndex)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })

  const selectedOption = options.find(option => option.value === value)

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (!isOpen) {
      // 打开时分配新的z-index
      globalZIndex += 10
      setZIndex(globalZIndex)
    }
    setIsOpen(!isOpen)
  }
  
  // 计算下拉菜单位置
  const updateDropdownPosition = React.useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [])
  
  // 当打开下拉菜单时更新位置
  React.useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      
      const handleScroll = () => updateDropdownPosition()
      const handleResize = () => updateDropdownPosition()
      
      window.addEventListener('scroll', handleScroll, true) // 使用capture来捕获所有滚动事件
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isOpen, updateDropdownPosition])

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
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
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

      {/* 下拉菜单 - 使用 Portal 渲染到 body */}
      {isOpen && (
        <Portal>
          <>
            <div 
              className="fixed inset-0 bg-transparent"
              style={{ zIndex: zIndex - 1 }}
              onClick={() => setIsOpen(false)} 
            />
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: zIndex
              }}
            >
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
        </Portal>
      )}
    </div>
  )
}
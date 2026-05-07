import React from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNearestPortalTheme } from './portal-theme'

interface SelectOption {
  value: string
  label: string
  icon?: string
}

export interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
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
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const theme = useNearestPortalTheme(buttonRef, isOpen)

  const selectedOption = options.find(option => option.value === value)

  // 点击外部关闭 - 需要同时检查触发按钮和 Portal 中的下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideTrigger = dropdownRef.current?.contains(target)
      const isInsideMenu = menuRef.current?.contains(target)
      
      if (!isInsideTrigger && !isInsideMenu) {
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
        return 'h-9 px-3 text-sm'
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
          "w-full text-left border rounded-lg transition-all duration-200",
          "focus:outline-none focus:ring-2",
          getSizeClasses()
        )}
        style={{
          backgroundColor: 'var(--color-components-input-bg)',
          borderColor: isOpen ? 'var(--color-state-focus)' : 'var(--color-components-input-border)',
          boxShadow: isOpen ? '0 0 0 2px var(--color-state-focus-10)' : undefined
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <span className="text-lg">{selectedOption.icon}</span>
                )}
                <span style={{ color: 'var(--color-text-primary)' }}>{selectedOption.label}</span>
              </>
            ) : (
              <span style={{ color: 'var(--color-text-tertiary)' }}>{placeholder}</span>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>
      </button>

      {/* 下拉菜单 - 使用 Portal 渲染到 body */}
      {isOpen && (
        <Portal>
          <>
            <div 
              data-theme={theme}
              className="fixed inset-0 bg-transparent"
              style={{ zIndex: zIndex - 1 }}
              onClick={() => setIsOpen(false)} 
            />
            <div 
              data-theme={theme}
              ref={menuRef}
              className="fixed rounded-lg max-h-64 overflow-hidden"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: zIndex,
                backgroundColor: 'var(--color-components-dropdown-bg)',
                border: '1px solid var(--color-components-dropdown-border)',
                boxShadow: 'var(--color-components-dropdown-shadow)'
              }}
            >
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="w-full px-4 py-3 text-left transition-colors duration-150 border-b last:border-b-0"
                    style={{
                      backgroundColor: value === option.value ? 'var(--color-state-focus-10)' : undefined,
                      borderColor: 'var(--color-border-subtle)'
                    }}
                    onMouseEnter={(e) => {
                      if (value !== option.value) {
                        e.currentTarget.style.backgroundColor = 'var(--color-components-dropdown-item-bg-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = value === option.value ? 'var(--color-state-focus-10)' : ''
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {option.icon && (
                          <span className="text-lg">{option.icon}</span>
                        )}
                        <span style={{ color: 'var(--color-text-primary)' }}>{option.label}</span>
                      </div>
                      {value === option.value && (
                        <Check className="h-4 w-4" style={{ color: 'var(--color-state-focus)' }} />
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

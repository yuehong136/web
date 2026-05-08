import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useNearestPortalTheme } from './portal-theme'

// Context 用于传递关闭函数
const DropdownContext = React.createContext<{ close: () => void } | null>(null)

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
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0, right: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const theme = useNearestPortalTheme(triggerRef, isOpen)

  // 计算下拉菜单位置
  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4, // 4px 间距
        left: rect.left,
        right: window.innerWidth - rect.right,
      })
    }
  }, [])

  // 打开时计算位置
  React.useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
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

  // ESC 键关闭
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // 滚动时关闭
  React.useEffect(() => {
    if (isOpen) {
      const handleScroll = () => setIsOpen(false)
      window.addEventListener('scroll', handleScroll, true)
      return () => window.removeEventListener('scroll', handleScroll, true)
    }
    return undefined
  }, [isOpen])

  // Context value
  const contextValue = React.useMemo(
    () => ({ close: () => setIsOpen(false) }),
    [],
  )

  const dropdownContent = isOpen && (
    <DropdownContext.Provider value={contextValue}>
      {/* Backdrop */}
      <div
        data-theme={theme}
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown content - 使用 Portal 渲染到 body */}
      <div
        data-theme={theme}
        ref={dropdownRef}
        className={cn(
          'fixed z-[9999] min-w-[160px] rounded-lg shadow-lg',
          'border border-border-default bg-background-surface',
          className,
        )}
        style={{
          top: position.top,
          ...(align === 'right'
            ? { right: position.right }
            : { left: position.left }),
        }}
      >
        <div className="rounded-lg bg-background-surface py-1">
          {items
            ? items.map((item, index) => (
                <DropdownItem
                  key={index}
                  icon={item.icon}
                  danger={item.destructive}
                  onClick={item.onClick}
                >
                  {item.label}
                </DropdownItem>
              ))
            : children}
        </div>
      </div>
    </DropdownContext.Provider>
  )

  return (
    <div className="relative inline-block text-left" ref={triggerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {createPortal(dropdownContent, document.body)}
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
  onClick,
  ...props
}) => {
  const context = React.useContext(DropdownContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    // 关闭下拉菜单
    context?.close()
  }

  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm',
        danger
          ? 'text-status-error hover:bg-state-error-subtle'
          : 'text-text-secondary hover:bg-background-subtle',
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

export { Dropdown, DropdownItem }

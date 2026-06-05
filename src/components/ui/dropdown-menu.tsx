import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useNearestPortalTheme } from './portal-theme'

export interface DropdownMenuProps {
  children: React.ReactNode
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

export interface DropdownMenuContentProps {
  align?: 'left' | 'right'
  className?: string
  children: React.ReactNode
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children: React.ReactNode
}

const DropdownMenuContext = React.createContext<
  | {
      isOpen: boolean
      setIsOpen: (open: boolean) => void
      closeDropdown?: () => void
      triggerRef: React.RefObject<HTMLDivElement | null>
    }
  | undefined
>(undefined)

const DROPDOWN_MENU_OFFSET = 8
const DROPDOWN_VIEWPORT_MARGIN = 8

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const closeDropdown = React.useCallback(() => setIsOpen(false), [])

  return (
    <DropdownMenuContext.Provider
      value={{ isOpen, setIsOpen, closeDropdown, triggerRef }}
    >
      <div ref={triggerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  asChild = false,
  children,
  className,
  ...props
}) => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within DropdownMenu')
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    context.setIsOpen(!context.isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    // 如果是asChild，我们需要clone children并添加onClick
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any)
  }

  return (
    <button className={className} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  align = 'right',
  className,
  children,
}) => {
  const context = React.useContext(DropdownMenuContext)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const fallbackRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const theme = useNearestPortalTheme(
    context?.triggerRef ?? fallbackRef,
    Boolean(context?.isOpen),
  )

  // 计算下拉菜单位置
  const updatePosition = React.useCallback(() => {
    if (!context?.isOpen || !context.triggerRef.current) {
      return
    }

    const rect = context.triggerRef.current.getBoundingClientRect()
    const menuWidth = dropdownRef.current?.offsetWidth ?? 180
    const preferredLeft = align === 'right' ? rect.right - menuWidth : rect.left
    const maxLeft = window.innerWidth - menuWidth - DROPDOWN_VIEWPORT_MARGIN

    setPosition({
      top: rect.bottom + DROPDOWN_MENU_OFFSET,
      left: Math.min(
        Math.max(DROPDOWN_VIEWPORT_MARGIN, preferredLeft),
        Math.max(DROPDOWN_VIEWPORT_MARGIN, maxLeft),
      ),
    })
  }, [align, context?.isOpen, context?.triggerRef])

  React.useLayoutEffect(() => {
    if (!context?.isOpen) {
      return undefined
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [context?.isOpen, updatePosition])

  // 处理点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        context?.triggerRef.current &&
        !context.triggerRef.current.contains(event.target as Node)
      ) {
        context?.closeDropdown?.()
      }
    }

    if (context?.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只监听 context 具体字段，全量 context 作为依赖会被反复创建
  }, [context?.isOpen, context?.closeDropdown, context?.triggerRef])

  if (!context) {
    throw new Error('DropdownMenuContent must be used within DropdownMenu')
  }

  if (!context.isOpen) {
    return null
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        data-theme={theme}
        className="fixed inset-0 z-[9998]"
        onClick={() => context.closeDropdown?.()}
      />

      {/* Dropdown content */}
      <div
        data-theme={theme}
        ref={dropdownRef}
        className={cn(
          'rounded-radius-md p-space-xs shadow-elevation-medium fixed z-[9999] min-w-[180px] border border-border-default bg-background-surface',
          className,
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {children}
      </div>
    </>,
    document.body,
  )
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  className,
  children,
  onClick,
  ...props
}) => {
  const context = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }
    // 自动关闭下拉框
    context?.closeDropdown?.()
  }

  return (
    <button
      type="button"
      className={cn(
        'gap-space-sm rounded-radius-sm px-space-sm [&_svg]:h-icon-sm [&_svg]:w-icon-sm flex h-8 w-full items-center text-left text-sm font-medium text-text-primary transition-colors hover:bg-background-subtle disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:stroke-[1.75] [&_svg]:text-text-secondary',
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        'mx-space-xs my-space-xs h-px bg-border-default',
        className,
      )}
      role="separator"
    />
  )
}

export interface DropdownMenuLabelProps {
  className?: string
  children: React.ReactNode
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-sm font-semibold text-text-primary',
        className,
      )}
      role="label"
    >
      {children}
    </div>
  )
}

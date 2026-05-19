import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import { useActivePortalTheme } from './portal-theme'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export interface DialogContentProps {
  className?: string
  children: React.ReactNode
  /** 覆盖 Portal 根节点主题，供 ScopedTheme 子树内弹窗使用 */
  theme?: string | null
  /** 弹窗尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean
  /** 点击遮罩层关闭 */
  closeOnOverlayClick?: boolean
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  '3xl': 'max-w-7xl',
  full: 'max-w-[calc(100vw-2rem)]',
}

const DialogContext = React.createContext<
  | {
      open: boolean
      onOpenChange: (open: boolean) => void
    }
  | undefined
>(undefined)

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({
  children,
  onClick,
  asChild = false,
  ...props
}) => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('DialogTrigger must be used within Dialog')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(true)
    onClick?.(e)
  }

  const Comp = asChild ? Slot : 'button'

  return (
    <Comp {...props} onClick={handleClick}>
      {children}
    </Comp>
  )
}

export const DialogClose: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, onClick, ...props }) => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('DialogClose must be used within Dialog')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(false)
    onClick?.(e)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

/**
 * Dialog 内容容器
 *
 * 现代化设计：
 * - 毛玻璃遮罩
 * - 圆角卡片
 * - 流畅动画
 * - 灵活的内容布局
 */
export const DialogContent: React.FC<DialogContentProps> = ({
  className,
  children,
  theme,
  size = 'lg',
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('DialogContent must be used within Dialog')
  }

  const { open, onOpenChange } = context
  const scopedTheme = useActivePortalTheme(open, theme)

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  // Handle overlay click
  if (!open) return null
  const content = (
    <dialog
      open
      data-theme={scopedTheme}
      className="fixed inset-0 z-50 m-0 flex h-screen max-h-none w-screen max-w-none items-center justify-center border-0 bg-transparent p-4"
      aria-modal="true"
    >
      {/* Overlay */}
      {closeOnOverlayClick ? (
        <button
          type="button"
          aria-label="关闭弹窗"
          className="animate-in fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm duration-200"
          onClick={() => onOpenChange(false)}
        />
      ) : (
        <div className="animate-in fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm duration-200" />
      )}

      {/* Dialog Container */}
      <div
        className={cn(
          'relative z-10 w-full rounded-xl shadow-2xl',
          'bg-[var(--color-background-surface)]',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'flex max-h-[calc(100vh-2rem)] flex-col',
          sizeClasses[size],
          className,
        )}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              'absolute right-4 top-4 z-10',
              'rounded-lg p-1.5',
              'text-[var(--color-text-tertiary)]',
              'hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]',
              'transition-colors duration-150',
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </button>
        )}

        {children}
      </div>
    </dialog>
  )

  return createPortal(content, document.body)
}

/**
 * Dialog 头部
 */
export const DialogHeader: React.FC<DialogHeaderProps> = ({
  className,
  ...props
}) => <div className={cn('shrink-0 px-6 pb-4 pt-6', className)} {...props} />

/**
 * Dialog 标题
 */
export const DialogTitle: React.FC<DialogTitleProps> = ({
  className,
  children,
  ...props
}) => (
  <h2
    className={cn(
      'pr-8 text-lg font-semibold text-[var(--color-text-primary)]',
      className,
    )}
    {...props}
  >
    {children}
  </h2>
)

/**
 * Dialog 描述文本
 */
export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  className,
  ...props
}) => (
  <p
    className={cn('mt-1 text-sm text-[var(--color-text-secondary)]', className)}
    {...props}
  />
)

/**
 * Dialog 底部
 */
export const DialogFooter: React.FC<DialogFooterProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-end gap-3 px-6 py-4',
      'border-t border-[var(--color-border-subtle)]',
      className,
    )}
    {...props}
  />
)

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export interface DialogContentProps {
  className?: string
  children: React.ReactNode
  /** 弹窗尺寸 */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean
  /** 点击遮罩层关闭 */
  closeOnOverlayClick?: boolean
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
  "3xl": "max-w-7xl",
  full: "max-w-[calc(100vw-2rem)]",
}

const DialogContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | undefined>(undefined)

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ 
  children, 
  onClick, 
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
  size = "lg",
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('DialogContent must be used within Dialog')
  }

  const { open, onOpenChange } = context

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onOpenChange])

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onOpenChange(false)
    }
  }

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleOverlayClick}
      />
      
      {/* Dialog Container */}
      <div
        className={cn(
          "relative z-10 w-full rounded-xl shadow-2xl",
          "bg-[var(--color-background-surface)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "flex flex-col max-h-[calc(100vh-2rem)]",
          sizeClasses[size],
          className
        )}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "absolute right-4 top-4 z-10",
              "p-1.5 rounded-lg",
              "text-[var(--color-text-tertiary)]",
              "hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]",
              "transition-colors duration-150"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </button>
        )}

        {children}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

/**
 * Dialog 头部
 */
export const DialogHeader: React.FC<DialogHeaderProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "shrink-0 px-6 pt-6 pb-4",
      className
    )}
    {...props}
  />
)

/**
 * Dialog 标题
 */
export const DialogTitle: React.FC<DialogTitleProps> = ({ className, ...props }) => (
  <h2
    className={cn(
      "text-lg font-semibold text-[var(--color-text-primary)] pr-8",
      className
    )}
    {...props}
  />
)

/**
 * Dialog 描述文本
 */
export const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, ...props }) => (
  <p
    className={cn(
      "text-sm text-[var(--color-text-secondary)] mt-1",
      className
    )}
    {...props}
  />
)

/**
 * Dialog 底部
 */
export const DialogFooter: React.FC<DialogFooterProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "shrink-0 flex items-center justify-end gap-3 px-6 py-4",
      "border-t border-[var(--color-border-subtle)]",
      className
    )}
    {...props}
  />
)
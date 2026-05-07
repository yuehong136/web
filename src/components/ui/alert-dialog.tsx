import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils" 
import { Button, type ButtonProps } from "./button"
import { useActivePortalTheme } from "./portal-theme"

export interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: string | null
}
export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface AlertDialogActionProps extends ButtonProps {}
export interface AlertDialogCancelProps extends ButtonProps {}

const AlertDialogContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | undefined>(undefined)

/**
 * AlertDialog 组件
 * 
 * 用于需要用户确认的重要操作
 * 不可通过点击遮罩层关闭
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

export const AlertDialogTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ 
  children, 
  onClick, 
  ...props 
}) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error('AlertDialogTrigger must be used within AlertDialog')
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
 * AlertDialog 内容容器
 */
export const AlertDialogContent: React.FC<AlertDialogContentProps & {
  children: React.ReactNode
}> = ({ className, children, theme, ...props }) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error('AlertDialogContent must be used within AlertDialog')
  }

  const { open } = context
  const scopedTheme = useActivePortalTheme(open, theme)

  // Handle escape key - AlertDialog 不响应 ESC 关闭
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  const content = (
    <div
      data-theme={scopedTheme}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
    >
      {/* Overlay - 不可点击关闭 */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200" />
      
      {/* AlertDialog Container */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl shadow-2xl",
          "bg-[var(--color-background-surface)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

/**
 * AlertDialog 头部
 */
export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ className, ...props }) => (
  <div
    className={cn("space-y-2", className)}
    {...props}
  />
)

/**
 * AlertDialog 底部
 */
export const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "flex items-center justify-end gap-3 mt-6",
      className
    )}
    {...props}
  />
)

/**
 * AlertDialog 标题
 */
export const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ className, ...props }) => (
  <h2
    className={cn(
      "text-lg font-semibold text-[var(--color-text-primary)]",
      className
    )}
    {...props}
  />
)

/**
 * AlertDialog 描述
 */
export const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      "text-sm text-[var(--color-text-secondary)]",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

/**
 * AlertDialog 确认按钮
 */
export const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ onClick, ...props }) => {
  const context = React.useContext(AlertDialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.onOpenChange(false)
  }

  return (
    <Button
      onClick={handleClick}
      {...props}
    />
  )
}

/**
 * AlertDialog 取消按钮
 */
export const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ onClick, ...props }) => {
  const context = React.useContext(AlertDialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.onOpenChange(false)
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      {...props}
    />
  )
}

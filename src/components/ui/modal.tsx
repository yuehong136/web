import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useActivePortalTheme } from "./portal-theme"

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** 标题文本 */
  title?: string
  /** 标题图标 */
  icon?: React.ReactNode
  /** 描述文本 */
  description?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  footer?: React.ReactNode
  className?: string
  theme?: string | null
  /** 内容区域的自定义类名 */
  contentClassName?: string
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
}

/**
 * 现代化 Modal 组件
 * 
 * 设计特点：
 * - 简洁的视觉风格，无多余边框
 * - 毛玻璃遮罩层
 * - 流畅的入场动画
 * - 清晰的信息层次
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  icon,
  description,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  className,
  theme,
  contentClassName,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const scopedTheme = useActivePortalTheme(open, theme)

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose()
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
  }, [open, closeOnEscape, onClose])

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  const modalContent = (
    <div
      data-theme={scopedTheme}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Overlay - 毛玻璃效果 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleOverlayClick}
      />
      
      {/* Modal Container */}
      <div
        ref={modalRef}
        className={cn(
          "relative z-10 w-full rounded-xl shadow-2xl",
          "bg-[var(--color-background-surface)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "flex flex-col max-h-[calc(100vh-2rem)]",
          sizeClasses[size],
          className
        )}
      >
        {/* Close Button - 始终在右上角 */}
        {showCloseButton && (
          <button
            onClick={onClose}
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

        {/* Header - 无边框设计 */}
        {(title || icon) && (
          <div className="shrink-0 px-6 pt-6 pb-2">
            <div className="flex items-center gap-3 pr-8">
              {icon && (
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 shrink-0">
                  <span className="text-[var(--color-primary)]">{icon}</span>
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 
                    id="modal-title" 
                    className="text-lg font-semibold text-[var(--color-text-primary)] truncate"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p 
                    id="modal-description" 
                    className="mt-0.5 text-sm text-[var(--color-text-secondary)] line-clamp-2"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content - 可滚动区域 */}
        <div className={cn(
          "flex-1 overflow-y-auto px-6 py-4",
          "scrollbar-thin scrollbar-thumb-[var(--color-border-default)] scrollbar-track-transparent",
          contentClassName
        )}>
          {children}
        </div>

        {/* Footer - 简洁分隔 */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-[var(--color-border-subtle)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

/**
 * 确认对话框
 * 
 * 用于需要用户确认的操作
 */
export const ConfirmModal: React.FC<{
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  loading?: boolean
  icon?: React.ReactNode
}> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "default",
  loading = false,
  icon,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={icon}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-[var(--color-text-secondary)]">{description}</p>
    </Modal>
  )
}

export default Modal

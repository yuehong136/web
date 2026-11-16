import type * as React from 'react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  footer?: React.ReactNode
  className?: string
  theme?: string | null
  contentClassName?: string
}

/**
 * @deprecated Compose `Dialog`, `DialogContent`, `DialogHeader`, `DialogBody`
 * and `DialogFooter` from `@/components/ui/dialog`. This adapter only keeps
 * `pages/ai-tools/ref/DataInput.tsx` working until it migrates; do not add
 * new callers.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
  className,
  theme,
  contentClassName,
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent
      size={size}
      className={className}
      theme={theme}
      showCloseButton={showCloseButton}
      closeOnOverlayClick={closeOnOverlayClick}
    >
      {title || description ? (
        <DialogHeader>
          {title ? <DialogTitle>{title}</DialogTitle> : null}
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
      ) : null}
      <DialogBody className={contentClassName}>{children}</DialogBody>
      {footer ? <DialogFooter>{footer}</DialogFooter> : null}
    </DialogContent>
  </Dialog>
)

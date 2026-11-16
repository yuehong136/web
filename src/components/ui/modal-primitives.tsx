import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { useActivePortalTheme } from '@/components/ui/portal-theme'
import { dialogOverlayClass } from './dialog'

/**
 * Radix dialog for dialogs opened from inside another Radix layer, such as a
 * chunk sheet. `ui/dialog` renders a native `<dialog>`, which cannot join a
 * Radix focus scope: the sheet would pull focus back and block its pointer
 * events. Use `ui/dialog` everywhere else; the look is shared with it.
 */
export const ModalRoot = Dialog.Root
export const ModalTitle = Dialog.Title
export const ModalDescription = Dialog.Description

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
    returnFocus?: HTMLElement | null
  }
>(({ className, returnFocus, ...props }, ref) => {
  const theme = useActivePortalTheme(true)
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={cn(dialogOverlayClass, 'z-50')} />
      <Dialog.Content
        ref={ref}
        data-theme={theme}
        onCloseAutoFocus={(event) => {
          if (returnFocus?.isConnected) {
            event.preventDefault()
            returnFocus.focus()
          }
        }}
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-radius-xl border border-border-default bg-components-dialog-bg text-text-primary shadow-elevation-high outline-hidden',
          className,
        )}
        {...props}
      />
    </Dialog.Portal>
  )
})
ModalContent.displayName = 'ModalContent'

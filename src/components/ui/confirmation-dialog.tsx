import * as React from 'react'
import * as Alert from '@radix-ui/react-alert-dialog'
import { Button } from '@/components/ui/button'
import { useActivePortalTheme } from '@/components/ui/portal-theme'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  cancelLabel: string
  confirmLabel: string
  onConfirm: () => void
  pending?: boolean
  returnFocus?: HTMLElement | null
}

/** Controlled confirmation: the owner closes it after the mutation succeeds. */
export const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  pending = false,
  returnFocus,
}: ConfirmationDialogProps) => {
  const theme = useActivePortalTheme(open)
  const restoreFocus = React.useRef(returnFocus)
  React.useEffect(() => {
    if (open) restoreFocus.current = returnFocus
  }, [open, returnFocus])
  return (
    <Alert.Root open={open} onOpenChange={onOpenChange}>
      <Alert.Portal>
        <Alert.Overlay className="fixed inset-0 z-50 bg-background-overlay" />
        <Alert.Content
          data-theme={theme}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-radius-xl border border-border-default bg-background-surface p-space-lg text-text-primary shadow-elevation-high"
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault()
          }}
          onCloseAutoFocus={(event) => {
            if (restoreFocus.current?.isConnected) {
              event.preventDefault()
              restoreFocus.current.focus()
            }
          }}
        >
          <Alert.Title className="text-lg font-semibold">{title}</Alert.Title>
          <Alert.Description className="mt-space-sm text-sm text-text-secondary">
            {description}
          </Alert.Description>
          <div className="mt-space-lg flex justify-end gap-space-sm">
            <Alert.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                {cancelLabel}
              </Button>
            </Alert.Cancel>
            <Button variant="destructive" loading={pending} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  )
}

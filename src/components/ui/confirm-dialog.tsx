import * as React from 'react'
import * as Alert from '@radix-ui/react-alert-dialog'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Input } from './input'
import { dialogOverlayClass } from './dialog'
import { useActivePortalTheme, usePortalContainer } from './portal-theme'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Extra content under the description, e.g. the affected item. */
  children?: React.ReactNode
  /** Defaults to "Confirm". */
  confirmLabel?: React.ReactNode
  /** Defaults to "Cancel". */
  cancelLabel?: React.ReactNode
  /**
   * Runs the action. The owner closes the dialog (via `onOpenChange`) once
   * it succeeds, so a failed request keeps the dialog and its input.
   */
  onConfirm: () => void
  /** `destructive` paints the confirm button as a danger action. */
  variant?: 'default' | 'destructive'
  /** While true the buttons and Escape are locked and confirm shows a spinner. */
  pending?: boolean
  /** Blocks confirming until this exact text (usually the name) is typed. */
  confirmationText?: string
  /** A leading icon beside the title. */
  icon?: React.ReactNode
  /** Where focus returns on close when the trigger has unmounted (menus). */
  returnFocus?: HTMLElement | null
  className?: string
}

/**
 * The single confirmation dialog: Radix AlertDialog (focus trap, no outside
 * dismissal), DreamJira layout, and an optional typed-name gate for
 * destructive actions that cannot be undone.
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  returnFocus,
  ...props
}: ConfirmDialogProps) => {
  const portalContainer = usePortalContainer()
  const theme = useActivePortalTheme(open)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const restoreFocus = React.useRef(returnFocus)
  React.useEffect(() => {
    if (open) restoreFocus.current = returnFocus
  }, [open, returnFocus])

  return (
    <Alert.Root open={open} onOpenChange={onOpenChange}>
      <Alert.Portal container={portalContainer}>
        <Alert.Overlay
          data-theme={theme}
          className={cn(dialogOverlayClass, 'z-50')}
        />
        <Alert.Content
          ref={contentRef}
          data-theme={theme}
          {...(props.description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-radius-xl border border-border-default bg-components-dialog-bg text-text-primary shadow-elevation-high outline-hidden',
            props.className,
          )}
          onOpenAutoFocus={(event) => {
            // Alert dialogs start on Cancel; a typed gate starts on its field.
            const field = props.confirmationText
              ? contentRef.current?.querySelector('input')
              : null
            if (field) {
              event.preventDefault()
              field.focus()
            }
          }}
          onEscapeKeyDown={(event) => {
            if (props.pending) event.preventDefault()
          }}
          onCloseAutoFocus={(event) => {
            if (restoreFocus.current?.isConnected) {
              event.preventDefault()
              restoreFocus.current.focus()
            }
          }}
        >
          {/* Mounted per opening, so a typed confirmation starts empty. */}
          <ConfirmDialogBody {...props} />
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  )
}

const ConfirmDialogBody = ({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = 'default',
  pending = false,
  confirmationText,
  icon,
}: Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'returnFocus'>) => {
  const { t } = useTranslation()
  const inputId = React.useId()
  const [typed, setTyped] = React.useState('')
  const needsTyping = Boolean(confirmationText)
  const matches = !needsTyping || typed === confirmationText
  const confirm = () => {
    if (!matches || pending) return
    onConfirm()
  }

  return (
    <>
      <div className="flex gap-space-base px-space-lg pt-space-lg">
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              'flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-radius-md [&_svg:not([class*=size-])]:size-icon-sm',
              variant === 'destructive'
                ? 'bg-status-error-subtle text-status-error'
                : 'bg-state-selected-bg text-state-selected-text',
            )}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <Alert.Title className="text-lg leading-7 font-semibold text-text-primary">
            {title}
          </Alert.Title>
          {description ? (
            <Alert.Description asChild>
              <div className="mt-space-xs text-sm text-text-secondary">
                {description}
              </div>
            </Alert.Description>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="px-space-lg pt-space-md text-sm">{children}</div>
      ) : null}
      {needsTyping ? (
        <form
          className="space-y-space-xs px-space-lg pt-space-md"
          onSubmit={(event) => {
            event.preventDefault()
            confirm()
          }}
        >
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {t('common.confirmDialog.typeToConfirm', {
              text: confirmationText,
            })}
          </label>
          <Input
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            disabled={pending}
            autoComplete="off"
            spellCheck={false}
            helpText={
              matches ? undefined : t('common.confirmDialog.typeToConfirmHint')
            }
          />
        </form>
      ) : null}
      <div className="mt-space-lg flex items-center justify-end gap-space-sm border-t border-border-default px-space-lg py-space-base">
        <Alert.Cancel asChild>
          <Button variant="outline" disabled={pending}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
        </Alert.Cancel>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          loading={pending}
          disabled={!matches}
          onClick={confirm}
        >
          {confirmLabel ?? t('common.confirm')}
        </Button>
      </div>
    </>
  )
}

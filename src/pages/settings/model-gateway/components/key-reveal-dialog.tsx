import { Check, Copy, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'

interface KeyRevealDialogProps {
  /**
   * The plaintext of a key that was just created, or `null` when closed. It
   * lives only in the owner's component state: the server never returns it
   * again, and it is not written to any cache or storage.
   */
  plaintext: string | null
  name: string
  onClose: () => void
}

/** Shows a new key once, with a copy button and a clear "last chance" note. */
export const KeyRevealDialog = ({
  plaintext,
  name,
  onClose,
}: KeyRevealDialogProps) => {
  const { t } = useTranslation()
  const { copiedStates, copyWithFeedback } = useCopyFeedback()
  const copied = Boolean(copiedStates.key)

  return (
    <Dialog
      open={plaintext !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
    >
      {/* Closing needs a deliberate click: an accidental overlay click would
          lose the only copy of the key. */}
      <DialogContent size="lg" closeOnOverlayClick={false}>
        <DialogHeader>
          <div className="flex items-center gap-space-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-radius-lg bg-surface-secondary">
              <KeyRound
                className="h-icon-md w-icon-md text-text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>
                {t('settings.modelGateway.keys.revealTitle', { name })}
              </DialogTitle>
              <DialogDescription>
                {t('settings.modelGateway.keys.revealDescription')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-space-base px-space-lg py-space-base">
          <div className="flex items-center gap-space-sm rounded-radius-lg border border-border-subtle bg-surface-secondary p-space-sm">
            <code
              className="min-w-0 flex-1 font-mono text-sm break-all text-text-primary"
              data-testid="gateway-key-plaintext"
            >
              {plaintext}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={
                copied ? (
                  <Check className="size-icon-sm" aria-hidden="true" />
                ) : (
                  <Copy className="size-icon-sm" aria-hidden="true" />
                )
              }
              onClick={() =>
                plaintext ? void copyWithFeedback(plaintext, 'key') : undefined
              }
            >
              {t(copied ? 'common.copied' : 'common.copy')}
            </Button>
          </div>
          <p className="text-sm text-text-secondary">
            {t('settings.modelGateway.keys.revealUsage')}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t('settings.modelGateway.keys.revealDone')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

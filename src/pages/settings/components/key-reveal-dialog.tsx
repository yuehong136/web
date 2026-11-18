import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'

export interface KeyRevealLabels {
  title: string
  description: string
  usage: string
  done: string
}

interface KeyRevealDialogProps {
  /**
   * The plaintext of a key that was just created, or `null` when closed. It
   * lives only in the owner's component state and is never written to a
   * cache or storage.
   */
  plaintext: string | null
  labels: KeyRevealLabels
  onClose: () => void
}

/** Shows a new secret once, with a copy button and a clear "last chance" note. */
export const KeyRevealDialog = ({
  plaintext,
  labels,
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
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-space-sm">
          <div className="flex items-center gap-space-sm rounded-radius-md border border-line-subtle bg-sunken p-space-sm">
            <code
              className="min-w-0 flex-1 font-mono text-sm break-all text-fg"
              data-testid="revealed-key"
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
          <p className="text-sm text-fg-muted">{labels.usage}</p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {labels.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

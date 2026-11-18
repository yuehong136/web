import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface DeleteMetadataConfirmProps {
  open: boolean
  title: string
  name: string
  warnText: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export const DeleteMetadataConfirm: React.FC<DeleteMetadataConfirmProps> = ({
  open,
  title,
  name,
  warnText,
  confirmLabel,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation()
  const action = confirmLabel ?? t('knowledge.metadata.modal.confirmDelete')

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      variant="destructive"
      icon={<AlertTriangle />}
      title={title}
      cancelLabel={t('knowledge.common.cancel')}
      confirmLabel={action}
      // Confirming also dismisses, as the caller expects onCancel to close.
      onConfirm={() => {
        onConfirm()
        onCancel()
      }}
    >
      <div className="space-y-space-sm">
        <div className="inline-flex max-w-full items-center rounded-radius-md border border-line bg-sunken px-space-sm py-space-xs">
          <span className="truncate font-medium text-fg">{name}</span>
        </div>
        <div
          role="note"
          className="flex items-start gap-space-sm rounded-radius-md border border-warning-line bg-warning-soft p-space-sm"
        >
          <AlertCircle className="mt-space-2xs size-icon-sm shrink-0 text-warning-fg" />
          <p className="text-xs leading-relaxed text-fg-muted">{warnText}</p>
        </div>
      </div>
    </ConfirmDialog>
  )
}

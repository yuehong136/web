import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-status-error/10 flex h-10 w-10 items-center justify-center rounded-full">
              <AlertTriangle className="text-status-error h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <div className="space-y-3 pl-[52px]">
            <div className="bg-surface-secondary inline-flex items-center rounded-md border border-border-default px-3 py-1.5">
              <span className="max-w-[260px] truncate text-sm font-medium text-text-primary">
                {name}
              </span>
            </div>
            <div className="bg-status-warning/5 border-status-warning/20 flex items-start gap-2 rounded-md border p-2.5">
              <AlertCircle className="text-status-warning mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs leading-relaxed text-text-secondary">
                {warnText}
              </p>
            </div>
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel>{t('knowledge.common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { useEffect, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUpdateDocumentMeta } from '@/hooks/use-metadata'
import { FileText, Loader2, Info } from 'lucide-react'
import type { MetadataFieldDefinition } from '@/types/api'
import {
  DocumentMetadataEditor,
  type DocumentMetadataRecord,
} from './components/document-metadata-editor'

interface DocumentMetadataModalProps {
  open: boolean
  onClose: () => void
  docId: string
  docName: string
  kbId?: string
  metaFields: DocumentMetadataRecord
  fieldDefinitions?: MetadataFieldDefinition[]
  onSuccess?: () => void
}

export const DocumentMetadataModal: FC<DocumentMetadataModalProps> = ({
  open,
  onClose,
  docId,
  docName,
  kbId,
  metaFields,
  fieldDefinitions = [],
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [localMeta, setLocalMeta] = useState<DocumentMetadataRecord>({})

  const updateMetaMutation = useUpdateDocumentMeta()

  useEffect(() => {
    if (open) {
      setLocalMeta(metaFields || {})
    }
  }, [open, metaFields])

  const handleSave = async () => {
    await updateMetaMutation.mutateAsync({
      docId,
      meta: localMeta,
      kbId,
    })
    onSuccess?.()
    onClose()
  }

  const isSaving = updateMetaMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-status-info/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <FileText className="h-5 w-5 text-status-info" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>
                {t('knowledge.metadata.editor.editMetadata')}
              </DialogTitle>
              <DialogDescription className="truncate">
                {docName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-200px)] space-y-4 overflow-y-auto px-6 py-4">
          <DocumentMetadataEditor
            value={localMeta}
            onChange={setLocalMeta}
            fieldDefinitions={fieldDefinitions}
            disabled={isSaving}
          />

          {fieldDefinitions.length > 0 && (
            <div className="bg-surface-secondary flex items-start gap-2 rounded-lg p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
              <p className="text-sm text-text-tertiary">
                {t('knowledge.metadata.modal.settingTip')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('knowledge.common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving
              ? t('knowledge.metadata.editor.saving')
              : t('knowledge.common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

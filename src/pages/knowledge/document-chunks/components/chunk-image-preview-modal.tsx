import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@/components/ui'

interface ChunkImagePreviewModalProps {
  previewImageUrl: string | null
  onClose: () => void
}

export const ChunkImagePreviewModal = ({
  previewImageUrl,
  onClose,
}: ChunkImagePreviewModalProps) => {
  const { t } = useTranslation()

  return (
    <Modal
      open={!!previewImageUrl}
      onClose={onClose}
      title={t('knowledge.chunks.modal.imagePreviewTitle')}
      size="xl"
    >
      <div className="flex flex-col items-center gap-4">
        {previewImageUrl && (
          <div
            className="relative flex w-full items-center justify-center"
            style={{ minHeight: '400px', maxHeight: '70vh' }}
          >
            <img
              src={previewImageUrl}
              alt={t('knowledge.chunks.modal.imagePreviewAlt')}
              className="max-h-[70vh] max-w-full rounded-lg bg-background-subtle object-contain shadow-lg"
            />
          </div>
        )}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (previewImageUrl) window.open(previewImageUrl, '_blank')
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            {t('knowledge.chunks.modal.openInNewTab')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('knowledge.chunks.modal.close')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

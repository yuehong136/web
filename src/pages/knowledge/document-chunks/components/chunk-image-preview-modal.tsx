import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PhotoView } from 'react-photo-view'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useDocumentImage } from '@/hooks/use-document-image'
import {
  DocumentImageFeedback,
  DocumentImagePreviewProvider,
} from '@/components/knowledge/document-image'
import { toast } from '@/lib/toast'

interface ChunkImagePreviewModalProps {
  previewImageId: string | null
  onClose: () => void
}

export const ChunkImagePreviewModal = ({
  previewImageId,
  onClose,
}: ChunkImagePreviewModalProps) => {
  const { t } = useTranslation()
  const image = useDocumentImage(
    previewImageId ? { kind: 'dataset', imageId: previewImageId } : null,
  )

  return (
    <Modal
      open={!!previewImageId}
      onClose={onClose}
      title={t('knowledge.chunks.modal.imagePreviewTitle')}
      size="xl"
    >
      <DocumentImagePreviewProvider resetKey={previewImageId ?? ''}>
        <div className="flex flex-col items-center gap-4">
          {previewImageId && (
            <div
              className="relative flex w-full items-center justify-center"
              style={{ minHeight: '400px', maxHeight: '70vh' }}
            >
              {image.objectUrl ? (
                <PhotoView src={image.objectUrl}>
                  <button
                    type="button"
                    aria-label={t('common.documentImage.preview')}
                  >
                    <img
                      src={image.objectUrl}
                      alt={t('knowledge.chunks.modal.imagePreviewAlt')}
                      className="max-h-[70vh] max-w-full rounded-lg bg-background-subtle object-contain shadow-lg"
                    />
                  </button>
                </PhotoView>
              ) : (
                <DocumentImageFeedback image={image} />
              )}
            </div>
          )}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              disabled={!image.objectUrl}
              onClick={() => {
                if (
                  !image.openInNewWindow(
                    t('knowledge.chunks.modal.imagePreviewTitle'),
                  )
                )
                  toast.error(t('common.documentImage.windowBlocked'))
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
      </DocumentImagePreviewProvider>
    </Modal>
  )
}

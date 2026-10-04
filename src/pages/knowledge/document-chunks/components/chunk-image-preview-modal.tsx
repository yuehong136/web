import { useRef } from 'react'
import { Eye, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  ModalContent,
  ModalRoot,
  ModalTitle,
} from '@/components/ui/modal-primitives'
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
  const returnFocus = useRef<HTMLElement | null>(null)
  const image = useDocumentImage(
    previewImageId ? { kind: 'dataset', imageId: previewImageId } : null,
  )

  return (
    <ModalRoot
      open={!!previewImageId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <ModalContent
        className="p-space-lg"
        aria-describedby={undefined}
        onOpenAutoFocus={() => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null
        }}
        onCloseAutoFocus={(event) => {
          if (returnFocus.current?.isConnected) {
            event.preventDefault()
            returnFocus.current.focus()
          }
        }}
      >
        <div className="mb-space-lg flex items-center justify-between gap-space-base">
          <ModalTitle className="text-lg font-semibold">
            {t('knowledge.chunks.modal.imagePreviewTitle')}
          </ModalTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="size-icon-sm" />
          </Button>
        </div>
        <DocumentImagePreviewProvider resetKey={previewImageId ?? ''}>
          <div className="flex flex-col items-center gap-4">
            {previewImageId && (
              <div
                className="relative flex w-full items-center justify-center"
                style={{ minHeight: '400px', maxHeight: '70vh' }}
              >
                {image.objectUrl ? (
                  <img
                    src={image.objectUrl}
                    alt={t('knowledge.chunks.modal.imagePreviewAlt')}
                    className="max-h-[70vh] max-w-full rounded-lg bg-background-subtle object-contain shadow-lg"
                  />
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
      </ModalContent>
    </ModalRoot>
  )
}

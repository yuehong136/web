import { Image as ImageIcon, ZoomIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ImageUploader } from '@/components/ui/image-uploader'
import { Tooltip } from '@/components/ui/tooltip'
import { DocumentImage } from '@/components/knowledge/document-image'
import type { ChunkData } from '../types'

interface ChunkEditImageSectionProps {
  selectedChunk: ChunkData
  editingImage: File[]
  onEditingImageChange: (files: File[]) => void
  onPreviewImage: (url: string) => void
}

export const ChunkEditImageSection = ({
  selectedChunk,
  editingImage,
  onEditingImageChange,
  onPreviewImage,
}: ChunkEditImageSectionProps) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-accent-fg" />
        <span className="block text-sm font-medium text-fg-muted">
          {t('knowledge.chunks.edit.image')}
        </span>
        <Tooltip content={t('knowledge.chunks.edit.imageTooltip')}>
          <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-line text-xs text-fg-subtle">
            ?
          </span>
        </Tooltip>
      </div>

      <div className="space-y-3">
        {selectedChunk.img_id && editingImage.length === 0 && (
          <button
            type="button"
            aria-label={t('knowledge.chunks.edit.viewLarge')}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-line-subtle bg-canvas"
            onClick={() => onPreviewImage(selectedChunk.img_id!)}
          >
            <div className="flex aspect-video items-center justify-center bg-sunken p-4">
              <DocumentImage
                source={{ kind: 'dataset', imageId: selectedChunk.img_id }}
                retryable={false}
                alt={t('knowledge.chunks.edit.currentImageAlt')}
                className="max-h-full max-w-full rounded object-contain shadow-xs"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-(--motion-panel) group-hover:bg-black/40 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full bg-raised/95 px-4 py-2 shadow-lg">
                <ZoomIn className="h-4 w-4 text-accent-fg" />
                <span className="text-sm font-medium text-accent-fg">
                  {t('knowledge.chunks.edit.zoom')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line-subtle bg-canvas px-3 py-2">
              <span className="text-xs font-medium text-fg-muted">
                {t('knowledge.chunks.edit.currentImage')}
              </span>
              <span className="text-xs text-fg-subtle">
                {t('knowledge.chunks.edit.viewLarge')}
              </span>
            </div>
          </button>
        )}

        <ImageUploader
          value={editingImage}
          onValueChange={onEditingImageChange}
          maxFileCount={1}
          hideDropzoneOnMaxFileCount={true}
          variant={selectedChunk.img_id ? 'compact' : 'default'}
          title={
            selectedChunk.img_id
              ? t('knowledge.chunks.edit.uploadReplaceTitle')
              : undefined
          }
          description={
            selectedChunk.img_id
              ? t('knowledge.chunks.edit.uploadReplaceDescription')
              : undefined
          }
          dropzoneHeight="h-36"
        />
      </div>
    </div>
  )
}

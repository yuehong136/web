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
        <ImageIcon className="h-4 w-4 text-text-accent" />
        <span className="block text-sm font-medium text-text-secondary">
          {t('knowledge.chunks.edit.image')}
        </span>
        <Tooltip content={t('knowledge.chunks.edit.imageTooltip')}>
          <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border-default text-xs text-text-tertiary">
            ?
          </span>
        </Tooltip>
      </div>

      <div className="space-y-3">
        {selectedChunk.img_id && editingImage.length === 0 && (
          <button
            type="button"
            aria-label={t('knowledge.chunks.edit.viewLarge')}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-border-subtle bg-background-default"
            onClick={() => onPreviewImage(selectedChunk.img_id!)}
          >
            <div className="flex aspect-video items-center justify-center bg-background-subtle p-4">
              <DocumentImage
                source={{ kind: 'dataset', imageId: selectedChunk.img_id }}
                retryable={false}
                alt={t('knowledge.chunks.edit.currentImageAlt')}
                className="max-h-full max-w-full rounded object-contain shadow-xs"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full bg-components-card-bg/95 px-4 py-2 shadow-lg">
                <ZoomIn className="h-4 w-4 text-text-accent" />
                <span className="text-sm font-medium text-text-accent">
                  {t('knowledge.chunks.edit.zoom')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle bg-background-default px-3 py-2">
              <span className="text-xs font-medium text-text-secondary">
                {t('knowledge.chunks.edit.currentImage')}
              </span>
              <span className="text-xs text-text-tertiary">
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

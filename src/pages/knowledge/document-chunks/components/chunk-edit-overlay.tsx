import { Key, MessageCircleQuestion, Save, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL, API_VERSION } from '@/constants'
import { Button, Tooltip } from '@/components/ui'
import type { ChunkData } from '../types'
import { ChunkEditContentField } from './chunk-edit-content-field'
import { ChunkEditImageSection } from './chunk-edit-image-section'
import { ChunkEditTagSection } from './chunk-edit-tag-section'

interface ChunkEditOverlayProps {
  selectedChunk: ChunkData
  editingChunkContent: string
  onEditingChunkContentChange: (content: string) => void
  editingImportantKwd: string[]
  onEditingImportantKwdChange: (keywords: string[]) => void
  editingQuestionKwd: string[]
  onEditingQuestionKwdChange: (questions: string[]) => void
  editingImage: File[]
  onEditingImageChange: (files: File[]) => void
  isMarkdownPreview: boolean
  onMarkdownPreviewChange: (preview: boolean) => void
  onCancel: () => void
  onSave: () => void
  onPreviewImage: (url: string) => void
}

export const ChunkEditOverlay = ({
  selectedChunk,
  editingChunkContent,
  onEditingChunkContentChange,
  editingImportantKwd,
  onEditingImportantKwdChange,
  editingQuestionKwd,
  onEditingQuestionKwdChange,
  editingImage,
  onEditingImageChange,
  isMarkdownPreview,
  onMarkdownPreviewChange,
  onCancel,
  onSave,
  onPreviewImage,
}: ChunkEditOverlayProps) => {
  const { t } = useTranslation()
  const selectedImageUrl = `${API_BASE_URL}/${API_VERSION}/document/image/${selectedChunk.img_id}`
  const displayChunkId =
    selectedChunk.chunk_id.length > 16
      ? `${selectedChunk.chunk_id.slice(0, 8)}...${selectedChunk.chunk_id.slice(-8)}`
      : selectedChunk.chunk_id

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background-surface">
      <div className="border-b border-border-default p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-text-primary">
              {t('knowledge.chunks.edit.title')}
            </h3>
            <Tooltip
              content={t('knowledge.chunks.edit.fullIdTooltip', {
                id: selectedChunk.chunk_id,
              })}
            >
              <span className="inline-flex cursor-help items-center rounded-full bg-components-badge-info-bg px-2.5 py-1 text-xs font-medium text-components-badge-info-text">
                {displayChunkId}
              </span>
            </Tooltip>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCancel}
            aria-label={t('knowledge.chunks.edit.close')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="space-y-5">
          <ChunkEditContentField
            editingChunkContent={editingChunkContent}
            onEditingChunkContentChange={onEditingChunkContentChange}
            isMarkdownPreview={isMarkdownPreview}
            onMarkdownPreviewChange={onMarkdownPreviewChange}
          />

          {selectedChunk.doc_type_kwd === 'image' && (
            <ChunkEditImageSection
              selectedChunk={selectedChunk}
              selectedImageUrl={selectedImageUrl}
              editingImage={editingImage}
              onEditingImageChange={onEditingImageChange}
              onPreviewImage={onPreviewImage}
            />
          )}

          <ChunkEditTagSection
            icon={<Key className="h-4 w-4 text-text-accent" />}
            label={t('knowledge.chunks.edit.keywordLabel')}
            tooltip={t('knowledge.chunks.edit.keywordTooltip')}
            value={editingImportantKwd}
            onChange={onEditingImportantKwdChange}
            placeholder={t('knowledge.chunks.edit.keywordPlaceholder')}
            variant="info"
          />

          <ChunkEditTagSection
            icon={
              <MessageCircleQuestion className="h-4 w-4 text-text-warning" />
            }
            label={t('knowledge.chunks.edit.questionLabel')}
            tooltip={t('knowledge.chunks.edit.questionTooltip')}
            value={editingQuestionKwd}
            onChange={onEditingQuestionKwdChange}
            placeholder={t('knowledge.chunks.edit.questionPlaceholder')}
            variant="warning"
          />
        </div>
      </div>

      <div className="border-t border-border-default bg-background-subtle p-6">
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel}>
            {t('knowledge.chunks.edit.cancel')}
          </Button>
          <Button onClick={onSave} disabled={!editingChunkContent.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {t('knowledge.chunks.edit.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

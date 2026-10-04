import { Key, MessageCircleQuestion, Save, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  isPending?: boolean
  canSubmit?: boolean
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
  isPending = false,
  canSubmit = true,
}: ChunkEditOverlayProps) => {
  const { t } = useTranslation()
  const displayChunkId =
    selectedChunk.chunk_id.length > 16
      ? `${selectedChunk.chunk_id.slice(0, 8)}...${selectedChunk.chunk_id.slice(-8)}`
      : selectedChunk.chunk_id
  const canSave = canSubmit && !!editingChunkContent.trim() && !isPending

  return (
    <div
      className="relative flex h-full min-h-0 flex-col bg-background-surface"
      aria-busy={isPending}
    >
      <div className="shrink-0 border-b border-border-default px-space-lg py-space-base">
        <div className="flex items-start justify-between gap-space-base">
          <div className="min-w-0 space-y-space-xs">
            <h2 className="text-base font-semibold text-text-primary">
              {t('knowledge.chunks.edit.title')}
            </h2>
            <Tooltip
              content={t('knowledge.chunks.edit.fullIdTooltip', {
                id: selectedChunk.chunk_id,
              })}
            >
              <span className="inline-block max-w-full cursor-help truncate font-mono text-xs text-text-tertiary">
                {displayChunkId}
              </span>
            </Tooltip>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCancel}
            disabled={isPending}
            aria-label={t('knowledge.chunks.edit.close')}
          >
            <X className="size-icon-sm" />
          </Button>
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 scrollbar-thumb-components-scrollbar-thumb scrollbar-track-transparent overflow-y-auto p-space-lg">
        <fieldset
          disabled={isPending}
          inert={isPending}
          className="min-w-0 space-y-space-lg border-0 p-0"
        >
          <ChunkEditContentField
            editingChunkContent={editingChunkContent}
            onEditingChunkContentChange={onEditingChunkContentChange}
            isMarkdownPreview={isMarkdownPreview}
            onMarkdownPreviewChange={onMarkdownPreviewChange}
          />

          {(selectedChunk.doc_type_kwd === 'image' || selectedChunk.img_id) && (
            <ChunkEditImageSection
              selectedChunk={selectedChunk}
              editingImage={editingImage}
              onEditingImageChange={onEditingImageChange}
              onPreviewImage={onPreviewImage}
            />
          )}

          <ChunkEditTagSection
            icon={<Key className="size-icon-sm text-text-secondary" />}
            label={t('knowledge.chunks.edit.keywordLabel')}
            tooltip={t('knowledge.chunks.edit.keywordTooltip')}
            value={editingImportantKwd}
            onChange={onEditingImportantKwdChange}
            placeholder={t('knowledge.chunks.edit.keywordPlaceholder')}
            variant="info"
          />

          <ChunkEditTagSection
            icon={
              <MessageCircleQuestion className="size-icon-sm text-text-secondary" />
            }
            label={t('knowledge.chunks.edit.questionLabel')}
            tooltip={t('knowledge.chunks.edit.questionTooltip')}
            value={editingQuestionKwd}
            onChange={onEditingQuestionKwdChange}
            placeholder={t('knowledge.chunks.edit.questionPlaceholder')}
            variant="warning"
          />
        </fieldset>
      </div>

      <div className="shrink-0 border-t border-border-default bg-background-surface px-space-lg py-space-base">
        <div className="flex justify-end gap-space-sm">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            {t('knowledge.chunks.edit.cancel')}
          </Button>
          <Button
            onClick={() => {
              if (canSave) onSave()
            }}
            disabled={!canSave}
            loading={isPending}
            leftIcon={<Save className="size-icon-sm" />}
          >
            {t('knowledge.chunks.edit.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import {
  Code,
  Eye,
  Image as ImageIcon,
  Key,
  MessageCircleQuestion,
  Save,
  X,
  ZoomIn,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL, API_VERSION } from '@/constants'
import { Button, ImageUploader, TagEditor, Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ChunkData } from '../types'

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
              <span
                className="inline-flex cursor-help items-center rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-components-badge-info-bg)',
                  color: 'var(--color-components-badge-info-text)',
                }}
              >
                {selectedChunk.chunk_id.length > 16
                  ? `${selectedChunk.chunk_id.slice(0, 8)}...${selectedChunk.chunk_id.slice(-8)}`
                  : selectedChunk.chunk_id}
              </span>
            </Tooltip>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text-secondary">
                {t('knowledge.chunks.edit.content')}
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkdownPreviewChange(!isMarkdownPreview)}
                className={cn(
                  'flex items-center space-x-1 text-xs',
                  isMarkdownPreview
                    ? 'border-border-accent bg-state-hover text-text-accent'
                    : '',
                )}
              >
                {isMarkdownPreview ? (
                  <>
                    <Code className="h-3 w-3" />
                    <span>{t('knowledge.chunks.edit.edit')}</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>{t('knowledge.chunks.edit.preview')}</span>
                  </>
                )}
              </Button>
            </div>

            <div className="min-h-[200px]">
              {isMarkdownPreview ? (
                <div className="rounded-radius-md h-full min-h-[200px] w-full overflow-y-auto border border-components-input-border bg-background-subtle px-4 py-3 scrollbar-thin">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
                    {editingChunkContent}
                  </pre>
                </div>
              ) : (
                <textarea
                  value={editingChunkContent}
                  onChange={(event) =>
                    onEditingChunkContentChange(event.target.value)
                  }
                  className="w-full resize-none rounded-md px-3 py-2 font-mono text-sm leading-relaxed"
                  style={{
                    border: '1px solid var(--color-components-input-border)',
                    backgroundColor: 'var(--color-components-input-bg)',
                    color: 'var(--color-components-input-text)',
                    minHeight: '200px',
                  }}
                  onFocus={(event) => {
                    event.target.style.borderColor =
                      'var(--color-components-input-border-focus)'
                    event.target.style.outline = 'none'
                  }}
                  onBlur={(event) => {
                    event.target.style.borderColor =
                      'var(--color-components-input-border)'
                  }}
                  placeholder={t('knowledge.chunks.edit.contentPlaceholder')}
                />
              )}
            </div>
          </div>

          {selectedChunk.doc_type_kwd === 'image' && (
            <ImageEditSection
              selectedChunk={selectedChunk}
              selectedImageUrl={selectedImageUrl}
              editingImage={editingImage}
              onEditingImageChange={onEditingImageChange}
              onPreviewImage={onPreviewImage}
            />
          )}

          <TagEditSection
            icon={
              <Key
                className="h-4 w-4"
                style={{ color: 'var(--color-text-accent)' }}
              />
            }
            label={t('knowledge.chunks.edit.keywordLabel')}
            tooltip={t('knowledge.chunks.edit.keywordTooltip')}
            value={editingImportantKwd}
            onChange={onEditingImportantKwdChange}
            placeholder={t('knowledge.chunks.edit.keywordPlaceholder')}
            variant="info"
          />

          <TagEditSection
            icon={
              <MessageCircleQuestion
                className="h-4 w-4"
                style={{ color: 'var(--color-text-warning)' }}
              />
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

      <div
        className="p-6"
        style={{
          borderTop: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-background-subtle)',
        }}
      >
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

interface ImageEditSectionProps {
  selectedChunk: ChunkData
  selectedImageUrl: string
  editingImage: File[]
  onEditingImageChange: (files: File[]) => void
  onPreviewImage: (url: string) => void
}

const ImageEditSection = ({
  selectedChunk,
  selectedImageUrl,
  editingImage,
  onEditingImageChange,
  onPreviewImage,
}: ImageEditSectionProps) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon
          className="h-4 w-4"
          style={{ color: 'var(--color-text-accent)' }}
        />
        <label className="block text-sm font-medium text-text-secondary">
          {t('knowledge.chunks.edit.image')}
        </label>
        <Tooltip content={t('knowledge.chunks.edit.imageTooltip')}>
          <span
            className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border text-xs"
            style={{
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            ?
          </span>
        </Tooltip>
      </div>

      <div className="space-y-3">
        {selectedChunk.img_id && editingImage.length === 0 && (
          <div
            className="group relative cursor-pointer overflow-hidden rounded-lg"
            onClick={() => onPreviewImage(selectedImageUrl)}
            style={{
              backgroundColor: 'var(--color-background-default)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div
              className="flex aspect-video items-center justify-center p-4"
              style={{ backgroundColor: 'var(--color-background-subtle)' }}
            >
              <img
                src={selectedImageUrl}
                alt={t('knowledge.chunks.edit.currentImageAlt')}
                className="max-h-full max-w-full rounded object-contain shadow-sm"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <ZoomIn
                  className="h-4 w-4"
                  style={{ color: 'var(--color-text-accent)' }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-accent)' }}
                >
                  {t('knowledge.chunks.edit.zoom')}
                </span>
              </div>
            </div>

            <div
              className="flex items-center justify-between px-3 py-2"
              style={{
                borderTop: '1px solid var(--color-border-subtle)',
                backgroundColor: 'var(--color-background-default)',
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('knowledge.chunks.edit.currentImage')}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {t('knowledge.chunks.edit.viewLarge')}
              </span>
            </div>
          </div>
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

interface TagEditSectionProps {
  icon: ReactNode
  label: string
  tooltip: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  variant: 'info' | 'warning'
}

const TagEditSection = ({
  icon,
  label,
  tooltip,
  value,
  onChange,
  placeholder,
  variant,
}: TagEditSectionProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      {icon}
      <label className="block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <Tooltip content={tooltip}>
        <span
          className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border text-xs"
          style={{
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          ?
        </span>
      </Tooltip>
    </div>
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: 'var(--color-background-subtle)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <TagEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        variant={variant}
      />
    </div>
  </div>
)

import type { ReactNode } from 'react'
import {
  Eye,
  Key,
  MessageCircleQuestion,
  Plus,
  Save,
  Tag,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ConfirmModal, Input, Modal, TagEditor } from '@/components/ui'
import type { MetadataEntry } from '../types'

interface ChunkModalsProps {
  addChunkModalOpen: boolean
  onAddChunkModalClose: () => void
  newChunkContent: string
  onNewChunkContentChange: (content: string) => void
  newImportantKwd: string[]
  onNewImportantKwdChange: (keywords: string[]) => void
  newQuestionKwd: string[]
  onNewQuestionKwdChange: (questions: string[]) => void
  onCreateChunk: () => void
  deleteConfirmOpen: boolean
  onDeleteConfirmClose: () => void
  onDeleteConfirm: () => void
  deletingChunkId: string
  deleteSelectedConfirmOpen: boolean
  onDeleteSelectedConfirmClose: () => void
  onDeleteSelectedConfirm: () => void
  selectedChunkCount: number
  metaModalOpen: boolean
  onMetaModalClose: () => void
  editingMeta: MetadataEntry[]
  onAddMetaField: () => void
  onRemoveMetaField: (id: string) => void
  onUpdateMetaKey: (id: string, key: string) => void
  onUpdateMetaValue: (id: string, value: unknown) => void
  onSaveMeta: () => void
  previewImageUrl: string | null
  onPreviewImageClose: () => void
}

export const ChunkModals = ({
  addChunkModalOpen,
  onAddChunkModalClose,
  newChunkContent,
  onNewChunkContentChange,
  newImportantKwd,
  onNewImportantKwdChange,
  newQuestionKwd,
  onNewQuestionKwdChange,
  onCreateChunk,
  deleteConfirmOpen,
  onDeleteConfirmClose,
  onDeleteConfirm,
  deletingChunkId,
  deleteSelectedConfirmOpen,
  onDeleteSelectedConfirmClose,
  onDeleteSelectedConfirm,
  selectedChunkCount,
  metaModalOpen,
  onMetaModalClose,
  editingMeta,
  onAddMetaField,
  onRemoveMetaField,
  onUpdateMetaKey,
  onUpdateMetaValue,
  onSaveMeta,
  previewImageUrl,
  onPreviewImageClose,
}: ChunkModalsProps) => {
  const { t } = useTranslation()

  return (
    <>
      <Modal
        open={addChunkModalOpen}
        onClose={onAddChunkModalClose}
        title={t('knowledge.chunks.modal.addTitle')}
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <FieldLabel>{t('knowledge.chunks.modal.content')}</FieldLabel>
            <textarea
              value={newChunkContent}
              onChange={(event) => onNewChunkContentChange(event.target.value)}
              placeholder={t('knowledge.chunks.modal.contentPlaceholder')}
              className="h-40 w-full resize-none rounded-md px-3 py-2 text-sm"
              style={{
                border: '1px solid var(--color-components-input-border)',
                backgroundColor: 'var(--color-components-input-bg)',
                color: 'var(--color-components-input-text)',
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
            />
          </div>

          <TagModalSection
            icon={
              <Key
                className="h-4 w-4"
                style={{ color: 'var(--color-text-accent)' }}
              />
            }
            label={t('knowledge.chunks.modal.keywords')}
            value={newImportantKwd}
            onChange={onNewImportantKwdChange}
            placeholder={t('knowledge.chunks.modal.keywordPlaceholder')}
            variant="info"
          />

          <TagModalSection
            icon={
              <MessageCircleQuestion
                className="h-4 w-4"
                style={{ color: 'var(--color-text-warning)' }}
              />
            }
            label={t('knowledge.chunks.modal.questions')}
            value={newQuestionKwd}
            onChange={onNewQuestionKwdChange}
            placeholder={t('knowledge.chunks.modal.questionPlaceholder')}
            variant="warning"
          />

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={onAddChunkModalClose}>
              {t('knowledge.chunks.modal.cancel')}
            </Button>
            <Button onClick={onCreateChunk} disabled={!newChunkContent.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('knowledge.chunks.modal.addChunk')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        onConfirm={onDeleteConfirm}
        title={t('knowledge.chunks.modal.deleteTitle')}
        description={t('knowledge.chunks.modal.deleteDescription', {
          id: deletingChunkId,
        })}
      />

      <ConfirmModal
        open={deleteSelectedConfirmOpen}
        onClose={onDeleteSelectedConfirmClose}
        onConfirm={onDeleteSelectedConfirm}
        title={t('knowledge.chunks.modal.bulkDeleteTitle')}
        description={t('knowledge.chunks.modal.bulkDeleteDescription', {
          count: selectedChunkCount,
        })}
      />

      <MetadataModal
        open={metaModalOpen}
        onClose={onMetaModalClose}
        editingMeta={editingMeta}
        onAddMetaField={onAddMetaField}
        onRemoveMetaField={onRemoveMetaField}
        onUpdateMetaKey={onUpdateMetaKey}
        onUpdateMetaValue={onUpdateMetaValue}
        onSaveMeta={onSaveMeta}
      />

      <ImagePreviewModal
        previewImageUrl={previewImageUrl}
        onClose={onPreviewImageClose}
      />
    </>
  )
}

interface MetadataModalProps {
  open: boolean
  onClose: () => void
  editingMeta: MetadataEntry[]
  onAddMetaField: () => void
  onRemoveMetaField: (id: string) => void
  onUpdateMetaKey: (id: string, key: string) => void
  onUpdateMetaValue: (id: string, value: unknown) => void
  onSaveMeta: () => void
}

const MetadataModal = ({
  open,
  onClose,
  editingMeta,
  onAddMetaField,
  onRemoveMetaField,
  onUpdateMetaKey,
  onUpdateMetaValue,
  onSaveMeta,
}: MetadataModalProps) => {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('knowledge.chunks.modal.metadataTitle')}
      size="lg"
    >
      <div className="space-y-6">
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('knowledge.chunks.modal.metadataDescription')}
        </div>

        <div className="max-h-96 space-y-4 overflow-y-auto scrollbar-thin">
          {editingMeta.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 rounded-lg p-4"
              style={{ backgroundColor: 'var(--color-background-subtle)' }}
            >
              <div className="grid flex-1 grid-cols-2 gap-3">
                <div>
                  <FieldLabel compact>
                    {t('knowledge.chunks.modal.fieldName')}
                  </FieldLabel>
                  <Input
                    value={item.key}
                    onChange={(event) =>
                      onUpdateMetaKey(item.id, event.target.value)
                    }
                    placeholder={t(
                      'knowledge.chunks.modal.fieldNamePlaceholder',
                    )}
                    className="text-sm"
                  />
                </div>
                <div>
                  <FieldLabel compact>
                    {t('knowledge.chunks.modal.fieldValue')}
                  </FieldLabel>
                  <Input
                    value={
                      typeof item.value === 'string'
                        ? item.value
                        : JSON.stringify(item.value)
                    }
                    onChange={(event) => {
                      onUpdateMetaValue(
                        item.id,
                        parseMetadataValue(event.target.value),
                      )
                    }}
                    placeholder={t(
                      'knowledge.chunks.modal.fieldValuePlaceholder',
                    )}
                    className="text-sm"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemoveMetaField(item.id)}
                style={{ color: 'var(--color-text-error)' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {editingMeta.length === 0 && (
            <div
              className="py-8 text-center"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Tag
                className="mx-auto mb-4 h-12 w-12"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <p>{t('knowledge.chunks.modal.noMetadataFields')}</p>
              <p className="text-sm">
                {t('knowledge.chunks.modal.addFirstFieldHint')}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <Button
            variant="outline"
            onClick={onAddMetaField}
            className="w-full"
            style={{
              color: 'var(--color-text-accent)',
              borderColor: 'var(--color-border-accent)',
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('knowledge.chunks.modal.addMetadataField')}
          </Button>
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            {t('knowledge.chunks.modal.cancel')}
          </Button>
          <Button onClick={onSaveMeta}>
            <Save className="mr-2 h-4 w-4" />
            {t('knowledge.chunks.modal.saveMetadata')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface ImagePreviewModalProps {
  previewImageUrl: string | null
  onClose: () => void
}

const ImagePreviewModal = ({
  previewImageUrl,
  onClose,
}: ImagePreviewModalProps) => {
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
              className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-lg"
              style={{ backgroundColor: 'var(--color-background-subtle)' }}
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

interface TagModalSectionProps {
  icon: ReactNode
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  variant: 'info' | 'warning'
}

const TagModalSection = ({
  icon,
  label,
  value,
  onChange,
  placeholder,
  variant,
}: TagModalSectionProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <FieldLabel>{label}</FieldLabel>
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {t('knowledge.chunks.modal.optional')}
        </span>
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
}

const FieldLabel = ({
  children,
  compact,
}: {
  children: ReactNode
  compact?: boolean
}) => (
  <label
    className={`${compact ? 'mb-1 text-xs' : 'mb-2 text-sm'} block font-medium`}
    style={{ color: 'var(--color-text-primary)' }}
  >
    {children}
  </label>
)

const parseMetadataValue = (value: string): unknown => {
  try {
    if (value.startsWith('{') || value.startsWith('[')) {
      return JSON.parse(value) as unknown
    }
  } catch {
    return value
  }
  return value
}

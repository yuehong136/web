import type { ReactNode } from 'react'
import { Plus, Save, Tag, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal } from '@/components/ui'
import type { MetadataEntry } from '../types'

interface ChunkMetadataModalProps {
  open: boolean
  onClose: () => void
  editingMeta: MetadataEntry[]
  onAddMetaField: () => void
  onRemoveMetaField: (id: string) => void
  onUpdateMetaKey: (id: string, key: string) => void
  onUpdateMetaValue: (id: string, value: unknown) => void
  onSaveMeta: () => void
}

export const ChunkMetadataModal = ({
  open,
  onClose,
  editingMeta,
  onAddMetaField,
  onRemoveMetaField,
  onUpdateMetaKey,
  onUpdateMetaValue,
  onSaveMeta,
}: ChunkMetadataModalProps) => {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('knowledge.chunks.modal.metadataTitle')}
      size="lg"
    >
      <div className="space-y-6">
        <div className="text-sm text-text-secondary">
          {t('knowledge.chunks.modal.metadataDescription')}
        </div>

        <div className="max-h-96 space-y-4 overflow-y-auto scrollbar-thin">
          {editingMeta.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 rounded-lg bg-background-subtle p-4"
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
                className="text-text-error"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {editingMeta.length === 0 && (
            <div className="py-8 text-center text-text-tertiary">
              <Tag className="mx-auto mb-4 h-12 w-12 text-text-muted" />
              <p>{t('knowledge.chunks.modal.noMetadataFields')}</p>
              <p className="text-sm">
                {t('knowledge.chunks.modal.addFirstFieldHint')}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border-default pt-4">
          <Button
            variant="outline"
            onClick={onAddMetaField}
            className="w-full text-text-accent"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('knowledge.chunks.modal.addMetadataField')}
          </Button>
        </div>

        <div className="flex justify-end space-x-3 border-t border-border-default pt-4">
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

const FieldLabel = ({
  children,
  compact,
}: {
  children: ReactNode
  compact?: boolean
}) => (
  <label
    className={`${compact ? 'mb-1 text-xs' : 'mb-2 text-sm'} block font-medium text-text-primary`}
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

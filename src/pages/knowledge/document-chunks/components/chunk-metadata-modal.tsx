import { useRef, type ReactNode } from 'react'
import { Plus, Save, Tag, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui'
import {
  ModalContent,
  ModalDescription,
  ModalRoot,
  ModalTitle,
} from '@/components/ui/modal-primitives'
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
  isPending?: boolean
  canSubmit?: boolean
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
  isPending = false,
  canSubmit = true,
}: ChunkMetadataModalProps) => {
  const { t } = useTranslation()
  const returnFocus = useRef<HTMLElement | null>(null)

  return (
    <ModalRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) onClose()
      }}
    >
      <ModalContent
        className="max-w-2xl p-space-lg"
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
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault()
        }}
      >
        <div className="mb-space-sm flex items-start justify-between gap-space-base">
          <ModalTitle className="text-lg font-semibold">
            {t('knowledge.chunks.modal.metadataTitle')}
          </ModalTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isPending}
            aria-label={t('common.close')}
          >
            <X className="size-icon-sm" />
          </Button>
        </div>
        <ModalDescription className="mb-space-lg text-sm text-text-secondary">
          {t('knowledge.chunks.modal.metadataDescription')}
        </ModalDescription>
        <fieldset
          disabled={isPending}
          className="space-y-6"
          aria-busy={isPending}
        >
          <div className="scrollbar-thin max-h-96 space-y-4 overflow-y-auto">
            {editingMeta.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 rounded-lg bg-background-subtle p-4"
              >
                <div className="grid flex-1 grid-cols-2 gap-3">
                  <div>
                    <FieldLabel compact id={`chunk-meta-${item.id}-key-label`}>
                      {t('knowledge.chunks.modal.fieldName')}
                    </FieldLabel>
                    <Input
                      id={`chunk-meta-${item.id}-key`}
                      aria-labelledby={`chunk-meta-${item.id}-key-label`}
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
                    <FieldLabel
                      compact
                      id={`chunk-meta-${item.id}-value-label`}
                    >
                      {t('knowledge.chunks.modal.fieldValue')}
                    </FieldLabel>
                    <Input
                      id={`chunk-meta-${item.id}-value`}
                      aria-labelledby={`chunk-meta-${item.id}-value-label`}
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
                  aria-label={t('knowledge.chunks.modal.removeMetadataField')}
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
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              {t('knowledge.chunks.modal.cancel')}
            </Button>
            <Button
              onClick={onSaveMeta}
              loading={isPending}
              disabled={!canSubmit}
            >
              <Save className="mr-2 h-4 w-4" />
              {t('knowledge.chunks.modal.saveMetadata')}
            </Button>
          </div>
        </fieldset>
      </ModalContent>
    </ModalRoot>
  )
}

const FieldLabel = ({
  children,
  compact,
  id,
}: {
  children: ReactNode
  compact?: boolean
  id: string
}) => (
  <span
    id={id}
    className={`${compact ? 'mb-1 text-xs' : 'mb-2 text-sm'} block font-medium text-text-primary`}
  >
    {children}
  </span>
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

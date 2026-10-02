'use client'

import {
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  type FC,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Trash2, Tag, AlertCircle, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { KnowledgeBase, Document } from '@/types/api'
import type { ReparseOptions } from '@/api/knowledge-document-ingest'

interface ReparseConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (options: {
    deleteChunks: boolean
    applyMetadataSettings: boolean
  }) => void
  options: ReparseOptions
  onOptionsChange: Dispatch<SetStateAction<ReparseOptions>>
  documents: Document[]
  knowledgeBase: KnowledgeBase | null
  isLoading?: boolean
}

export const ReparseConfirmModal: FC<ReparseConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  documents,
  options,
  onOptionsChange,
  knowledgeBase,
  isLoading = false,
}) => {
  const { t } = useTranslation()
  const titleId = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const { deleteChunks, applyMetadataSettings } = options

  const stats = useMemo(() => {
    let totalChunks = 0
    let docsWithChunks = 0
    let docsWithMetadata = 0

    documents.forEach((doc) => {
      const chunkNum = doc.chunk_num || 0
      if (chunkNum > 0) {
        totalChunks += chunkNum
        docsWithChunks++
      }
      if (doc.meta_fields && Object.keys(doc.meta_fields).length > 0) {
        docsWithMetadata++
      }
    })

    return { totalChunks, docsWithChunks, docsWithMetadata }
  }, [documents])

  const hasMetadataEnabled =
    knowledgeBase?.enable_metadata === true ||
    knowledgeBase?.parser_config?.enable_metadata === true
  const metadataFieldCount = knowledgeBase?.metadata_settings?.length ?? 0

  const hasExistingChunks = stats.totalChunks > 0

  const handleConfirm = () => {
    if (isLoading) return
    onConfirm({
      deleteChunks: hasExistingChunks ? deleteChunks : false,
      applyMetadataSettings: hasMetadataEnabled ? applyMetadataSettings : false,
    })
  }

  useLayoutEffect(() => {
    // Native disabled buttons lose focus; keep it in Radix's modal scope.
    if (open && isLoading) contentRef.current?.focus()
  }, [open, isLoading])

  if (!open) return null

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && !isLoading && onClose()}
    >
      <SheetContent
        ref={contentRef}
        showCloseButton={false}
        aria-busy={isLoading}
        aria-labelledby={titleId}
        aria-describedby={undefined}
        onOpenAutoFocus={() => {
          returnFocusRef.current = document.activeElement as HTMLElement | null
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (returnFocusRef.current?.isConnected)
            returnFocusRef.current.focus()
        }}
        onEscapeKeyDown={(event) => isLoading && event.preventDefault()}
        onInteractOutside={(event) => isLoading && event.preventDefault()}
        className="top-1/2 right-auto bottom-auto left-1/2 h-auto w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-xl border-0 bg-[var(--color-background-surface)] p-0 shadow-2xl sm:max-w-[480px]"
      >
        {/* Close button */}
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-md p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
              <Play className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <SheetTitle
              id={titleId}
              className="text-lg font-semibold text-[var(--color-text-primary)]"
            >
              {t('knowledge.documents.reparse.title')}
            </SheetTitle>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 pb-6">
          <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-secondary)] px-4 py-3">
            <FileText className="h-5 w-5 text-[var(--color-text-secondary)]" />
            <span className="text-sm text-[var(--color-text-primary)]">
              {t('knowledge.documents.reparse.selected', {
                count: documents.length,
              })}
            </span>
          </div>

          <div className="space-y-3">
            {hasExistingChunks && (
              <OptionCard
                checked={deleteChunks}
                onChange={(deleteChunks) =>
                  onOptionsChange((previous) => ({ ...previous, deleteChunks }))
                }
                disabled={isLoading}
                icon={<Trash2 className="h-4 w-4" />}
                iconColor="text-[var(--color-status-error)]"
                title={t('knowledge.documents.reparse.clearChunksTitle', {
                  count: stats.totalChunks,
                })}
                description={t(
                  'knowledge.documents.reparse.clearChunksDescription',
                  { count: stats.docsWithChunks },
                )}
              />
            )}

            {hasMetadataEnabled && (
              <OptionCard
                checked={applyMetadataSettings}
                onChange={(applyMetadataSettings) =>
                  onOptionsChange((previous) => ({
                    ...previous,
                    applyMetadataSettings,
                  }))
                }
                disabled={isLoading}
                icon={<Tag className="h-4 w-4" />}
                iconColor="text-[var(--color-primary)]"
                title={t('knowledge.documents.reparse.applyMetadataTitle')}
                description={
                  metadataFieldCount > 0
                    ? t(
                        'knowledge.documents.reparse.applyMetadataDescription',
                        { count: metadataFieldCount },
                      )
                    : undefined
                }
                warning={
                  metadataFieldCount === 0
                    ? t('knowledge.documents.reparse.metadataMissingWarning')
                    : stats.docsWithMetadata > 0 && applyMetadataSettings
                      ? t(
                          'knowledge.documents.reparse.metadataOverwriteWarning',
                          { count: stats.docsWithMetadata },
                        )
                      : undefined
                }
              />
            )}
          </div>

          {!hasExistingChunks && !hasMetadataEnabled && (
            <div className="rounded-lg bg-[var(--color-surface-secondary)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              {t('knowledge.documents.reparse.defaultTip')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('knowledge.common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            <Play className="mr-2 h-4 w-4" />
            {t('knowledge.documents.reparse.title')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface OptionCardProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  icon: ReactNode
  iconColor?: string
  title: string
  description?: string
  warning?: string
}

const OptionCard: FC<OptionCardProps> = ({
  checked,
  onChange,
  disabled = false,
  icon,
  iconColor = 'text-[var(--color-text-secondary)]',
  title,
  description,
  warning,
}) => {
  const checkboxId = useId()

  return (
    <div
      className={cn(
        'relative rounded-lg border transition-all duration-200',
        disabled
          ? 'border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/50 opacity-60'
          : checked
            ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
            : 'border-[var(--color-border-default)] bg-[var(--color-background-surface)] hover:border-[var(--color-border-accent)]',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Checkbox
          id={checkboxId}
          checked={checked}
          onCheckedChange={(c) => !disabled && onChange(c === true)}
          disabled={disabled}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn('shrink-0', iconColor)}>{icon}</span>
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium text-[var(--color-text-primary)]',
                disabled ? 'cursor-not-allowed' : 'cursor-default',
              )}
            >
              {title}
            </label>
          </div>
          {description && (
            <p className="text-xs leading-relaxed text-[var(--color-text-tertiary)]">
              {description}
            </p>
          )}
          {warning && (
            <p className="flex items-center gap-1.5 text-xs leading-relaxed text-[var(--color-status-warning)]">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{warning}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

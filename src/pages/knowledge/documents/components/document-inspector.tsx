import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit2, ListTree, Tags, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import type { InspectorPanelProps } from '@/components/patterns'
import type { Document } from '@/types/api'
import {
  DocumentParseButton,
  type DocumentRowHandlers,
} from '../document-action-cell'
import {
  DocumentEnableSwitch,
  DocumentStatusBadge,
} from '../document-status-cell'
import { useDocumentParserLabel } from '../parser-method-cell'
import {
  formatDocumentDate,
  formatDocumentDuration,
  formatDocumentFileSize,
} from '../utils/format'
import { DocumentParseLog } from './document-parse-log'

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="min-w-0 truncate text-text-tertiary">{label}</dt>
      <dd className="col-span-2 min-w-0 break-words text-text-primary">
        {children}
      </dd>
    </>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-t border-border-subtle pt-space-md">
      <div className="mb-space-sm flex items-center gap-space-sm">
        <h3 className="min-w-0 flex-1 text-sm font-semibold text-text-primary">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

interface DocumentDetailsProps {
  document: Document
  onToggleStatus: (doc: Document) => void
  handlers: DocumentRowHandlers
}

function DocumentDetails({
  document,
  onToggleStatus,
  handlers,
}: DocumentDetailsProps) {
  const { t } = useTranslation()
  const parserLabel = useDocumentParserLabel(document)
  const metadata = Object.entries(document.meta_fields ?? {})
  const uploader = document.nickname || document.created_by
  return (
    <div className="flex flex-col gap-space-md text-sm">
      <dl className="grid grid-cols-3 gap-x-space-md gap-y-space-sm">
        <Property label={t('knowledge.documents.processLog.status')}>
          <DocumentStatusBadge document={document} />
        </Property>
        <Property label={t('knowledge.documents.table.parser')}>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="min-h-0 p-0"
            onClick={() => handlers.onChangeChunkMethod(document)}
          >
            {parserLabel}
          </Button>
        </Property>
        <Property label={t('knowledge.documents.table.chunks')}>
          <span className="tabular-nums">
            {t('knowledge.documents.inspector.chunksAndTokens', {
              chunks: (document.chunk_num || 0).toLocaleString(),
              tokens: (document.token_num || 0).toLocaleString(),
            })}
          </span>
        </Property>
        <Property label={t('knowledge.documents.processLog.fileSize')}>
          <span className="tabular-nums">
            {formatDocumentFileSize(document.size || 0)}
            {document.suffix || document.type
              ? ` · ${(document.suffix || document.type).toUpperCase()}`
              : ''}
          </span>
        </Property>
        <Property label={t('knowledge.documents.processLog.uploadedBy')}>
          {uploader || t('knowledge.documents.unknown')}
        </Property>
        <Property label={t('knowledge.documents.processLog.uploadDate')}>
          {formatDocumentDate(document.create_date)}
        </Property>
        {document.process_begin_at ? (
          <Property label={t('knowledge.documents.processLog.processBeginAt')}>
            {formatDocumentDate(document.process_begin_at)}
          </Property>
        ) : null}
        {document.process_duration ? (
          <Property label={t('knowledge.documents.processLog.duration')}>
            {formatDocumentDuration(document.process_duration)}
          </Property>
        ) : null}
        <Property label={t('knowledge.documents.table.enabled')}>
          <DocumentEnableSwitch
            document={document}
            onToggle={() => onToggleStatus(document)}
          />
        </Property>
      </dl>

      <Section
        title={t('knowledge.documents.table.metadata')}
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlers.onEditMetadata(document)}
          >
            <Tags className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.documents.inspector.editMetadata')}
          </Button>
        }
      >
        {metadata.length ? (
          <dl className="grid grid-cols-3 gap-x-space-md gap-y-space-xs">
            {metadata.map(([key, value]) => (
              <Property key={key} label={key}>
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </Property>
            ))}
          </dl>
        ) : (
          <p className="text-text-tertiary">
            {t('knowledge.documents.metadataCell.notConfigured')}
          </p>
        )}
      </Section>

      <Section title={t('knowledge.documents.inspector.parseLog')}>
        <DocumentParseLog message={document.progress_msg} />
      </Section>
    </div>
  )
}

interface DocumentInspectorOptions {
  document: Document | null
  open: boolean
  onClose: () => void
  canDownload: boolean
  onToggleStatus: (doc: Document) => void
  handlers: DocumentRowHandlers
}

/**
 * Inspector props for the selected document: properties, metadata and the
 * parse log, with the chunk page one click away. Replaces the process-log
 * dialog so the table stays visible.
 */
export function useDocumentInspectorPanel({
  document,
  open,
  onClose,
  canDownload,
  onToggleStatus,
  handlers,
}: DocumentInspectorOptions): InspectorPanelProps {
  const { t } = useTranslation()
  return {
    open,
    onOpenChange: (next) => {
      if (!next) onClose()
    },
    scopeKey: 'knowledge-document',
    title: document?.name ?? t('knowledge.documents.inspector.title'),
    actions: document ? (
      <Tooltip content={t('knowledge.documents.actions.viewChunks')}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('knowledge.documents.actions.viewChunks')}
          onClick={() => handlers.onViewChunks(document)}
        >
          <ListTree className="size-icon-sm" aria-hidden="true" />
        </Button>
      </Tooltip>
    ) : null,
    content: document ? (
      <DocumentDetails
        document={document}
        onToggleStatus={onToggleStatus}
        handlers={handlers}
      />
    ) : null,
    footer: document ? (
      <div className="flex flex-wrap items-center gap-space-xs">
        <DocumentParseButton
          withLabel
          document={document}
          onStartParse={() => handlers.onStartParse(document)}
          onStopParse={() => handlers.onStopParse(document)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handlers.onRename(document)}
        >
          <Edit2 className="size-icon-sm" aria-hidden="true" />
          {t('knowledge.documents.inspector.rename')}
        </Button>
        {canDownload ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlers.onDownload(document)}
          >
            {t('knowledge.documents.inspector.download')}
          </Button>
        ) : null}
        <span className="flex-1" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-status-error"
          onClick={() => handlers.onDelete(document)}
        >
          <Trash2 className="size-icon-sm" aria-hidden="true" />
          {t('knowledge.documents.inspector.delete')}
        </Button>
      </div>
    ) : null,
  }
}

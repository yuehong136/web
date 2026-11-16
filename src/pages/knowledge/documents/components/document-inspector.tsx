import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Download, Edit2, Eye, ListTree, Tags, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import type { InspectorPanelProps } from '@/components/patterns'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import type { Document } from '@/types/api'
import { TaskStatus } from '../constants'
import {
  DocumentParseButton,
  documentPreviewHref,
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
import { DocumentChunkPreview } from './document-chunk-preview'
import { DocumentParseSteps } from './document-parse-steps'

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
    <section className="flex flex-col gap-space-sm">
      <div className="flex min-h-[var(--control-height-sm)] items-center gap-space-sm">
        <h3 className="min-w-0 flex-1 text-xs font-medium text-text-tertiary">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-space-2xs rounded-radius-lg bg-background-subtle p-space-sm">
      <dt className="truncate text-xs text-text-tertiary">{label}</dt>
      <dd className="truncate font-mono text-base font-semibold text-text-primary tabular-nums">
        {value}
      </dd>
    </div>
  )
}

interface DocumentDetailsProps {
  kbId?: string
  document: Document
  onToggleStatus: (doc: Document) => void
  handlers: DocumentRowHandlers
}

function DocumentDetails({
  kbId,
  document,
  onToggleStatus,
  handlers,
}: DocumentDetailsProps) {
  const { t } = useTranslation()
  const parserLabel = useDocumentParserLabel(document)
  const metadata = Object.entries(document.meta_fields ?? {})
  const uploader = document.nickname || document.created_by
  const running = document.run === TaskStatus.RUNNING
  return (
    <div className="flex flex-col gap-space-lg text-sm">
      <div className="flex items-center gap-space-sm">
        <FileKindTile name={document.suffix || document.name} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-space-2xs">
          <DocumentStatusBadge
            document={document}
            onRetry={() => handlers.onStartParse(document)}
          />
          <span className="truncate text-xs text-text-tertiary">
            {[
              formatDocumentFileSize(document.size || 0),
              (document.suffix || document.type || '').toUpperCase(),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        <DocumentEnableSwitch
          document={document}
          onToggle={() => onToggleStatus(document)}
        />
      </div>

      <dl className="grid grid-cols-3 gap-space-sm">
        <StatTile
          label={t('knowledge.documents.table.chunks')}
          value={(document.chunk_num || 0).toLocaleString()}
        />
        <StatTile
          label={t('knowledge.documents.inspector.tokens')}
          value={(document.token_num || 0).toLocaleString()}
        />
        <StatTile
          label={t('knowledge.documents.processLog.duration')}
          value={
            document.process_duration
              ? formatDocumentDuration(document.process_duration)
              : '—'
          }
        />
      </dl>

      <Section title={t('knowledge.documents.inspector.parseLog')}>
        <DocumentParseSteps message={document.progress_msg} running={running} />
      </Section>

      {(document.chunk_num || 0) > 0 ? (
        <Section
          title={t('knowledge.documents.inspector.chunkPreview')}
          action={
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link to={`/knowledge/${kbId}/documents/${document.id}/chunks`}>
                {t('knowledge.documents.inspector.allChunks', {
                  count: document.chunk_num,
                })}
              </Link>
            </Button>
          }
        >
          <DocumentChunkPreview kbId={kbId} document={document} />
        </Section>
      ) : null}

      <Section title={t('knowledge.documents.inspector.properties')}>
        <dl className="grid grid-cols-3 gap-x-space-md gap-y-space-sm">
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
          <Property label={t('knowledge.documents.processLog.uploadedBy')}>
            {uploader || t('knowledge.documents.unknown')}
          </Property>
          <Property label={t('knowledge.documents.processLog.uploadDate')}>
            {formatDocumentDate(document.create_date)}
          </Property>
          {document.process_begin_at ? (
            <Property
              label={t('knowledge.documents.processLog.processBeginAt')}
            >
              {formatDocumentDate(document.process_begin_at)}
            </Property>
          ) : null}
        </dl>
      </Section>

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
    </div>
  )
}

interface DocumentInspectorOptions {
  kbId?: string
  document: Document | null
  open: boolean
  onClose: () => void
  canDownload: boolean
  onToggleStatus: (doc: Document) => void
  handlers: DocumentRowHandlers
}

/**
 * Inspector props for the selected document: identity, figures, parse
 * steps, a chunk preview, properties and metadata, with the chunk page one
 * click away. The table stays visible beside it.
 */
export function useDocumentInspectorPanel({
  kbId,
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
    description: document
      ? t('knowledge.documents.inspector.uploadedOn', {
          date: formatDocumentDate(document.create_date),
        })
      : undefined,
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
        kbId={kbId}
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
        <Button asChild variant="outline" size="sm">
          <a
            href={documentPreviewHref(document)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Eye className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.documents.actions.previewSource')}
          </a>
        </Button>
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
            <Download className="size-icon-sm" aria-hidden="true" />
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

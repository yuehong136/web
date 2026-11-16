import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Tooltip } from '@/components/ui'
import type { DataTableColumn } from '@/components/patterns'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import type { Document } from '@/types/api'
import {
  DocumentStatusBadge,
  DocumentEnableSwitch,
} from './document-status-cell'
import { ParserMethodCell } from './parser-method-cell'
import {
  formatDocumentDate,
  formatDocumentFileSize,
  formatDocumentRelativeTime,
} from './utils/format'

interface UseDocumentTableColumnsProps {
  /** Path of a document's chunk page; the name links there. */
  chunksHref: (doc: Document) => string
  onToggleStatus: (doc: Document) => void
  onShowChunkMethodModal: (doc: Document) => void
  /** Retry from a failed status (may ask to confirm a re-parse). */
  onRetryParse: (doc: Document) => void
}

/** The file name as a link to its chunks, under its type tile. */
function DocumentNameCell({
  record,
  href,
}: {
  record: Document
  href: string
}) {
  const { t } = useTranslation()
  const chunks = record.chunk_num || 0
  return (
    <div className="flex min-w-0 items-center gap-space-sm">
      <FileKindTile name={record.suffix || record.name} />
      <div className="flex min-w-0 flex-col">
        <Tooltip
          content={t('knowledge.documents.viewChunksCount', { count: chunks })}
        >
          <Link
            to={href}
            className="min-w-0 truncate rounded-radius-sm font-medium text-text-primary underline-offset-2 outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
          >
            {record.name}
          </Link>
        </Tooltip>
        {record.size ? (
          <span className="truncate text-xs text-text-tertiary">
            {formatDocumentFileSize(record.size)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The default document columns, in the board's order: name, chunks, chunk
 * method, status, upload time and the retrieval switch. Uploader, metadata
 * and the parse log live in the document Inspector.
 */
export function useDocumentTableColumns({
  chunksHref,
  onToggleStatus,
  onShowChunkMethodModal,
  onRetryParse,
}: UseDocumentTableColumnsProps): DataTableColumn<Document>[] {
  const { t } = useTranslation()

  return useMemo<DataTableColumn<Document>[]>(
    () => [
      {
        key: 'name',
        header: t('knowledge.documents.table.fileName'),
        className: 'w-full max-w-0 text-text-primary',
        cell: (record) => (
          <DocumentNameCell record={record} href={chunksHref(record)} />
        ),
      },
      {
        key: 'chunk_num',
        header: t('knowledge.documents.table.chunks'),
        width: '5rem',
        align: 'end',
        hideBelow: 'sm',
        cell: (record) => (
          <span className="font-mono text-xs">
            {record.chunk_num ? record.chunk_num.toLocaleString() : '—'}
          </span>
        ),
      },
      {
        key: 'parser_id',
        header: t('knowledge.documents.table.parser'),
        width: '8rem',
        hideBelow: 'lg',
        cell: (record) => (
          <ParserMethodCell
            document={record}
            onShowChunkMethodModal={onShowChunkMethodModal}
          />
        ),
      },
      {
        key: 'run',
        header: t('knowledge.documents.table.taskStatus'),
        width: '10rem',
        cell: (record) => (
          <DocumentStatusBadge
            document={record}
            onRetry={() => onRetryParse(record)}
          />
        ),
      },
      {
        key: 'create_date',
        header: t('knowledge.documents.table.createdAt'),
        width: '7rem',
        hideBelow: 'md',
        cell: (record) => (
          <time
            dateTime={record.create_date}
            title={formatDocumentDate(record.create_date)}
            className="text-xs whitespace-nowrap"
          >
            {formatDocumentRelativeTime(record.create_date)}
          </time>
        ),
      },
      {
        key: 'status',
        header: t('knowledge.documents.table.enabled'),
        width: '5rem',
        hideBelow: 'md',
        cell: (record) => (
          <DocumentEnableSwitch
            document={record}
            onToggle={() => onToggleStatus(record)}
          />
        ),
      },
    ],
    [chunksHref, onRetryParse, onShowChunkMethodModal, onToggleStatus, t],
  )
}

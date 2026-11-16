import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileIcon } from '@/components/ui'
import type { DataTableColumn } from '@/components/patterns'
import type { Document } from '@/types/api'
import {
  DocumentStatusBadge,
  DocumentEnableSwitch,
} from './document-status-cell'
import { ParserMethodCell } from './parser-method-cell'
import { formatDocumentDate, formatDocumentRelativeTime } from './utils/format'

interface UseDocumentTableColumnsProps {
  onOpenDetails: (doc: Document) => void
  onToggleStatus: (doc: Document) => void
  onShowChunkMethodModal: (doc: Document) => void
}

/**
 * The six default document columns: name, chunks, chunk method, status,
 * retrieval switch and upload time. Size, type, uploader and metadata live
 * in the document Inspector instead of widening the table.
 */
export function useDocumentTableColumns({
  onOpenDetails,
  onToggleStatus,
  onShowChunkMethodModal,
}: UseDocumentTableColumnsProps): DataTableColumn<Document>[] {
  const { t } = useTranslation()

  return useMemo<DataTableColumn<Document>[]>(
    () => [
      {
        key: 'name',
        header: t('knowledge.documents.table.fileName'),
        className: 'w-full max-w-0 text-text-primary',
        cell: (record) => (
          <div className="flex min-w-0 items-center gap-space-sm">
            <FileIcon
              fileName={record.name}
              fileType={record.suffix || record.type}
              size="sm"
            />
            <button
              type="button"
              className="min-w-0 truncate rounded-radius-sm text-left font-medium outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
              title={record.name}
              onClick={() => onOpenDetails(record)}
            >
              {record.name}
            </button>
          </div>
        ),
      },
      {
        key: 'chunk_num',
        header: t('knowledge.documents.table.chunks'),
        width: '5rem',
        align: 'end',
        hideBelow: 'sm',
        cell: (record) => (record.chunk_num || 0).toLocaleString(),
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
        width: '9rem',
        cell: (record) => <DocumentStatusBadge document={record} />,
      },
      {
        key: 'status',
        header: t('knowledge.documents.table.enabled'),
        width: '5.5rem',
        hideBelow: 'md',
        cell: (record) => (
          <DocumentEnableSwitch
            document={record}
            onToggle={() => onToggleStatus(record)}
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
            className="whitespace-nowrap"
          >
            {formatDocumentRelativeTime(record.create_date)}
          </time>
        ),
      },
    ],
    [onOpenDetails, onShowChunkMethodModal, onToggleStatus, t],
  )
}

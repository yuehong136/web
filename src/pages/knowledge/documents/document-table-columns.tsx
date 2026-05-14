/**
 * 文档表格列定义
 */

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { FileIcon, Tooltip, type Column } from '@/components/ui'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import type { Document } from '@/types/api'
import {
  DocumentStatusCell,
  DocumentMetadataCell,
  DocumentEnableSwitch,
} from './document-status-cell'
import { DocumentActionCell } from './document-action-cell'
import { ParserMethodCell } from './parser-method-cell'
import { formatFileSize, formatDate, formatRelativeTime } from './hooks'

const AVATAR_GRADIENTS = [
  'blue',
  'green',
  'orange',
  'purple',
  'indigo',
  'rose',
  'teal',
  'amber',
] as const

const AVATAR_STYLES: React.CSSProperties[] = AVATAR_GRADIENTS.map((name) => ({
  background: `linear-gradient(135deg, var(--color-components-avatar-gradient-${name}-from), var(--color-components-avatar-gradient-${name}-to))`,
}))

function getAvatarStyle(name: string): React.CSSProperties {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_STYLES[Math.abs(hash) % AVATAR_STYLES.length]
}

function getInitial(name: string): string {
  if (!name) return '?'
  const trimmed = name.trim()
  if (/^[\u4e00-\u9fff]/.test(trimmed)) return trimmed.slice(0, 1)
  return trimmed.charAt(0).toUpperCase()
}

interface UseDocumentTableColumnsProps {
  kbId: string
  selectedDocs: Set<string>
  hasMetadataEnabled: boolean
  canDownload: boolean
  onSelectDoc: (docId: string, checked: boolean) => void
  onToggleStatus: (doc: Document) => void
  onStartParse: (doc: Document) => void
  onStopParse: (doc: Document) => void
  onRename: (doc: Document) => void
  onDownload: (doc: Document) => void
  onDelete: (doc: Document) => void
  onShowLog?: (doc: Document) => void
  onShowChunkMethodModal?: (doc: Document) => void
}

export function useDocumentTableColumns({
  kbId,
  selectedDocs,
  hasMetadataEnabled,
  canDownload,
  onSelectDoc,
  onToggleStatus,
  onStartParse,
  onStopParse,
  onRename,
  onDownload,
  onDelete,
  onShowLog,
  onShowChunkMethodModal,
}: UseDocumentTableColumnsProps): Column<Document>[] {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMemo(
    () => [
      {
        key: 'select',
        title: t('knowledge.documents.table.select'),
        width: 48,
        fixed: 'left',
        render: (_, record) => (
          <Checkbox
            checked={selectedDocs.has(record.id)}
            onCheckedChange={(checked) =>
              onSelectDoc(record.id, checked as boolean)
            }
          />
        ),
      },
      {
        key: 'icon',
        title: '',
        width: 48,
        render: (_, record) => (
          <Tooltip
            content={
              t('knowledge.documents.table.fileType') +
              `: ${record.type || t('knowledge.documents.unknown')}`
            }
          >
            <div className="flex items-center justify-center">
              <FileIcon
                fileName={record.name}
                fileType={record.suffix || record.type}
                size="md"
              />
            </div>
          </Tooltip>
        ),
      },
      {
        key: 'name',
        title: t('knowledge.documents.table.fileName'),
        dataIndex: 'name',
        sortable: true,
        width: 280,
        render: (value, record) => (
          <Tooltip
            content={
              <div className="max-w-md">
                <div
                  className="mb-2 font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {value}
                </div>
                <div
                  className="space-y-1 text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <div>
                    {t('knowledge.documents.table.size')}:{' '}
                    {formatFileSize(record.size || 0)}
                  </div>
                  <div>
                    {t('knowledge.documents.table.type')}:{' '}
                    {record.type || t('knowledge.documents.unknown')}
                  </div>
                  <div>
                    {t('knowledge.documents.table.chunks')}:{' '}
                    {record.chunk_num || 0}
                  </div>
                </div>
              </div>
            }
            delayHide={500}
            maxWidth="max-w-md"
          >
            <div
              className="cursor-pointer truncate font-medium text-text-primary transition-colors hover:text-text-accent"
              onClick={() =>
                navigate(`/knowledge/${kbId}/documents/${record.id}/chunks`)
              }
            >
              {value}
            </div>
          </Tooltip>
        ),
      },
      {
        key: 'size',
        title: t('knowledge.documents.table.size'),
        dataIndex: 'size',
        sortable: true,
        width: 100,
        render: (value) => (
          <Tooltip
            content={t('knowledge.documents.table.fileSizeBytes', {
              bytes: value || 0,
            })}
          >
            <span
              className="cursor-help text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {formatFileSize(value || 0)}
            </span>
          </Tooltip>
        ),
      },
      {
        key: 'chunk_num',
        title: t('knowledge.documents.table.chunks'),
        dataIndex: 'chunk_num',
        width: 80,
        render: (value, record) => (
          <Tooltip
            content={t('knowledge.documents.table.chunksTooltip', {
              chunks: value || 0,
              tokens: record.token_num || 0,
            })}
          >
            <span
              className="cursor-help text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {value || 0}
            </span>
          </Tooltip>
        ),
      },
      {
        key: 'parser_id',
        title: t('knowledge.documents.table.parser'),
        dataIndex: 'parser_id',
        width: 120,
        render: (_, record) =>
          onShowChunkMethodModal ? (
            <ParserMethodCell
              document={record}
              onShowChunkMethodModal={onShowChunkMethodModal}
            />
          ) : (
            <span
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {record.parser_id || t('knowledge.documents.defaultParser')}
            </span>
          ),
      },
      {
        key: 'metadata',
        title: t('knowledge.documents.table.metadata'),
        width: 80,
        render: (_, record) => (
          <DocumentMetadataCell
            document={record}
            hasMetadataEnabled={hasMetadataEnabled}
            onClickReparse={() => onStartParse(record)}
          />
        ),
      },
      {
        key: 'status',
        title: t('knowledge.documents.table.enabled'),
        width: 80,
        render: (_, record) => (
          <DocumentEnableSwitch
            document={record}
            onToggle={() => onToggleStatus(record)}
          />
        ),
      },
      {
        key: 'run',
        title: t('knowledge.documents.table.taskStatus'),
        width: 150,
        render: (_, record) => (
          <DocumentStatusCell document={record} onShowLog={onShowLog} />
        ),
      },
      {
        key: 'created_by',
        title: t('knowledge.documents.table.uploader'),
        width: 130,
        render: (_, record) => {
          const displayName =
            record.nickname ||
            record.created_by ||
            t('knowledge.documents.unknown')
          const avatarStyle = getAvatarStyle(displayName)
          return (
            <Tooltip content={displayName}>
              <div className="gap-space-xs flex min-w-0 items-center">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback
                    className="text-[11px] font-medium text-white"
                    style={avatarStyle}
                  >
                    {displayName === t('knowledge.documents.unknown') ? (
                      <User className="h-3 w-3" />
                    ) : (
                      getInitial(displayName)
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm text-text-secondary">
                  {displayName}
                </span>
              </div>
            </Tooltip>
          )
        },
      },
      {
        key: 'create_date',
        title: t('knowledge.documents.table.createdAt'),
        dataIndex: 'create_date',
        sortable: true,
        width: 130,
        render: (value, record) => (
          <Tooltip
            content={
              <div className="space-y-1 text-xs">
                <div>
                  {t('knowledge.documents.table.created', {
                    value: formatDate(value),
                  })}
                </div>
                <div>
                  {t('knowledge.documents.table.updated', {
                    value: formatDate(record.update_date),
                  })}
                </div>
              </div>
            }
          >
            <span className="cursor-help text-sm text-text-secondary">
              {formatRelativeTime(value)}
            </span>
          </Tooltip>
        ),
      },
      {
        key: 'actions',
        title: t('knowledge.documents.table.actions'),
        width: 160,
        fixed: 'right',
        align: 'right',
        render: (_, record) => (
          <DocumentActionCell
            document={record}
            canDownload={canDownload}
            onStartParse={() => onStartParse(record)}
            onStopParse={() => onStopParse(record)}
            onRename={() => onRename(record)}
            onDownload={() => onDownload(record)}
            onDelete={() => onDelete(record)}
          />
        ),
      },
    ],
    [
      kbId,
      selectedDocs,
      hasMetadataEnabled,
      canDownload,
      onSelectDoc,
      onToggleStatus,
      onStartParse,
      onStopParse,
      onRename,
      onDownload,
      onDelete,
      onShowLog,
      onShowChunkMethodModal,
      navigate,
      t,
    ],
  )
}

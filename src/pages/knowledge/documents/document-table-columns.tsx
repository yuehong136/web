/**
 * 文档表格列定义
 */

import React, { useMemo } from 'react'
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
  'blue', 'green', 'orange', 'purple', 'indigo', 'rose', 'teal', 'amber',
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

  return useMemo(
    () => [
      {
        key: 'select',
        title: '选择',
        width: 48,
        fixed: 'left',
        render: (_, record) => (
          <Checkbox
            checked={selectedDocs.has(record.id)}
            onCheckedChange={(checked) => onSelectDoc(record.id, checked as boolean)}
          />
        ),
      },
      {
        key: 'icon',
        title: '',
        width: 48,
        render: (_, record) => (
          <Tooltip content={`文件类型: ${record.type || '未知'}`}>
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
        title: '文件名',
        dataIndex: 'name',
        sortable: true,
        width: 280,
        render: (value, record) => (
          <Tooltip
            content={
              <div className="max-w-md">
                <div
                  className="font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {value}
                </div>
                <div
                  className="text-xs space-y-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <div>大小: {formatFileSize(record.size || 0)}</div>
                  <div>类型: {record.type || '未知'}</div>
                  <div>分块: {record.chunk_num || 0}</div>
                </div>
              </div>
            }
            delayHide={500}
            maxWidth="max-w-md"
          >
            <div
              className="font-medium truncate cursor-pointer text-text-primary hover:text-text-accent transition-colors"
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
        title: '大小',
        dataIndex: 'size',
        sortable: true,
        width: 100,
        render: (value) => (
          <Tooltip content={`文件大小: ${value || 0} 字节`}>
            <span
              className="text-sm cursor-help"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {formatFileSize(value || 0)}
            </span>
          </Tooltip>
        ),
      },
      {
        key: 'chunk_num',
        title: '分块数',
        dataIndex: 'chunk_num',
        width: 80,
        render: (value, record) => (
          <Tooltip
            content={`文档已分为 ${value || 0} 个文本块，Token数: ${record.token_num || 0}`}
          >
            <span
              className="text-sm cursor-help"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {value || 0}
            </span>
          </Tooltip>
        ),
      },
      {
        key: 'parser_id',
        title: '解析方式',
        dataIndex: 'parser_id',
        width: 120,
        render: (_, record) => (
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
              {record.parser_id || '默认'}
            </span>
          )
        ),
      },
      {
        key: 'metadata',
        title: '元数据',
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
        title: '启用',
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
        title: '任务状态',
        width: 150,
        render: (_, record) => (
          <DocumentStatusCell document={record} onShowLog={onShowLog} />
        ),
      },
      {
        key: 'created_by',
        title: '上传者',
        width: 130,
        render: (_, record) => {
          const displayName = record.nickname || record.created_by || '未知'
          const avatarStyle = getAvatarStyle(displayName)
          return (
            <Tooltip content={displayName}>
              <div className="flex items-center gap-space-xs min-w-0">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback
                    className="text-[11px] font-medium text-white"
                    style={avatarStyle}
                  >
                    {displayName === '未知'
                      ? <User className="h-3 w-3" />
                      : getInitial(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate text-text-secondary">
                  {displayName}
                </span>
              </div>
            </Tooltip>
          )
        },
      },
      {
        key: 'create_date',
        title: '创建时间',
        dataIndex: 'create_date',
        sortable: true,
        width: 130,
        render: (value, record) => (
          <Tooltip
            content={
              <div className="text-xs space-y-1">
                <div>创建: {formatDate(value)}</div>
                <div>更新: {formatDate(record.update_date)}</div>
              </div>
            }
          >
            <span className="text-sm cursor-help text-text-secondary">
              {formatRelativeTime(value)}
            </span>
          </Tooltip>
        ),
      },
      {
        key: 'actions',
        title: '操作',
        width: 160,
        fixed: 'right',
        align: 'right',
        render: (_, record) => (
          <DocumentActionCell
            document={record}
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
    ]
  )
}

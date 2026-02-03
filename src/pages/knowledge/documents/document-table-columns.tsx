/**
 * 文档表格列定义
 */

import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileIcon, Tooltip, type Column } from '@/components/ui'
import type { Document } from '@/types/api'
import {
  DocumentStatusCell,
  DocumentMetadataCell,
  DocumentEnableSwitch,
} from './document-status-cell'
import { DocumentActionCell } from './document-action-cell'
import { ParserMethodCell } from './parser-method-cell'
import { formatFileSize, formatDate } from './hooks'

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
          <input
            type="checkbox"
            checked={selectedDocs.has(record.id)}
            onChange={(e) => onSelectDoc(record.id, e.target.checked)}
            className="w-4 h-4 rounded focus:outline-none"
            style={{
              backgroundColor: selectedDocs.has(record.id)
                ? 'var(--color-components-checkbox-bg-checked)'
                : 'var(--color-components-checkbox-bg)',
              borderColor: selectedDocs.has(record.id)
                ? 'var(--color-components-checkbox-border-checked)'
                : 'var(--color-components-checkbox-border)',
              borderWidth: '1px',
              color: selectedDocs.has(record.id)
                ? 'var(--color-components-checkbox-icon)'
                : 'transparent',
            }}
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
                  <div>创建: {formatDate(record.create_date)}</div>
                </div>
              </div>
            }
            delayHide={500}
            maxWidth="max-w-md"
          >
            <div
              className="font-medium truncate cursor-pointer transition-colors"
              style={{
                color: 'var(--color-text-primary)',
              }}
              onClick={() =>
                navigate(`/knowledge/${kbId}/documents/${record.id}/chunks`)
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
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
        key: 'create_date',
        title: '创建时间',
        dataIndex: 'create_date',
        sortable: true,
        width: 160,
        render: (value, record) => (
          <Tooltip
            content={
              <div className="max-w-md">
                <div
                  className="font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  创建时间
                </div>
                <div
                  className="text-xs space-y-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <div>创建: {formatDate(value)}</div>
                  <div>更新: {formatDate(record.update_date)}</div>
                  <div>创建者: {record.created_by || '未知'}</div>
                </div>
              </div>
            }
            delayHide={500}
            maxWidth="max-w-md"
          >
            <span
              className="text-sm cursor-help"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {formatDate(value)}
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

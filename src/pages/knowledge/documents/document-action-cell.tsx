/**
 * 文档操作按钮单元格组件
 */

import React from 'react'
import { Play, Square, Edit2, Download, Trash2 } from 'lucide-react'
import { Button, Tooltip } from '@/components/ui'
import type { Document } from '@/types/api'
import { TaskStatus } from './constants'

interface DocumentActionCellProps {
  document: Document
  onStartParse: () => void
  onStopParse: () => void
  onRename: () => void
  onDownload: () => void
  onDelete: () => void
}

export const DocumentActionCell: React.FC<DocumentActionCellProps> = ({
  document,
  onStartParse,
  onStopParse,
  onRename,
  onDownload,
  onDelete,
}) => {
  const isRunning = document.run === TaskStatus.RUNNING

  return (
    <div className="flex items-center justify-end space-x-2">
      <Tooltip content={isRunning ? '停止当前任务' : '开始解析'}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={isRunning ? onStopParse : onStartParse}
        >
          {isRunning ? (
            <Square className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </Tooltip>
      <Tooltip content="重命名文档">
        <Button variant="ghost" size="icon-sm" onClick={onRename}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="下载文档到本地">
        <Button variant="ghost" size="icon-sm" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="删除文档（不可恢复）">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          style={{ color: 'var(--color-text-error)' }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  )
}

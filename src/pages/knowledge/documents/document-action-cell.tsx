/**
 * 文档操作按钮单元格组件
 */

import React, { useCallback } from 'react'
import { Play, Square, Edit2, Download, Trash2 } from 'lucide-react'
import { Button, Tooltip } from '@/components/ui'
import { toast } from '@/lib/toast'
import type { Document } from '@/types/api'
import { TaskStatus } from './constants'

interface DocumentActionCellProps {
  document: Document
  canDownload: boolean
  onStartParse: () => void
  onStopParse: () => void
  onRename: () => void
  onDownload: () => void
  onDelete: () => void
}

export const DocumentActionCell: React.FC<DocumentActionCellProps> = ({
  document,
  canDownload,
  onStartParse,
  onStopParse,
  onRename,
  onDownload,
  onDelete,
}) => {
  const isRunning = document.run === TaskStatus.RUNNING

  const handleDownloadClick = useCallback(() => {
    if (!canDownload) {
      toast.warning('请联系管理员获取下载权限')
      return
    }
    onDownload()
  }, [canDownload, onDownload])

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
      <Tooltip content={canDownload ? '下载文档到本地' : '请联系管理员获取下载权限'}>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canDownload}
          onClick={handleDownloadClick}
        >
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

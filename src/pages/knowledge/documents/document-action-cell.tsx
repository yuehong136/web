/**
 * 文档操作按钮单元格组件
 */

import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const isRunning = document.run === TaskStatus.RUNNING

  const handleDownloadClick = useCallback(() => {
    if (!canDownload) {
      toast.warning(t('knowledge.documents.actions.noDownloadPermission'))
      return
    }
    onDownload()
  }, [canDownload, onDownload, t])

  return (
    <div className="flex items-center justify-end space-x-2">
      <Tooltip
        content={
          isRunning
            ? t('knowledge.documents.actions.stopTask')
            : t('knowledge.documents.actions.startParse')
        }
      >
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
      <Tooltip content={t('knowledge.documents.actions.rename')}>
        <Button variant="ghost" size="icon-sm" onClick={onRename}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip
        content={
          canDownload
            ? t('knowledge.documents.actions.download')
            : t('knowledge.documents.actions.noDownloadPermission')
        }
      >
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canDownload}
          onClick={handleDownloadClick}
        >
          <Download className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content={t('knowledge.documents.actions.delete')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="text-text-error"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  )
}

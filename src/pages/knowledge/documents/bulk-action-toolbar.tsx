/**
 * 批量操作浮动工具栏组件
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui'

interface BulkActionToolbarProps {
  selectedCount: number
  onEnable: () => void
  onDisable: () => void
  onStartParse: () => void
  onStopParse: () => void
  onDelete: () => void
  onClearSelection: () => void
  isLoading?: boolean
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onEnable,
  onDisable,
  onStartParse,
  onStopParse,
  onDelete,
  onClearSelection,
  isLoading = false,
}) => {
  const { t } = useTranslation()
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-lg border border-border-default bg-background-surface p-4 shadow-lg">
      <div className="flex items-center space-x-4">
        {/* 选中计数 */}
        <div className="flex items-center space-x-2">
          <div className="rounded-lg bg-status-info-subtle p-2">
            <FileText className="h-4 w-4 text-status-info" />
          </div>
          <span className="text-sm text-text-secondary">
            {t('knowledge.documents.bulkActions.selected', {
              count: selectedCount,
            })}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="h-6 w-px bg-border-default" />

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEnable}
            disabled={isLoading}
            className="border-border-success text-text-success"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            {t('knowledge.documents.bulkActions.enable')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDisable}
            disabled={isLoading}
            className="border-border-default text-text-secondary"
          >
            <XCircle className="mr-1 h-4 w-4" />
            {t('knowledge.documents.bulkActions.disable')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onStartParse}
            disabled={isLoading}
            className="border-border-accent text-text-accent"
          >
            <Play className="mr-1 h-4 w-4" />
            {t('knowledge.documents.bulkActions.startParse')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onStopParse}
            disabled={isLoading}
            className="border-border-warning text-text-warning"
          >
            <Square className="mr-1 h-4 w-4" />
            {t('knowledge.documents.bulkActions.stopTask')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {t('knowledge.documents.bulkActions.delete')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
            className="text-text-tertiary"
          >
            <X className="mr-1 h-4 w-4" />
            {t('knowledge.documents.bulkActions.clearSelection')}
          </Button>
        </div>
      </div>
    </div>
  )
}

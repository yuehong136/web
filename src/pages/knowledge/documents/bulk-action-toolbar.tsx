/**
 * 批量操作浮动工具栏组件
 */

import React from 'react'
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
  if (selectedCount === 0) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 rounded-lg shadow-lg p-4 z-50"
      style={{
        backgroundColor: 'var(--color-background-surface)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <div className="flex items-center space-x-4">
        {/* 选中计数 */}
        <div className="flex items-center space-x-2">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-state-info-subtle)' }}
          >
            <FileText
              className="h-4 w-4"
              style={{ color: 'var(--color-state-info)' }}
            />
          </div>
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            已选择 {selectedCount} 个文档
          </span>
        </div>

        {/* 分隔线 */}
        <div
          className="h-6 w-px"
          style={{ backgroundColor: 'var(--color-border-default)' }}
        />

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEnable}
            disabled={isLoading}
            style={{
              color: 'var(--color-text-success)',
              borderColor: 'var(--color-border-success)',
            }}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            启用
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDisable}
            disabled={isLoading}
            style={{
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            禁用
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onStartParse}
            disabled={isLoading}
            style={{
              color: 'var(--color-text-accent)',
              borderColor: 'var(--color-border-accent)',
            }}
          >
            <Play className="h-4 w-4 mr-1" />
            开始解析
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onStopParse}
            disabled={isLoading}
            style={{
              color: 'var(--color-text-warning)',
              borderColor: 'var(--color-border-warning)',
            }}
          >
            <Square className="h-4 w-4 mr-1" />
            停止任务
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <X className="h-4 w-4 mr-1" />
            取消选择
          </Button>
        </div>
      </div>
    </div>
  )
}

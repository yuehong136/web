/**
 * 文档任务状态单元格组件
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Tooltip } from '@/components/ui'
import { Switch } from '@/components/ui/switch'
import type { Document } from '@/types/api'
import { TaskStatus, TaskStatusConfig } from './constants'

interface DocumentStatusCellProps {
  document: Document
  onShowLog?: (doc: Document) => void
}

export const DocumentStatusCell: React.FC<DocumentStatusCellProps> = ({
  document,
  onShowLog,
}) => {
  const { t } = useTranslation()
  const { run, progress } = document

  // 点击处理
  const handleClick = () => {
    onShowLog?.(document)
  }

  // 运行中状态 - 显示进度条
  if (run === TaskStatus.RUNNING) {
    const progressPercent = Math.round(progress * 100)
    return (
      <div className="inline-flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-components-task-status-running-border bg-components-task-status-running-bg px-2.5 py-1.5">
          {/* 脉冲动画点 */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-components-task-status-running-dot opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-components-task-status-running-dot" />
          </span>
          {/* 进度条 */}
          <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-components-task-status-running-progress-bg">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-components-task-status-running-progress-fill transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
            {/* 光晕效果 */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-components-task-status-running-progress-glow opacity-50 blur-sm transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* 百分比 */}
          <span className="text-xs font-medium tabular-nums text-components-task-status-running-text">
            {progressPercent}%
          </span>
        </div>
        {/* 查看详情按钮 - 小圆点 */}
        <Tooltip content={t('knowledge.documents.actions.viewDetail')}>
          <button
            onClick={handleClick}
            className="h-2 w-2 cursor-pointer rounded-full bg-components-task-status-running-dot transition-all hover:scale-150"
            aria-label={t('knowledge.documents.actions.viewDetail')}
          />
        </Tooltip>
      </div>
    )
  }

  // 其他状态
  const statusConfig =
    TaskStatusConfig[run as TaskStatus] || TaskStatusConfig[TaskStatus.UNSTART]

  // 状态图标
  const getStatusIcon = () => {
    switch (run) {
      case TaskStatus.CANCEL:
        return <X className="h-3 w-3" />
      case TaskStatus.DONE:
        return <CheckCircle className="h-3 w-3" />
      case TaskStatus.FAIL:
        return <XCircle className="h-3 w-3" />
      default:
        return (
          <span
            className={cn(
              'inline-flex h-1.5 w-1.5 rounded-full',
              statusConfig.dotClass,
            )}
          />
        )
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
          statusConfig.bgClass,
          statusConfig.borderClass,
          statusConfig.textClass,
        )}
      >
        {getStatusIcon()}
        {t(statusConfig.textKey)}
      </span>
      {/* 查看详情按钮 - 小圆点，颜色与状态一致 */}
      <Tooltip content={t('knowledge.documents.actions.viewDetail')}>
        <button
          onClick={handleClick}
          className={cn(
            'h-2 w-2 cursor-pointer rounded-full transition-all hover:scale-150',
            statusConfig.dotClass,
          )}
          aria-label={t('knowledge.documents.actions.viewDetail')}
        />
      </Tooltip>
    </div>
  )
}

// ============================================================================
// 元数据状态单元格
// ============================================================================

interface DocumentMetadataCellProps {
  document: Document
  hasMetadataEnabled?: boolean
  onEditMetadata?: () => void
}

export const DocumentMetadataCell: React.FC<DocumentMetadataCellProps> = ({
  document,
  onEditMetadata,
}) => {
  const { t } = useTranslation()
  const hasMetadata =
    document.meta_fields && Object.keys(document.meta_fields).length > 0
  const metadataCount = hasMetadata
    ? Object.keys(document.meta_fields!).length
    : 0

  if (hasMetadata) {
    return (
      <Tooltip
        content={
          <div className="max-w-xs">
            <div className="mb-1 font-medium text-text-primary">
              {t('knowledge.documents.metadataCell.configured', {
                count: metadataCount,
              })}
            </div>
            <div className="space-y-0.5 text-xs text-text-secondary">
              {Object.entries(document.meta_fields!)
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              {metadataCount > 5 && (
                <div className="text-text-tertiary">
                  {t('knowledge.documents.metadataCell.moreFields', {
                    count: metadataCount - 5,
                  })}
                </div>
              )}
            </div>
          </div>
        }
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-1.5 py-1"
          onClick={onEditMetadata}
          aria-label={t('knowledge.metadata.editor.editMetadata')}
        >
          <div className="h-2 w-2 rounded-full bg-status-success" />
          <span className="text-xs text-text-success">{metadataCount}</span>
        </Button>
      </Tooltip>
    )
  }

  return (
    <Tooltip content={t('knowledge.metadata.editor.editMetadata')}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto gap-1 px-1.5 py-1"
        onClick={onEditMetadata}
        aria-label={t('knowledge.metadata.editor.editMetadata')}
      >
        <div className="h-2 w-2 rounded-full bg-status-warning" />
        <span className="text-xs text-text-tertiary">
          {t('knowledge.documents.metadataCell.none')}
        </span>
      </Button>
    </Tooltip>
  )
}

// ============================================================================
// 启用状态开关
// ============================================================================

interface DocumentEnableSwitchProps {
  document: Document
  onToggle: () => void
}

export const DocumentEnableSwitch: React.FC<DocumentEnableSwitchProps> = ({
  document,
  onToggle,
}) => {
  const { t } = useTranslation()
  const isEnabled = document.status === '1'

  return (
    <Tooltip
      content={
        isEnabled
          ? t('knowledge.documents.actions.disableDocument')
          : t('knowledge.documents.actions.enableDocument')
      }
    >
      <Switch
        size="sm"
        checked={isEnabled}
        onCheckedChange={onToggle}
        aria-label={
          isEnabled
            ? t('knowledge.documents.actions.disableDocument')
            : t('knowledge.documents.actions.enableDocument')
        }
      />
    </Tooltip>
  )
}

/**
 * 文档任务状态单元格组件
 */

import React from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui'
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
        <div
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full"
          style={{
            background: 'var(--color-components-task-status-running-bg)',
            border:
              '1px solid var(--color-components-task-status-running-border)',
          }}
        >
          {/* 脉冲动画点 */}
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{
                backgroundColor:
                  'var(--color-components-task-status-running-dot)',
              }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{
                backgroundColor:
                  'var(--color-components-task-status-running-dot)',
              }}
            />
          </span>
          {/* 进度条 */}
          <div
            className="relative w-16 h-1.5 rounded-full overflow-hidden"
            style={{
              background:
                'var(--color-components-task-status-running-progress-bg)',
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                background:
                  'var(--color-components-task-status-running-progress-fill)',
              }}
            />
            {/* 光晕效果 */}
            <div
              className="absolute inset-y-0 left-0 rounded-full blur-sm opacity-50 transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                background:
                  'var(--color-components-task-status-running-progress-glow)',
              }}
            />
          </div>
          {/* 百分比 */}
          <span
            className="text-xs font-medium tabular-nums"
            style={{ color: 'var(--color-components-task-status-running-text)' }}
          >
            {progressPercent}%
          </span>
        </div>
        {/* 查看详情按钮 - 小圆点 */}
        <Tooltip content="查看详情">
          <button
            onClick={handleClick}
            className="w-2 h-2 rounded-full transition-all hover:scale-150 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-components-task-status-running-dot)',
            }}
          />
        </Tooltip>
      </div>
    )
  }

  // 其他状态
  const statusConfig = TaskStatusConfig[run as TaskStatus] || TaskStatusConfig[TaskStatus.UNSTART]

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
            className="inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusConfig.dotToken }}
          />
        )
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: statusConfig.bgToken,
          border: `1px solid ${statusConfig.borderToken}`,
          color: statusConfig.textToken,
        }}
      >
        {getStatusIcon()}
        {statusConfig.text}
      </span>
      {/* 查看详情按钮 - 小圆点，颜色与状态一致 */}
      <Tooltip content="查看详情">
        <button
          onClick={handleClick}
          className="w-2 h-2 rounded-full transition-all hover:scale-150 cursor-pointer"
          style={{
            backgroundColor: statusConfig.dotToken,
          }}
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
  onClickReparse?: () => void
}

export const DocumentMetadataCell: React.FC<DocumentMetadataCellProps> = ({
  document,
  hasMetadataEnabled = false,
  onClickReparse,
}) => {
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
            <div
              className="font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              已配置 {metadataCount} 个字段
            </div>
            <div
              className="text-xs space-y-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {Object.entries(document.meta_fields!)
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              {metadataCount > 5 && (
                <div className="text-text-tertiary">
                  ... 还有 {metadataCount - 5} 个
                </div>
              )}
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-1 cursor-help">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--color-state-success)' }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-success)' }}
          >
            {metadataCount}
          </span>
        </div>
      </Tooltip>
    )
  }

  // 无元数据时显示快捷操作
  return (
    <Tooltip
      content={
        hasMetadataEnabled
          ? '点击重新解析以提取元数据'
          : '未配置元数据'
      }
    >
      <div
        className={`flex items-center gap-1 ${hasMetadataEnabled ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        onClick={hasMetadataEnabled ? onClickReparse : undefined}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--color-state-warning)' }}
        />
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          无
        </span>
      </div>
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
  const isEnabled = document.status === '1'

  return (
    <Tooltip content={isEnabled ? '点击禁用文档' : '点击启用文档'}>
      <Switch
        size="sm"
        checked={isEnabled}
        onCheckedChange={onToggle}
      />
    </Tooltip>
  )
}

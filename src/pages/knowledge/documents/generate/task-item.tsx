/**
 * 单个生成任务状态卡片
 *
 * - running/failed：完整卡片，进度条 + 可展开日志区
 * - start/completed：紧凑单行（在 Dock 中使用 compact 模式）
 */

import React, { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CirclePause,
  RotateCcw,
  Network,
  TreePine,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Tooltip } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import {
  GenerateTaskType,
  GenerateTaskStatus,
  type TraceInfo,
} from '@/hooks/use-generate-task'
import { TASK_TYPE_CONFIG, TASK_STATUS_CONFIG } from './constants'

const IconMap = { Network, TreePine } as const

interface TaskItemProps {
  type: GenerateTaskType
  status: GenerateTaskStatus
  traceData: TraceInfo | null
  disabled?: boolean
  isActionPending?: boolean
  /** 紧凑模式：已完成/未开始态在 Dock 中使用，折叠为单行 */
  compact?: boolean
  onRun: (type: GenerateTaskType) => void
  onPause: (taskId: string, type: GenerateTaskType) => void
  onDelete: (type: GenerateTaskType) => void
}

const TaskItemComponent: React.FC<TaskItemProps> = ({
  type,
  status,
  traceData,
  disabled = false,
  isActionPending = false,
  compact = false,
  onRun,
  onPause,
  onDelete,
}) => {
  const { t } = useTranslation()
  const [logExpanded, setLogExpanded] = useState(false)
  const typeConfig = TASK_TYPE_CONFIG[type]
  const statusConfig = TASK_STATUS_CONFIG[status]
  const Icon = IconMap[typeConfig.icon]

  const percent =
    status === GenerateTaskStatus.Failed
      ? 100
      : status === GenerateTaskStatus.Running && traceData
        ? Math.round(traceData.progress * 100)
        : 0

  const canTrigger =
    status === GenerateTaskStatus.Start ||
    status === GenerateTaskStatus.Completed ||
    status === GenerateTaskStatus.Failed

  const handleAction = useCallback(() => {
    if (canTrigger) onRun(type)
  }, [canTrigger, onRun, type])

  const handlePause = useCallback(() => {
    if (traceData?.id) onPause(traceData.id, type)
  }, [traceData?.id, onPause, type])

  const handleDelete = useCallback(() => {
    onDelete(type)
  }, [onDelete, type])

  const isQuiet =
    status === GenerateTaskStatus.Start ||
    status === GenerateTaskStatus.Completed

  // 紧凑模式：已完成/未开始 → 单行内联
  if (compact && isQuiet) {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border px-3 py-2 transition-colors',
          statusConfig.bgClass,
          statusConfig.borderClass,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className={cn('h-3.5 w-3.5 shrink-0', statusConfig.textClass)}
          />
          <span className="truncate text-sm font-medium text-text-primary">
            {t(typeConfig.labelKey)}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full border px-1.5 py-0.5 text-xs',
              statusConfig.textClass,
              statusConfig.borderClass,
            )}
          >
            {t(statusConfig.textKey)}
          </span>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          {canTrigger && (
            <Tooltip content={t(statusConfig.actionTextKey)}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleAction}
                disabled={disabled || isActionPending}
              >
                <Play className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}
          {status === GenerateTaskStatus.Completed && (
            <Tooltip content={t('knowledge.documents.generate.deleteResult')}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleDelete}
                disabled={isActionPending}
              >
                <Trash2 className="h-3 w-3 text-status-error" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    )
  }

  // 完整卡片模式（running/failed，或下拉菜单中的所有状态）
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        statusConfig.bgClass,
        statusConfig.borderClass,
      )}
    >
      {/* 标题行 */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', statusConfig.textClass)} />
          <span className="text-sm font-medium text-text-primary">
            {t(typeConfig.labelKey)}
          </span>
          <span
            className={cn(
              'rounded-full border px-1.5 py-0.5 text-xs',
              statusConfig.textClass,
              statusConfig.bgClass,
              statusConfig.borderClass,
            )}
          >
            {t(statusConfig.textKey)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {canTrigger && (
            <Tooltip content={t(statusConfig.actionTextKey)}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleAction}
                disabled={disabled || isActionPending}
              >
                {status === GenerateTaskStatus.Failed ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            </Tooltip>
          )}
          {status === GenerateTaskStatus.Running && (
            <Tooltip content={t('knowledge.documents.generate.pause')}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handlePause}
                disabled={isActionPending}
              >
                <CirclePause className="h-3.5 w-3.5 text-status-warning" />
              </Button>
            </Tooltip>
          )}
          {status === GenerateTaskStatus.Completed && (
            <Tooltip content={t('knowledge.documents.generate.deleteResult')}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleDelete}
                disabled={isActionPending}
              >
                <Trash2 className="h-3.5 w-3.5 text-status-error" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 描述行（仅 start/completed） */}
      {isQuiet && (
        <p className="mb-0 text-xs text-text-tertiary">
          {t(typeConfig.descriptionKey)}
        </p>
      )}

      {/* 进度区（running/failed） */}
      {(status === GenerateTaskStatus.Running ||
        status === GenerateTaskStatus.Failed) && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Progress
                value={percent}
                className="h-1.5"
                style={
                  status === GenerateTaskStatus.Failed
                    ? ({
                        '--progress-fill': 'var(--color-status-error)',
                      } as React.CSSProperties)
                    : undefined
                }
              />
            </div>
            {status === GenerateTaskStatus.Running && (
              <span
                className={cn(
                  'min-w-[32px] text-right text-xs font-medium tabular-nums',
                  statusConfig.textClass,
                )}
              >
                {percent}%
              </span>
            )}
          </div>

          {/* 可展开日志区 */}
          {traceData?.progress_msg && (
            <div>
              <div
                className={cn(
                  'overflow-hidden whitespace-pre-line text-xs leading-relaxed text-text-tertiary transition-all duration-200',
                  logExpanded
                    ? 'max-h-[200px] overflow-y-auto scrollbar-thin'
                    : 'max-h-[3.6em]',
                )}
              >
                {traceData.progress_msg}
              </div>
              <button
                type="button"
                className={cn(
                  'mt-1 flex items-center gap-0.5 text-xs transition-colors hover:opacity-80',
                  statusConfig.textClass,
                )}
                onClick={() => setLogExpanded((v) => !v)}
              >
                {logExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    {t('knowledge.documents.generate.collapse')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    {t('knowledge.documents.generate.expandLogs')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const TaskItem = memo(TaskItemComponent)

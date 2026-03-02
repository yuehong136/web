/**
 * 单个生成任务状态卡片
 *
 * - running/failed：完整卡片，进度条 + 可展开日志区
 * - start/completed：紧凑单行（在 Dock 中使用 compact 模式）
 */

import React, { memo, useState, useCallback } from 'react'
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

  const isQuiet = status === GenerateTaskStatus.Start || status === GenerateTaskStatus.Completed

  // 紧凑模式：已完成/未开始 → 单行内联
  if (compact && isQuiet) {
    return (
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
        style={{
          border: `1px solid ${statusConfig.borderToken}`,
          backgroundColor: statusConfig.bgToken,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: statusConfig.textToken }} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {typeConfig.label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
            style={{ color: statusConfig.textToken, border: `1px solid ${statusConfig.borderToken}` }}
          >
            {statusConfig.text}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {canTrigger && (
            <Tooltip content={statusConfig.actionText}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleAction} disabled={disabled || isActionPending}>
                <Play className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}
          {status === GenerateTaskStatus.Completed && (
            <Tooltip content="删除生成结果">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDelete} disabled={isActionPending}>
                <Trash2 className="h-3 w-3" style={{ color: 'var(--color-state-error)' }} />
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
      className="rounded-lg p-3 transition-colors"
      style={{
        border: `1px solid ${statusConfig.borderToken}`,
        backgroundColor: statusConfig.bgToken,
      }}
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: statusConfig.textToken }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {typeConfig.label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{
              color: statusConfig.textToken,
              backgroundColor: statusConfig.bgToken,
              border: `1px solid ${statusConfig.borderToken}`,
            }}
          >
            {statusConfig.text}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {canTrigger && (
            <Tooltip content={statusConfig.actionText}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleAction} disabled={disabled || isActionPending}>
                {status === GenerateTaskStatus.Failed ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
            </Tooltip>
          )}
          {status === GenerateTaskStatus.Running && (
            <Tooltip content="暂停">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handlePause} disabled={isActionPending}>
                <CirclePause className="h-3.5 w-3.5" style={{ color: 'var(--color-state-warning)' }} />
              </Button>
            </Tooltip>
          )}
          {status === GenerateTaskStatus.Completed && (
            <Tooltip content="删除生成结果">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDelete} disabled={isActionPending}>
                <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--color-state-error)' }} />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 描述行（仅 start/completed） */}
      {isQuiet && (
        <p className="text-xs mb-0" style={{ color: 'var(--color-text-tertiary)' }}>
          {typeConfig.description}
        </p>
      )}

      {/* 进度区（running/failed） */}
      {(status === GenerateTaskStatus.Running || status === GenerateTaskStatus.Failed) && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Progress
                value={percent}
                className="h-1.5"
                style={
                  status === GenerateTaskStatus.Failed
                    ? { '--progress-fill': 'var(--color-state-error)' } as React.CSSProperties
                    : undefined
                }
              />
            </div>
            {status === GenerateTaskStatus.Running && (
              <span
                className="text-xs font-medium tabular-nums min-w-[32px] text-right"
                style={{ color: statusConfig.textToken }}
              >
                {percent}%
              </span>
            )}
          </div>

          {/* 可展开日志区 */}
          {traceData?.progress_msg && (
            <div>
              <div
                className={`text-xs leading-relaxed whitespace-pre-line overflow-hidden transition-all duration-200 ${
                  logExpanded ? 'max-h-[200px] overflow-y-auto scrollbar-thin' : 'max-h-[3.6em]'
                }`}
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {traceData.progress_msg}
              </div>
              <button
                type="button"
                className="flex items-center gap-0.5 mt-1 text-xs transition-colors hover:opacity-80"
                style={{ color: statusConfig.textToken }}
                onClick={() => setLogExpanded((v) => !v)}
              >
                {logExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    展开日志
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

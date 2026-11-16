/**
 * 常驻任务状态区
 *
 * 仅在有"需要关注"的任务时出现（运行中 / 失败）。
 * 已完成/未开始不占页面空间，收入顶部"生成"按钮下拉中查看。
 */

import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  GenerateTaskType,
  GenerateTaskStatus,
  type TraceInfo,
} from '@/hooks/use-generate-task'
import { TaskItem } from './task-item'

interface TaskDockProps {
  kbId: string
  graphStatus: GenerateTaskStatus
  raptorStatus: GenerateTaskStatus
  graphTrace: TraceInfo | null
  raptorTrace: TraceInfo | null
  disabled?: boolean
  isActionPending?: boolean
  onRun: (type: GenerateTaskType) => void
  onPause: (taskId: string, type: GenerateTaskType) => void
  onDelete: (type: GenerateTaskType) => void
}

function needsAttention(status: GenerateTaskStatus) {
  return (
    status === GenerateTaskStatus.Running ||
    status === GenerateTaskStatus.Failed
  )
}

const TaskDockComponent: React.FC<TaskDockProps> = ({
  kbId,
  graphStatus,
  raptorStatus,
  graphTrace,
  raptorTrace,
  disabled,
  isActionPending,
  onRun,
  onPause,
  onDelete,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const items = [
    { type: GenerateTaskType.GraphRAG, status: graphStatus, trace: graphTrace },
    { type: GenerateTaskType.Raptor, status: raptorStatus, trace: raptorTrace },
  ].filter((i) => needsAttention(i.status))

  if (items.length === 0) return null

  return (
    <div
      data-slot="generate-task-dock"
      className="shrink-0 border-b border-border-subtle px-space-md py-space-sm"
    >
      <div className="mb-space-sm flex items-center justify-between">
        <h4 className="text-sm font-medium text-text-primary">
          {t('knowledge.documents.generate.tasksTitle')}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => navigate(`/knowledge/${kbId}/logs`)}
        >
          <ExternalLink className="size-icon-xs" aria-hidden="true" />
          {t('knowledge.documents.generate.viewLogs')}
        </Button>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-space-sm',
          items.length > 1 && 'md:grid-cols-2',
        )}
      >
        {items.map((item) => (
          <TaskItem
            key={item.type}
            type={item.type}
            status={item.status}
            traceData={item.trace}
            disabled={disabled}
            isActionPending={isActionPending}
            onRun={onRun}
            onPause={onPause}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

export const TaskDock = memo(TaskDockComponent)

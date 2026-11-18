/**
 * 顶部 "生成" 弹出面板按钮
 *
 * - 运行中：图标脉冲动画
 * - 有已完成结果：按钮右上角绿色小圆点
 * - 下拉面板中展示所有任务状态详情
 */

import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  GenerateTaskType,
  GenerateTaskStatus,
  type TraceInfo,
} from '@/hooks/use-generate-task'
import { TaskItem } from './task-item'

interface GenerateButtonProps {
  disabled?: boolean
  graphStatus: GenerateTaskStatus
  raptorStatus: GenerateTaskStatus
  graphTrace: TraceInfo | null
  raptorTrace: TraceInfo | null
  isActionPending?: boolean
  onRun: (type: GenerateTaskType) => void
  onPause: (taskId: string, type: GenerateTaskType) => void
  onDelete: (type: GenerateTaskType) => void
}

const GenerateButtonComponent: React.FC<GenerateButtonProps> = ({
  disabled = false,
  graphStatus,
  raptorStatus,
  graphTrace,
  raptorTrace,
  isActionPending,
  onRun,
  onPause,
  onDelete,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const handleDelete = useCallback(
    (type: GenerateTaskType) => {
      setOpen(false)
      onDelete(type)
    },
    [onDelete],
  )
  const hasRunning =
    graphStatus === GenerateTaskStatus.Running ||
    raptorStatus === GenerateTaskStatus.Running

  const hasCompleted =
    graphStatus === GenerateTaskStatus.Completed ||
    raptorStatus === GenerateTaskStatus.Completed

  const hasFailed =
    graphStatus === GenerateTaskStatus.Failed ||
    raptorStatus === GenerateTaskStatus.Failed

  const dotClass = useMemo(() => {
    if (hasRunning) return 'bg-line-focus animate-pulse'
    if (hasFailed) return 'bg-danger-fg'
    if (hasCompleted) return 'bg-success-fg'
    return null
  }, [hasRunning, hasFailed, hasCompleted])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip
        content={
          disabled
            ? t('knowledge.documents.generate.disabledTooltip')
            : t('knowledge.documents.generate.tooltip')
        }
      >
        <PopoverTrigger asChild>
          <div className="relative inline-flex">
            <Button variant="outline" disabled={disabled}>
              <WandSparkles
                className={cn('size-icon-sm', hasRunning && 'animate-pulse')}
                aria-hidden="true"
              />
              {t('knowledge.documents.generate.button')}
            </Button>
            {/* 状态指示圆点 */}
            {dotClass && !disabled && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -top-1 -right-1 size-2.5 rounded-radius-full border-2 border-surface',
                  dotClass,
                )}
              />
            )}
          </div>
        </PopoverTrigger>
      </Tooltip>
      {/* Task controls, not menu items: a popover keeps them in the Tab order. */}
      <PopoverContent align="end" sideOffset={8} className="w-[360px]">
        <div className="space-y-space-base">
          <TaskItem
            type={GenerateTaskType.GraphRAG}
            status={graphStatus}
            traceData={graphTrace}
            disabled={disabled}
            isActionPending={isActionPending}
            onRun={onRun}
            onPause={onPause}
            onDelete={handleDelete}
          />
          <TaskItem
            type={GenerateTaskType.Raptor}
            status={raptorStatus}
            traceData={raptorTrace}
            disabled={disabled}
            isActionPending={isActionPending}
            onRun={onRun}
            onPause={onPause}
            onDelete={handleDelete}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const GenerateButton = memo(GenerateButtonComponent)

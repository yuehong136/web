/**
 * 顶部 "生成" 下拉按钮
 *
 * - 运行中：图标脉冲动画
 * - 有已完成结果：按钮右上角绿色小圆点
 * - 下拉面板中展示所有任务状态详情
 */

import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { Tooltip } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
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
  const hasRunning =
    graphStatus === GenerateTaskStatus.Running ||
    raptorStatus === GenerateTaskStatus.Running

  const hasCompleted =
    graphStatus === GenerateTaskStatus.Completed ||
    raptorStatus === GenerateTaskStatus.Completed

  const hasFailed =
    graphStatus === GenerateTaskStatus.Failed ||
    raptorStatus === GenerateTaskStatus.Failed

  const dotColor = useMemo(() => {
    if (hasRunning) return 'var(--color-state-focus)'
    if (hasFailed) return 'var(--color-state-error)'
    if (hasCompleted) return 'var(--color-state-success)'
    return null
  }, [hasRunning, hasFailed, hasCompleted])

  return (
    <DropdownMenu>
      <Tooltip
        content={
          disabled
            ? t('knowledge.documents.generate.disabledTooltip')
            : t('knowledge.documents.generate.tooltip')
        }
      >
        <DropdownMenuTrigger asChild>
          <div className="relative inline-flex">
            <Button variant="outline" disabled={disabled}>
              <WandSparkles
                className={`mr-2 h-4 w-4 ${hasRunning ? 'animate-pulse' : ''}`}
              />
              {t('knowledge.documents.generate.button')}
            </Button>
            {/* 状态指示圆点 */}
            {dotColor && !disabled && (
              <span
                className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 ${hasRunning ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: dotColor,
                  borderColor: 'var(--color-background-surface)',
                }}
              />
            )}
          </div>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent className="w-[360px] p-4">
        <div className="space-y-3">
          <TaskItem
            type={GenerateTaskType.GraphRAG}
            status={graphStatus}
            traceData={graphTrace}
            disabled={disabled}
            isActionPending={isActionPending}
            onRun={onRun}
            onPause={onPause}
            onDelete={onDelete}
          />
          <TaskItem
            type={GenerateTaskType.Raptor}
            status={raptorStatus}
            traceData={raptorTrace}
            disabled={disabled}
            isActionPending={isActionPending}
            onRun={onRun}
            onPause={onPause}
            onDelete={onDelete}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const GenerateButton = memo(GenerateButtonComponent)

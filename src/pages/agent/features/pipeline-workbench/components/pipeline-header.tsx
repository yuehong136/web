import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RotateCcw, X } from 'lucide-react'
import {
  PipelineRuntimeStatus,
  type PipelineWorkbenchSummary,
} from '../types'

interface PipelineHeaderProps {
  summary: PipelineWorkbenchSummary
  onClose: () => void
  onReset: () => void
}

const STATUS_LABEL_MAP: Record<PipelineRuntimeStatus, string> = {
  [PipelineRuntimeStatus.IDLE]: '待运行',
  [PipelineRuntimeStatus.PREPARING]: '准备中',
  [PipelineRuntimeStatus.RUNNING]: '运行中',
  [PipelineRuntimeStatus.SUCCESS]: '已完成',
  [PipelineRuntimeStatus.ERROR]: '失败',
  [PipelineRuntimeStatus.STOPPED]: '已停止',
}

const STATUS_VARIANT_MAP: Record<
  PipelineRuntimeStatus,
  'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  [PipelineRuntimeStatus.IDLE]: 'secondary',
  [PipelineRuntimeStatus.PREPARING]: 'warning',
  [PipelineRuntimeStatus.RUNNING]: 'warning',
  [PipelineRuntimeStatus.SUCCESS]: 'success',
  [PipelineRuntimeStatus.ERROR]: 'destructive',
  [PipelineRuntimeStatus.STOPPED]: 'outline',
}

export function PipelineHeader({
  summary,
  onClose,
  onReset,
}: PipelineHeaderProps) {
  return (
    <div className="border-b border-border-primary px-space-md py-space-sm">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-space-sm">
            <h2 className="text-base font-medium text-text-primary">
              Pipeline 运行与日志工作台
            </h2>
            <Badge variant={STATUS_VARIANT_MAP[summary.status]}>
              {STATUS_LABEL_MAP[summary.status]}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary">
            {summary.lastRunAt
              ? `最近一次运行 ${formatRelativeTime(summary.lastRunAt)}`
              : '上传文档触发数据流处理，并在右侧时间线和输出视图查看结果。'}
          </p>
          {summary.uploadedFile ? (
            <p className="text-xs text-text-tertiary">
              本次文件：{String(summary.uploadedFile.name || summary.uploadedFile.id || '未命名文档')}
            </p>
          ) : null}
          {summary.lastError ? (
            <p
              className={cn(
                'text-xs',
                summary.status === PipelineRuntimeStatus.ERROR
                  ? 'text-status-error'
                  : 'text-text-tertiary',
              )}
            >
              {summary.lastError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-space-xs">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-text-secondary hover:text-text-primary"
            onClick={onReset}
            title="清空当前 Pipeline 运行记录"
            aria-label="清空当前 Pipeline 运行记录"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-text-secondary hover:text-text-primary"
            onClick={onClose}
            title="关闭 Pipeline 工作台"
            aria-label="关闭 Pipeline 工作台"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

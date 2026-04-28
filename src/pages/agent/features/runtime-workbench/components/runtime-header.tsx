import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ExternalLink, Plus, RotateCcw, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type AgentRuntimeController,
  type RuntimeWorkbenchSummary,
} from '../types'
import { SessionPicker } from './session-picker'

interface RuntimeHeaderProps {
  summary: RuntimeWorkbenchSummary
  controller: AgentRuntimeController
  onClose: () => void
  onReset: () => void
  onViewChange: (view: RuntimeWorkbenchView) => void
}

const STATUS_LABEL_MAP: Record<AgentRuntimeStatus, string> = {
  [AgentRuntimeStatus.IDLE]: '待运行',
  [AgentRuntimeStatus.PREPARING]: '准备中',
  [AgentRuntimeStatus.RUNNING]: '运行中',
  [AgentRuntimeStatus.SUCCESS]: '已完成',
  [AgentRuntimeStatus.ERROR]: '失败',
  [AgentRuntimeStatus.STOPPED]: '已停止',
}

const STATUS_VARIANT_MAP: Record<
  AgentRuntimeStatus,
  'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  [AgentRuntimeStatus.IDLE]: 'secondary',
  [AgentRuntimeStatus.PREPARING]: 'warning',
  [AgentRuntimeStatus.RUNNING]: 'warning',
  [AgentRuntimeStatus.SUCCESS]: 'success',
  [AgentRuntimeStatus.ERROR]: 'destructive',
  [AgentRuntimeStatus.STOPPED]: 'outline',
}

export function RuntimeHeader({
  summary,
  controller,
  onClose,
  onReset,
  onViewChange,
}: RuntimeHeaderProps) {
  const visibleSessionId = controller.viewingSessionId || summary.sessionId
  const visibleSessionName =
    controller.viewingSessionId && controller.viewingSessionId !== summary.sessionId
      ? '历史会话'
      : summary.sessionName || 'Live · 未命名'

  return (
    <div className="border-b border-border-primary px-space-md py-space-sm">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-space-sm">
            <h2 className="text-base font-medium text-text-primary">
              Agent 运行与单步调试工作台
            </h2>
            <Badge variant={STATUS_VARIANT_MAP[summary.status]}>
              {STATUS_LABEL_MAP[summary.status]}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary">
            {summary.lastRunAt
              ? `最近一次运行 ${formatRelativeTime(summary.lastRunAt)}`
              : '在这里配置 Begin 输入、查看对话结果与节点时间线。'}
          </p>
          {summary.lastError ? (
            <p
              className={cn(
                'text-xs',
                summary.status === AgentRuntimeStatus.ERROR
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
            title="清空当前运行记录"
            aria-label="清空当前运行记录"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-text-secondary hover:text-text-primary"
            onClick={onClose}
            title="关闭运行工作台"
            aria-label="关闭运行工作台"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-space-sm flex flex-wrap items-center justify-between gap-space-sm rounded-radius-md border border-border-default bg-surface-secondary px-space-sm py-space-xs">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-text-primary">
            当前会话：{visibleSessionName}
          </p>
          <p className="truncate text-xs text-text-tertiary">
            {visibleSessionId || '运行后由后端返回 session_id'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void controller.handleCreateSession()
            }}
          >
            <Plus className="size-4" />
            新建会话
          </Button>
          <SessionPicker
            canvasId={controller.canvasId}
            currentSessionId={summary.sessionId}
            viewingSessionId={controller.viewingSessionId}
            onSelect={(sessionId) => {
              controller.handleSwitchViewingSession(sessionId)
              onViewChange(RuntimeWorkbenchView.LOG)
            }}
          />
          {controller.canvasId && visibleSessionId ? (
            <Button asChild variant="ghost" size="sm">
              <Link
                to={`/agent/${controller.canvasId}/explore?sessionId=${encodeURIComponent(visibleSessionId)}`}
              >
                <ExternalLink className="size-4" />
                在 Explore 中查看
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

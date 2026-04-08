import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/patterns'
import { formatTimestampDetailed } from '@/lib/utils'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type RuntimeWorkbenchSummary,
} from '../features/runtime-workbench'
import {
  Compass,
  Copy,
  GitBranch,
  History,
  Link2,
  Play,
  Settings2,
  Sparkles,
} from 'lucide-react'

interface EditorRuntimeRailProps {
  flow?: AgentFlow
  autosaveLabel?: string
  runtimeSummary: RuntimeWorkbenchSummary
  onOpenRuntime: (view: RuntimeWorkbenchView) => void
  onOpenExplore: () => void
  onOpenVersions: () => void
  onOpenWebhook: () => void
  onOpenSettings: () => void
  onOpenShare: () => void
  onOpenRoadmap: () => void
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

export function EditorRuntimeRail({
  flow,
  autosaveLabel,
  runtimeSummary,
  onOpenRuntime,
  onOpenExplore,
  onOpenVersions,
  onOpenWebhook,
  onOpenSettings,
  onOpenShare,
  onOpenRoadmap,
}: EditorRuntimeRailProps) {
  const title = resolveLocalizedText(flow?.title, '未命名资产')
  const description = resolveLocalizedText(
    flow?.description,
    '普通 Agent 已切到统一 runtime workbench，后续阶段继续承接 pipeline 和会话浏览。',
  )
  const nodeCount = flow?.dsl.graph?.nodes.length || 0
  const edgeCount = flow?.dsl.graph?.edges.length || 0

  return (
    <div className="flex h-full flex-col gap-space-lg overflow-auto p-space-lg">
      <SectionCard title="当前资产" padding="default">
        <div className="space-y-space-md">
          <div>
            <p className="text-base font-semibold text-text-primary">{title}</p>
            <p className="mt-space-xs text-sm text-text-secondary">{description}</p>
          </div>
          <div className="grid grid-cols-2 gap-space-sm text-sm">
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">类型</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {isPipelineFlow(flow) ? 'Pipeline' : 'Agent'}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">自动保存</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {autosaveLabel || '待首次保存'}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">节点</p>
              <p className="mt-space-xs font-medium text-text-primary">{nodeCount}</p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">连线</p>
              <p className="mt-space-xs font-medium text-text-primary">{edgeCount}</p>
            </div>
          </div>
          {flow?.update_time ? (
            <p className="text-xs text-text-tertiary">
              最近更新时间：{formatTimestampDetailed(flow.update_time)}
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="运行工作台" padding="default">
        <div className="space-y-space-md">
          <div className="flex items-center justify-between gap-space-sm">
            <div>
              <p className="text-sm font-medium text-text-primary">
                普通 Agent Runtime
              </p>
              <p className="mt-space-xs text-sm text-text-secondary">
                {runtimeSummary.lastRunAt
                  ? `最近一次运行：${formatTimestampDetailed(runtimeSummary.lastRunAt)}`
                  : '从这里进入统一的 Run / Conversation / Log 工作台。'}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT_MAP[runtimeSummary.status]}>
              {STATUS_LABEL_MAP[runtimeSummary.status]}
            </Badge>
          </div>

          {runtimeSummary.lastError ? (
            <div className="rounded-radius-md border border-border-primary bg-surface-secondary px-space-sm py-space-xs text-xs text-status-error">
              {runtimeSummary.lastError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-space-sm text-sm">
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">消息</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {runtimeSummary.messageCount}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">日志</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {runtimeSummary.hasLogs ? '可查看' : '暂无'}
              </p>
            </div>
          </div>

          <div className="grid gap-space-sm">
            <Button onClick={() => onOpenRuntime(RuntimeWorkbenchView.RUN)}>
              <Play className="mr-space-xs h-4 w-4" />
              打开工作台
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenRuntime(RuntimeWorkbenchView.CONVERSATION)}
            >
              继续 Conversation
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenRuntime(RuntimeWorkbenchView.LOG)}
              disabled={!runtimeSummary.hasLogs}
            >
              查看节点日志
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="兼容与扩展" padding="default">
        <div className="grid gap-space-sm">
          <Button variant="outline" onClick={onOpenExplore}>
            <Compass className="mr-space-xs h-4 w-4" />
            Explore 会话
          </Button>
          <Button variant="outline" onClick={onOpenVersions}>
            <History className="mr-space-xs h-4 w-4" />
            版本
          </Button>
          <Button variant="outline" onClick={onOpenWebhook}>
            <Link2 className="mr-space-xs h-4 w-4" />
            Webhook
          </Button>
          <Button variant="outline" onClick={onOpenShare}>
            <Copy className="mr-space-xs h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings2 className="mr-space-xs h-4 w-4" />
            编辑基础设置
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="阶段路线" padding="default">
        <div className="space-y-space-sm text-sm text-text-secondary">
          <p className="flex items-start gap-space-xs">
            <Sparkles className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
            T1/T2/T3 已稳定的 operator registry、form-sheet 与目录化节点表单继续作为正式主路径。
          </p>
          <p className="flex items-start gap-space-xs">
            <GitBranch className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
            T4 已把普通 Agent 的运行、测试和单步调试收敛；Pipeline run/log 与 session 浏览留给后续阶段。
          </p>
          <Button variant="secondary" onClick={onOpenRoadmap}>
            查看阶段说明
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/patterns'
import { formatTimestampDetailed } from '@/lib/utils'
import { countFlowNodes, isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type RuntimeWorkbenchSummary,
} from '../features/runtime-workbench'
import {
  PipelineWorkbenchView,
  type PipelineWorkbenchSummary,
} from '../features/pipeline-workbench'
import {
  Compass,
  Copy,
  Database,
  GitBranch,
  History,
  Link2,
  Play,
  Settings2,
  Sparkles,
} from 'lucide-react'

type RuntimeRailSummary = RuntimeWorkbenchSummary | PipelineWorkbenchSummary

interface EditorRuntimeRailProps {
  flow?: AgentFlow
  editorMode: 'agent' | 'pipeline'
  autosaveLabel?: string
  runtimeSummary: RuntimeRailSummary
  onOpenRuntime: (view?: string) => void
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

const isPipelineSummary = (
  summary: RuntimeRailSummary,
): summary is PipelineWorkbenchSummary => 'outputAvailable' in summary

export function EditorRuntimeRail({
  flow,
  editorMode,
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
    editorMode === 'pipeline'
      ? 'Pipeline 数据流编辑：上传文档触发数据流处理，并在右侧时间线和输出视图查看结果。'
      : '普通 Agent 已切到统一 runtime workbench，后续阶段继续承接 pipeline 和会话浏览。',
  )
  const nodeCount = countFlowNodes(flow)
  const edgeCount = flow?.dsl.graph?.edges.length || 0
  const pipelineSummary = isPipelineSummary(runtimeSummary)
    ? runtimeSummary
    : undefined
  const isPipeline = editorMode === 'pipeline'

  return (
    <div className="grid h-full min-h-0 auto-rows-max gap-space-lg overflow-y-auto overscroll-contain p-space-lg pb-space-2xl">
      <SectionCard title="当前资产" padding="default" className="min-h-0">
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

      <SectionCard
        title={isPipeline ? 'Pipeline 工作台' : '运行工作台'}
        padding="default"
        className="min-h-0"
      >
        <div className="space-y-space-md">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {isPipeline ? 'Pipeline Runtime' : '普通 Agent Runtime'}
              </p>
              <p className="mt-space-xs text-sm text-text-secondary">
                {runtimeSummary.lastRunAt
                  ? `最近一次运行：${formatTimestampDetailed(runtimeSummary.lastRunAt)}`
                  : isPipeline
                    ? '上传文档触发数据流处理，并在 Log / Output 中查看节点状态、END 输出与轻量结果页。'
                    : '从这里进入统一的 Run / Conversation / Log 工作台。'}
              </p>
            </div>
            <Badge
              variant={STATUS_VARIANT_MAP[runtimeSummary.status]}
              className="shrink-0"
            >
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
              <p className="text-text-tertiary">{isPipeline ? '节点事件' : '消息'}</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {runtimeSummary.messageCount}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">{isPipeline ? '输出' : '日志'}</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {isPipeline
                  ? pipelineSummary?.outputAvailable
                    ? pipelineSummary.resultPath
                      ? '可跳转'
                      : '可下载'
                    : '暂无'
                  : runtimeSummary.hasLogs
                    ? '可查看'
                    : '暂无'}
              </p>
            </div>
          </div>

          <div className="grid gap-space-sm">
            {isPipeline ? (
              <>
                <Button
                  onClick={() => onOpenRuntime(PipelineWorkbenchView.RUN)}
                >
                  <Play className="mr-space-xs h-4 w-4" />
                  上传并启动 Pipeline
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenRuntime(PipelineWorkbenchView.LOG)}
                  disabled={!runtimeSummary.hasLogs}
                >
                  查看数据流时间线
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenRuntime(PipelineWorkbenchView.OUTPUT)}
                  disabled={!pipelineSummary?.outputAvailable}
                >
                  <Database className="mr-space-xs h-4 w-4" />
                  查看结果 / END 输出
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={isPipeline ? '配置' : '交付入口'}
        padding="default"
        className="min-h-0"
      >
        <div className="grid gap-space-sm">
          {!isPipeline ? (
            <>
              <Button variant="outline" onClick={onOpenExplore}>
                <Compass className="mr-space-xs h-4 w-4" />
                Explore 会话
              </Button>
              <Button variant="outline" onClick={onOpenVersions}>
                <History className="mr-space-xs h-4 w-4" />
                发布
              </Button>
              <Button variant="outline" onClick={onOpenWebhook}>
                <Link2 className="mr-space-xs h-4 w-4" />
                Webhook
              </Button>
              <Button variant="outline" onClick={onOpenShare}>
                <Copy className="mr-space-xs h-4 w-4" />
                Share
              </Button>
            </>
          ) : null}
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings2 className="mr-space-xs h-4 w-4" />
            编辑基础设置
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="阶段路线" padding="default" className="min-h-0">
        <div className="space-y-space-sm text-sm text-text-secondary">
          <p className="flex items-start gap-space-xs">
            <Sparkles className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
            T1/T2/T3 已稳定的 operator registry、form-sheet 与目录化节点表单继续作为正式主路径。
          </p>
          <p className="flex items-start gap-space-xs">
            <GitBranch className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
            {isPipeline
              ? 'T6 已把 Pipeline 的运行 / 数据流时间线 / END 输出独立成专属 workbench，与 T4 普通 Agent runtime 边界清晰。'
              : 'T4 已把普通 Agent 的运行、测试和单步调试收敛；T6 已正式化 Pipeline run/log workbench；session 浏览仍留给后续阶段。'}
          </p>
          <Button variant="secondary" onClick={onOpenRoadmap}>
            查看阶段说明
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

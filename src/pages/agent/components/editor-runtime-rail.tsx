import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/patterns'
import { formatTimestampDetailed } from '@/lib/utils'
import {
  countFlowNodes,
  isPipelineFlow,
  resolveLocalizedText,
} from '@/lib/agent'
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
  Activity,
  Compass,
  Copy,
  Database,
  History,
  Link2,
  MessageSquareCode,
  Play,
  Settings2,
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
  onOpenVariables: () => void
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
  onOpenVariables,
}: EditorRuntimeRailProps) {
  const title = resolveLocalizedText(flow?.title, '未命名资产')
  const description = resolveLocalizedText(
    flow?.description,
    editorMode === 'pipeline'
      ? '上传文档、处理数据流，并查看节点输出。'
      : '编排对话、工具调用和交付入口。',
  )
  const nodeCount = countFlowNodes(flow)
  const edgeCount = flow?.dsl.graph?.edges.length || 0
  const pipelineSummary = isPipelineSummary(runtimeSummary)
    ? runtimeSummary
    : undefined
  const isPipeline = editorMode === 'pipeline'

  return (
    <div className="gap-space-lg p-space-lg pb-space-2xl grid h-full min-h-0 auto-rows-max overflow-y-auto overscroll-contain">
      <SectionCard title="当前资产" padding="default" className="min-h-0">
        <div className="space-y-space-md">
          <div>
            <p className="text-base font-semibold text-text-primary">{title}</p>
            <p className="mt-space-xs text-sm text-text-secondary">
              {description}
            </p>
          </div>
          <div className="gap-space-sm grid grid-cols-2 text-sm">
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
              <p className="mt-space-xs font-medium text-text-primary">
                {nodeCount}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">连线</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {edgeCount}
              </p>
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
          <div className="gap-space-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {isPipeline ? 'Pipeline 运行' : 'Agent 运行'}
              </p>
              <p className="mt-space-xs text-sm text-text-secondary">
                {runtimeSummary.status === AgentRuntimeStatus.RUNNING
                  ? '正在运行，可打开工作台查看实时进度。'
                  : runtimeSummary.lastRunAt
                    ? `最近一次运行：${formatTimestampDetailed(runtimeSummary.lastRunAt)}`
                    : isPipeline
                      ? '上传文档触发数据流处理，并在日志和输出中查看结果。'
                      : '从这里进入运行、会话和日志工作台。'}
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
            <div className="rounded-radius-md border-border-primary bg-surface-secondary px-space-sm py-space-xs text-status-error border text-xs">
              {runtimeSummary.lastError}
            </div>
          ) : null}

          <div className="gap-space-sm grid grid-cols-2 text-sm">
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">
                {isPipeline ? '节点事件' : '消息'}
              </p>
              <p className="mt-space-xs font-medium text-text-primary">
                {runtimeSummary.messageCount}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">
                {isPipeline ? '输出' : '日志'}
              </p>
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

          <div className="gap-space-sm grid">
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
                  onClick={() =>
                    onOpenRuntime(RuntimeWorkbenchView.CONVERSATION)
                  }
                >
                  继续会话
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
        title={isPipeline ? '配置' : '交付与调试'}
        padding="default"
        className="min-h-0"
      >
        <div className="gap-space-sm grid">
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
              <Button variant="outline" onClick={onOpenVariables}>
                <MessageSquareCode className="mr-space-xs h-4 w-4" />
                会话变量
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            className="bg-surface-secondary text-text-secondary hover:text-text-primary"
            onClick={onOpenSettings}
          >
            <Settings2 className="mr-space-xs h-4 w-4" />
            编辑基础设置
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="最近活动" padding="default" className="min-h-0">
        <div className="space-y-space-sm text-sm">
          <div className="gap-space-sm rounded-radius-lg bg-surface-secondary p-space-sm flex items-start">
            <Activity className="h-icon-sm w-icon-sm mt-[2px] shrink-0 text-text-accent" />
            <div className="min-w-0">
              <p className="font-medium text-text-primary">
                {runtimeSummary.lastRunAt ? '最近运行' : '等待首次运行'}
              </p>
              <p className="mt-space-2xs text-text-secondary">
                {runtimeSummary.lastRunAt
                  ? formatTimestampDetailed(runtimeSummary.lastRunAt)
                  : isPipeline
                    ? '上传文档后会生成运行日志和输出。'
                    : '运行后会生成会话消息和节点日志。'}
              </p>
            </div>
          </div>
          <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
            <p className="text-text-tertiary">保存状态</p>
            <p className="mt-space-xs font-medium text-text-primary">
              {autosaveLabel || '待首次保存'}
            </p>
          </div>
          {flow?.update_time ? (
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">更新时间</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {formatTimestampDetailed(flow.update_time)}
              </p>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
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

const STATUS_LABEL_MAP: Record<
  Exclude<AgentRuntimeStatus, AgentRuntimeStatus.STOPPED>,
  string
> = {
  [AgentRuntimeStatus.IDLE]: 'agent.runtime.idle',
  [AgentRuntimeStatus.PREPARING]: 'agent.runtime.preparing',
  [AgentRuntimeStatus.RUNNING]: 'agent.runtime.running',
  [AgentRuntimeStatus.SUCCESS]: 'agent.runtime.success',
  [AgentRuntimeStatus.ERROR]: 'agent.runtime.error',
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
  const { t } = useTranslation()
  const title = resolveLocalizedText(flow?.title, t('agent.unnamedAsset'))
  const description = resolveLocalizedText(
    flow?.description,
    editorMode === 'pipeline'
      ? t('agent.embedRail.pipelineDescription')
      : t('agent.embedRail.agentDescription'),
  )
  const nodeCount = countFlowNodes(flow)
  const edgeCount = flow?.dsl.graph?.edges.length || 0
  const pipelineSummary = isPipelineSummary(runtimeSummary)
    ? runtimeSummary
    : undefined
  const isPipeline = editorMode === 'pipeline'

  return (
    <div className="grid h-full min-h-0 auto-rows-max gap-space-lg overflow-y-auto overscroll-contain p-space-lg pb-space-2xl">
      <SectionCard
        title={t('agent.editorRuntimeRail.currentAsset')}
        padding="default"
        className="min-h-0"
      >
        <div className="space-y-space-md">
          <div>
            <p className="text-base font-semibold text-text-primary">{title}</p>
            <p className="mt-space-xs text-sm text-text-secondary">
              {description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-space-sm text-sm">
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">{t('agent.embedRail.type')}</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {isPipelineFlow(flow) ? t('agent.pipeline') : t('agent.agent')}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">
                {t('agent.editorRuntimeRail.autosave')}
              </p>
              <p className="mt-space-xs font-medium text-text-primary">
                {autosaveLabel || t('agent.editor.autosavePending')}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">{t('agent.embedRail.nodes')}</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {nodeCount}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">{t('agent.embedRail.edges')}</p>
              <p className="mt-space-xs font-medium text-text-primary">
                {edgeCount}
              </p>
            </div>
          </div>
          {flow?.update_time ? (
            <p className="text-xs text-text-tertiary">
              {t('agent.editorRuntimeRail.recentlyUpdatedAt', {
                time: formatTimestampDetailed(flow.update_time),
              })}
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title={t(
          isPipeline ? 'agent.pipelineWorkbench' : 'agent.runtimeWorkbench',
        )}
        padding="default"
        className="min-h-0"
      >
        <div className="space-y-space-md">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {t(
                  isPipeline
                    ? 'agent.embedRail.pipelineRun'
                    : 'agent.embedRail.agentRun',
                )}
              </p>
              <p className="mt-space-xs text-sm text-text-secondary">
                {runtimeSummary.status === AgentRuntimeStatus.RUNNING
                  ? t('agent.embedRail.runningDescription')
                  : runtimeSummary.lastRunAt
                    ? t('agent.embedRail.lastRunAt', {
                        time: formatTimestampDetailed(runtimeSummary.lastRunAt),
                      })
                    : isPipeline
                      ? t('agent.editorRuntimeRail.pipelineIdleDescription')
                      : t('agent.embedRail.agentIdleDescription')}
              </p>
            </div>
            <Badge
              variant={STATUS_VARIANT_MAP[runtimeSummary.status]}
              className="shrink-0"
            >
              {runtimeSummary.status === AgentRuntimeStatus.STOPPED
                ? t('agent.runtime.outputDetached')
                : t(STATUS_LABEL_MAP[runtimeSummary.status])}
            </Badge>
          </div>

          {runtimeSummary.lastError ? (
            <div className="rounded-radius-md border border-border-primary bg-surface-secondary px-space-sm py-space-xs text-xs text-status-error">
              {runtimeSummary.lastError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-space-sm text-sm">
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">
                {t(
                  isPipeline
                    ? 'agent.embedRail.nodeEvents'
                    : 'agent.runtime.messages',
                )}
              </p>
              <p className="mt-space-xs font-medium text-text-primary">
                {runtimeSummary.messageCount}
              </p>
            </div>
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">
                {t(isPipeline ? 'agent.runtime.output' : 'agent.runtime.logs')}
              </p>
              <p className="mt-space-xs font-medium text-text-primary">
                {isPipeline
                  ? pipelineSummary?.outputAvailable
                    ? pipelineSummary.resultPath
                      ? t('agent.embedRail.canOpen')
                      : t('agent.embedRail.canDownload')
                    : t('agent.embedRail.none')
                  : runtimeSummary.hasLogs
                    ? t('agent.embedRail.available')
                    : t('agent.embedRail.none')}
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
                  {t('agent.embedRail.uploadAndRunPipeline')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenRuntime(PipelineWorkbenchView.LOG)}
                  disabled={!runtimeSummary.hasLogs}
                >
                  {t('agent.embedRail.viewDataflowTimeline')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenRuntime(PipelineWorkbenchView.OUTPUT)}
                  disabled={!pipelineSummary?.outputAvailable}
                >
                  <Database className="mr-space-xs h-4 w-4" />
                  {t('agent.embedRail.viewResultOutput')}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => onOpenRuntime(RuntimeWorkbenchView.RUN)}>
                  <Play className="mr-space-xs h-4 w-4" />
                  {t('agent.embedRail.openWorkbench')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    onOpenRuntime(RuntimeWorkbenchView.CONVERSATION)
                  }
                >
                  {t('agent.embedRail.continueConversation')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenRuntime(RuntimeWorkbenchView.LOG)}
                  disabled={!runtimeSummary.hasLogs}
                >
                  {t('agent.embedRail.viewNodeLogs')}
                </Button>
              </>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t(
          isPipeline
            ? 'agent.embedRail.configTitle'
            : 'agent.embedRail.deliveryTitle',
        )}
        padding="default"
        className="min-h-0"
      >
        <div className="grid gap-space-sm">
          {!isPipeline ? (
            <>
              <Button variant="outline" onClick={onOpenExplore}>
                <Compass className="mr-space-xs h-4 w-4" />
                {t('agent.embedRail.explore')}
              </Button>
              <Button variant="outline" onClick={onOpenVersions}>
                <History className="mr-space-xs h-4 w-4" />
                {t('agent.embedRail.publish')}
              </Button>
              <Button variant="outline" onClick={onOpenWebhook}>
                <Link2 className="mr-space-xs h-4 w-4" />
                {t('agent.embedRail.webhook')}
              </Button>
              <Button variant="outline" onClick={onOpenShare}>
                <Copy className="mr-space-xs h-4 w-4" />
                {t('agent.editorRuntimeRail.share')}
              </Button>
              <Button variant="outline" onClick={onOpenVariables}>
                <MessageSquareCode className="mr-space-xs h-4 w-4" />
                {t('agent.embedRail.variables')}
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            className="bg-surface-secondary text-text-secondary hover:text-text-primary"
            onClick={onOpenSettings}
          >
            <Settings2 className="mr-space-xs h-4 w-4" />
            {t('agent.embedRail.settings')}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t('agent.editorRuntimeRail.recentActivity')}
        padding="default"
        className="min-h-0"
      >
        <div className="space-y-space-sm text-sm">
          <div className="flex items-start gap-space-sm rounded-radius-lg bg-surface-secondary p-space-sm">
            <Activity className="mt-[2px] h-icon-sm w-icon-sm shrink-0 text-text-accent" />
            <div className="min-w-0">
              <p className="font-medium text-text-primary">
                {t(
                  runtimeSummary.lastRunAt
                    ? 'agent.editorRuntimeRail.recentRun'
                    : 'agent.editorRuntimeRail.waitingFirstRun',
                )}
              </p>
              <p className="mt-space-2xs text-text-secondary">
                {runtimeSummary.lastRunAt
                  ? formatTimestampDetailed(runtimeSummary.lastRunAt)
                  : isPipeline
                    ? t('agent.editorRuntimeRail.pipelineActivityDescription')
                    : t('agent.editorRuntimeRail.agentActivityDescription')}
              </p>
            </div>
          </div>
          <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
            <p className="text-text-tertiary">
              {t('agent.editorRuntimeRail.saveStatus')}
            </p>
            <p className="mt-space-xs font-medium text-text-primary">
              {autosaveLabel || t('agent.editor.autosavePending')}
            </p>
          </div>
          {flow?.update_time ? (
            <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
              <p className="text-text-tertiary">
                {t('agent.center.updateTime')}
              </p>
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

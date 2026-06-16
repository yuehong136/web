import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns'
import { formatTimestampDetailed } from '@/lib/utils'
import {
  countFlowNodes,
  isPipelineFlow,
  resolveLocalizedText,
} from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import type { EmbedNavigateTarget } from './protocol'
import type { EmbedShowKey } from './use-embed-access'
import { EmbedHostActionsCard } from './embed-host-actions-card'
import { EmbedRuntimeCard } from './embed-runtime-card'
import type { EmbedRuntimeSummary } from './embed-runtime-rail-types'

interface EmbedRuntimeRailProps {
  flow?: AgentFlow
  editorMode: 'agent' | 'pipeline'
  show: ReadonlySet<EmbedShowKey>
  runtimeSummary: EmbedRuntimeSummary
  onOpenRuntime: (view?: string) => void
  onNavigateRequest: (target: EmbedNavigateTarget) => void
  onOpenVersions: () => void
  onOpenWebhook: () => void
  onOpenVariables: () => void
  onOpenSettings: () => void
}

export function EmbedRuntimeRail({
  flow,
  editorMode,
  show,
  runtimeSummary,
  onOpenRuntime,
  onNavigateRequest,
  onOpenVersions,
  onOpenWebhook,
  onOpenVariables,
  onOpenSettings,
}: EmbedRuntimeRailProps) {
  const { t } = useTranslation()
  const isPipeline = editorMode === 'pipeline'
  const title = resolveLocalizedText(
    flow?.title,
    t('agent.unnamedAsset', 'Untitled asset'),
  )
  const description = resolveLocalizedText(
    flow?.description,
    isPipeline
      ? t(
          'agent.embedRail.pipelineDescription',
          'Upload documents, process the dataflow, and inspect node output.',
        )
      : t(
          'agent.embedRail.agentDescription',
          'Orchestrate conversations, tool calls, and delivery actions.',
        ),
  )
  const showRuntime = show.has('run')
  const showExplore = !isPipeline && show.has('nav')
  const showPublish = !isPipeline && show.has('publish')
  const showWebhook = !isPipeline && show.has('webhook')
  const showVariables = !isPipeline && show.has('variables')
  const showSettings = show.has('settings')
  const hasHostActions =
    showExplore || showPublish || showWebhook || showVariables || showSettings
  const statusLabel = t(
    `agent.runtime.${runtimeSummary.status}`,
    runtimeSummary.status,
  )

  return (
    <div className="gap-space-lg p-space-lg pb-space-2xl grid h-full min-h-0 auto-rows-max overflow-y-auto overscroll-contain">
      <AssetSummaryCard
        flow={flow}
        title={title}
        description={description}
        statusLabel={statusLabel}
      />

      {showRuntime ? (
        <EmbedRuntimeCard
          editorMode={editorMode}
          runtimeSummary={runtimeSummary}
          statusLabel={statusLabel}
          onOpenRuntime={onOpenRuntime}
        />
      ) : null}

      {hasHostActions ? (
        <EmbedHostActionsCard
          isPipeline={isPipeline}
          showExplore={showExplore}
          showPublish={showPublish}
          showWebhook={showWebhook}
          showVariables={showVariables}
          showSettings={showSettings}
          onNavigateRequest={onNavigateRequest}
          onOpenVersions={onOpenVersions}
          onOpenWebhook={onOpenWebhook}
          onOpenVariables={onOpenVariables}
          onOpenSettings={onOpenSettings}
        />
      ) : null}

      {!showRuntime && !hasHostActions ? <HostManagedCard /> : null}
    </div>
  )
}

function AssetSummaryCard({
  flow,
  title,
  description,
  statusLabel,
}: {
  flow?: AgentFlow
  title: string
  description: string
  statusLabel: string
}) {
  const { t } = useTranslation()
  const nodeCount = countFlowNodes(flow)
  const edgeCount = flow?.dsl.graph?.edges.length || 0

  return (
    <SectionCard
      title={t('agent.embedRail.assetSummary', 'Asset summary')}
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
        <div className="gap-space-sm grid grid-cols-2 text-sm">
          <SummaryMetric
            label={t('agent.embedRail.type', 'Type')}
            value={
              isPipelineFlow(flow)
                ? t('agent.pipeline', 'Pipeline')
                : t('agent.agent', 'Agent')
            }
          />
          <SummaryMetric
            label={t('agent.embedRail.runtimeStatus', 'Runtime status')}
            value={statusLabel}
          />
          <SummaryMetric
            label={t('agent.embedRail.nodes', 'Nodes')}
            value={String(nodeCount)}
          />
          <SummaryMetric
            label={t('agent.embedRail.edges', 'Edges')}
            value={String(edgeCount)}
          />
        </div>
        {flow?.update_time ? (
          <p className="text-xs text-text-tertiary">
            {t('agent.embedRail.updatedAt', 'Updated: {{time}}', {
              time: formatTimestampDetailed(flow.update_time),
            })}
          </p>
        ) : null}
      </div>
    </SectionCard>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
      <p className="text-text-tertiary">{label}</p>
      <p className="mt-space-xs font-medium text-text-primary">{value}</p>
    </div>
  )
}

function HostManagedCard() {
  const { t } = useTranslation()

  return (
    <SectionCard
      title={t('agent.embedRail.hostManagedTitle', 'Host-managed surface')}
      padding="default"
      className="min-h-0"
    >
      <p className="text-sm text-text-secondary">
        {t(
          'agent.embedRail.hostManagedDescription',
          'This iframe only exposes the save action. Runtime and delivery actions stay hidden until the host enables them through the show parameter.',
        )}
      </p>
    </SectionCard>
  )
}

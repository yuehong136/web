import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/patterns'
import { formatTimestampDetailed } from '@/lib/utils'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
} from '../features/runtime-workbench'
import { PipelineWorkbenchView } from '../features/pipeline-workbench'
import { Database, Play } from 'lucide-react'
import {
  EMBED_STATUS_VARIANT_MAP,
  isPipelineSummary,
  type EmbedRuntimeSummary,
} from './embed-runtime-rail-types'

interface EmbedRuntimeCardProps {
  editorMode: 'agent' | 'pipeline'
  runtimeSummary: EmbedRuntimeSummary
  statusLabel: string
  onOpenRuntime: (view?: string) => void
}

export function EmbedRuntimeCard({
  editorMode,
  runtimeSummary,
  statusLabel,
  onOpenRuntime,
}: EmbedRuntimeCardProps) {
  const { t } = useTranslation()
  const isPipeline = editorMode === 'pipeline'
  const pipelineSummary = isPipelineSummary(runtimeSummary)
    ? runtimeSummary
    : undefined

  return (
    <SectionCard
      title={
        isPipeline
          ? t('agent.pipelineWorkbench', 'Pipeline Workbench')
          : t('agent.runtimeWorkbench', 'Runtime Workbench')
      }
      padding="default"
      className="min-h-0"
    >
      <div className="space-y-space-md">
        <div className="gap-space-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {isPipeline
                ? t('agent.embedRail.pipelineRun', 'Pipeline run')
                : t('agent.embedRail.agentRun', 'Agent run')}
            </p>
            <p className="mt-space-xs text-sm text-text-secondary">
              <RuntimeDescription
                isPipeline={isPipeline}
                runtimeSummary={runtimeSummary}
              />
            </p>
          </div>
          <Badge
            variant={EMBED_STATUS_VARIANT_MAP[runtimeSummary.status]}
            className="shrink-0"
          >
            {statusLabel}
          </Badge>
        </div>

        {runtimeSummary.lastError ? (
          <div className="rounded-radius-md border-border-primary bg-surface-secondary px-space-sm py-space-xs border text-xs text-status-error">
            {runtimeSummary.lastError}
          </div>
        ) : null}

        <div className="gap-space-sm grid grid-cols-2 text-sm">
          <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
            <p className="text-text-tertiary">
              {isPipeline
                ? t('agent.embedRail.nodeEvents', 'Node events')
                : t('agent.runtime.messages', 'Messages')}
            </p>
            <p className="mt-space-xs font-medium text-text-primary">
              {runtimeSummary.messageCount}
            </p>
          </div>
          <div className="rounded-radius-lg bg-surface-secondary p-space-sm">
            <p className="text-text-tertiary">
              {isPipeline
                ? t('agent.runtime.output', 'Output')
                : t('agent.runtime.logs', 'Logs')}
            </p>
            <p className="mt-space-xs font-medium text-text-primary">
              <RuntimeResultLabel
                isPipeline={isPipeline}
                runtimeSummary={runtimeSummary}
                outputAvailable={pipelineSummary?.outputAvailable}
                resultPath={pipelineSummary?.resultPath}
              />
            </p>
          </div>
        </div>

        <div className="gap-space-sm grid">
          {isPipeline ? (
            <PipelineRuntimeActions
              runtimeSummary={runtimeSummary}
              outputAvailable={pipelineSummary?.outputAvailable}
              onOpenRuntime={onOpenRuntime}
            />
          ) : (
            <AgentRuntimeActions
              runtimeSummary={runtimeSummary}
              onOpenRuntime={onOpenRuntime}
            />
          )}
        </div>
      </div>
    </SectionCard>
  )
}

function RuntimeDescription({
  isPipeline,
  runtimeSummary,
}: {
  isPipeline: boolean
  runtimeSummary: EmbedRuntimeSummary
}) {
  const { t } = useTranslation()

  if (runtimeSummary.status === AgentRuntimeStatus.RUNNING) {
    return t(
      'agent.embedRail.runningDescription',
      'Running. Open the workbench to inspect live progress.',
    )
  }

  if (runtimeSummary.lastRunAt) {
    return t('agent.embedRail.lastRunAt', 'Last run: {{time}}', {
      time: formatTimestampDetailed(runtimeSummary.lastRunAt),
    })
  }

  return isPipeline
    ? t(
        'agent.embedRail.pipelineIdleDescription',
        'Upload documents to trigger the dataflow and inspect outputs.',
      )
    : t(
        'agent.embedRail.agentIdleDescription',
        'Enter the runtime, conversation, and log workbench from here.',
      )
}

function RuntimeResultLabel({
  isPipeline,
  runtimeSummary,
  outputAvailable,
  resultPath,
}: {
  isPipeline: boolean
  runtimeSummary: EmbedRuntimeSummary
  outputAvailable?: boolean
  resultPath?: string
}) {
  const { t } = useTranslation()

  if (!isPipeline) {
    return runtimeSummary.hasLogs
      ? t('agent.embedRail.available', 'Available')
      : t('agent.embedRail.none', 'None')
  }

  if (!outputAvailable) {
    return t('agent.embedRail.none', 'None')
  }

  return resultPath
    ? t('agent.embedRail.canOpen', 'Can open')
    : t('agent.embedRail.canDownload', 'Can download')
}

function PipelineRuntimeActions({
  runtimeSummary,
  outputAvailable,
  onOpenRuntime,
}: {
  runtimeSummary: EmbedRuntimeSummary
  outputAvailable?: boolean
  onOpenRuntime: (view?: string) => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <Button onClick={() => onOpenRuntime(PipelineWorkbenchView.RUN)}>
        <Play className="mr-space-xs size-icon-sm" />
        {t('agent.embedRail.uploadAndRunPipeline', 'Upload and run Pipeline')}
      </Button>
      <Button
        variant="outline"
        onClick={() => onOpenRuntime(PipelineWorkbenchView.LOG)}
        disabled={!runtimeSummary.hasLogs}
      >
        {t('agent.embedRail.viewDataflowTimeline', 'View dataflow timeline')}
      </Button>
      <Button
        variant="outline"
        onClick={() => onOpenRuntime(PipelineWorkbenchView.OUTPUT)}
        disabled={!outputAvailable}
      >
        <Database className="mr-space-xs size-icon-sm" />
        {t('agent.embedRail.viewResultOutput', 'View result / END output')}
      </Button>
    </>
  )
}

function AgentRuntimeActions({
  runtimeSummary,
  onOpenRuntime,
}: {
  runtimeSummary: EmbedRuntimeSummary
  onOpenRuntime: (view?: string) => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <Button onClick={() => onOpenRuntime(RuntimeWorkbenchView.RUN)}>
        <Play className="mr-space-xs size-icon-sm" />
        {t('agent.embedRail.openWorkbench', 'Open workbench')}
      </Button>
      <Button
        variant="outline"
        onClick={() => onOpenRuntime(RuntimeWorkbenchView.CONVERSATION)}
      >
        {t('agent.embedRail.continueConversation', 'Continue conversation')}
      </Button>
      <Button
        variant="outline"
        onClick={() => onOpenRuntime(RuntimeWorkbenchView.LOG)}
        disabled={!runtimeSummary.hasLogs}
      >
        {t('agent.embedRail.viewNodeLogs', 'View node logs')}
      </Button>
    </>
  )
}

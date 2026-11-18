import { useTranslation } from 'react-i18next'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { StatusDot } from '@/components/studio/collection-identity'
import { Button } from '@/components/ui/button'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { resolveLocalizedText } from '@/lib/agent'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RotateCcw, X } from 'lucide-react'
import {
  RUNTIME_STATUS_LABEL,
  RUNTIME_STATUS_TONE,
} from '../../../components/runtime-status'
import { PipelineRuntimeStatus, type PipelineWorkbenchSummary } from '../types'

interface PipelineHeaderProps {
  /** The pipeline being run, for its avatar and name. */
  canvasId?: string
  summary: PipelineWorkbenchSummary
  onClose: () => void
  onReset: () => void
}

export function PipelineHeader({
  canvasId,
  summary,
  onClose,
  onReset,
}: PipelineHeaderProps) {
  const { t } = useTranslation()
  const { agent } = useFetchAgent(canvasId)
  const pipelineName = resolveLocalizedText(
    agent?.title,
    t('agent.unnamedAsset'),
  )
  return (
    <div className="border-b border-line px-space-md py-space-sm">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex min-w-0 items-start gap-space-sm">
          <EntityAvatar
            name={pipelineName}
            src={agent?.avatar}
            seed={canvasId}
            badge="workflow"
          />
          <div className="min-w-0 space-y-space-xs">
            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-space-2xs">
              <h2 className="text-base font-medium text-fg">
                {t('agent.pipelineRun.header.title')}
              </h2>
              <StatusDot
                tone={RUNTIME_STATUS_TONE[summary.status]}
                label={t(RUNTIME_STATUS_LABEL[summary.status])}
              />
            </div>
            <p className="text-sm text-fg-muted">
              {summary.lastRunAt
                ? t('agent.pipelineRun.header.lastRunAt', {
                    time: formatRelativeTime(summary.lastRunAt),
                  })
                : t('agent.pipelineRun.header.idleHint')}
            </p>
            {summary.uploadedFile ? (
              <p className="text-xs text-fg-subtle">
                {t('agent.runtime.runFile', {
                  name: String(
                    summary.uploadedFile.name ||
                      summary.uploadedFile.id ||
                      t('agent.runtime.unnamedDocument'),
                  ),
                })}
              </p>
            ) : null}
            {summary.lastError ? (
              <p
                className={cn(
                  'text-xs',
                  summary.status === PipelineRuntimeStatus.ERROR
                    ? 'text-danger-fg'
                    : 'text-fg-subtle',
                )}
              >
                {summary.lastError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-space-xs">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-fg-muted hover:text-fg"
            onClick={onReset}
            title={t('agent.pipelineRun.header.reset')}
            aria-label={t('agent.pipelineRun.header.reset')}
          >
            <RotateCcw className="size-icon-sm" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-fg-muted hover:text-fg"
            onClick={onClose}
            title={t('agent.pipelineRun.header.close')}
            aria-label={t('agent.pipelineRun.header.close')}
          >
            <X className="size-icon-sm" />
          </Button>
        </div>
      </div>
    </div>
  )
}

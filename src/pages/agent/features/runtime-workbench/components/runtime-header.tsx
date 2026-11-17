import { useTranslation } from 'react-i18next'
import { ExternalLink, Plus, RotateCcw, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { StatusDot } from '@/components/studio/collection-identity'
import { Button } from '@/components/ui/button'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { resolveLocalizedText } from '@/lib/agent'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type AgentRuntimeController,
  type RuntimeWorkbenchSummary,
} from '../types'
import { SessionPicker } from './session-picker'
import { AgentRunMode } from '../../../components/agent-run-mode'
import {
  RUNTIME_STATUS_LABEL,
  RUNTIME_STATUS_TONE,
} from '../../../components/runtime-status'

interface RuntimeHeaderProps {
  summary: RuntimeWorkbenchSummary
  controller: AgentRuntimeController
  onClose: () => void
  onReset: () => void
  onViewChange: (view: RuntimeWorkbenchView) => void
}

export function RuntimeHeader({
  summary,
  controller,
  onClose,
  onReset,
  onViewChange,
}: RuntimeHeaderProps) {
  const { t } = useTranslation()
  // Same query the editor already loaded: the run belongs to this agent.
  const { agent } = useFetchAgent(controller.canvasId)
  const agentName = resolveLocalizedText(agent?.title, t('agent.unnamedAsset'))
  const visibleSessionId = controller.viewingSessionId || summary.sessionId
  const visibleSessionName =
    controller.viewingSessionId &&
    controller.viewingSessionId !== summary.sessionId
      ? t('agent.runtimePanel.header.historySession')
      : summary.sessionName || t('agent.runtimePanel.header.liveUnnamed')

  return (
    <div className="border-b border-border-default px-space-md py-space-sm">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex min-w-0 items-start gap-space-sm">
          <EntityAvatar
            name={agentName}
            src={agent?.avatar}
            seed={controller.canvasId}
            badge="agent"
          />
          <div className="min-w-0 space-y-space-xs">
            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-space-2xs">
              <h2 className="text-base font-medium text-text-primary">
                {t('agent.runtimePanel.header.title')}
              </h2>
              <StatusDot
                tone={RUNTIME_STATUS_TONE[summary.status]}
                label={t(RUNTIME_STATUS_LABEL[summary.status])}
              />
            </div>
            <AgentRunMode mode={visibleSessionId ? 'session' : 'draft'} />
            <p className="text-sm text-text-secondary">
              {summary.lastRunAt
                ? t('agent.runtimePanel.header.lastRunAt', {
                    time: formatRelativeTime(summary.lastRunAt),
                  })
                : t('agent.runtimePanel.header.idleDescription')}
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
        </div>

        <div className="flex shrink-0 items-center gap-space-xs">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-text-secondary hover:text-text-primary"
            onClick={onReset}
            title={t('agent.runtimePanel.header.reset')}
            aria-label={t('agent.runtimePanel.header.reset')}
          >
            <RotateCcw className="size-icon-sm" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-text-secondary hover:text-text-primary"
            onClick={onClose}
            title={t('agent.runtimePanel.header.close')}
            aria-label={t('agent.runtimePanel.header.close')}
          >
            <X className="size-icon-sm" />
          </Button>
        </div>
      </div>

      <div className="mt-space-sm flex flex-wrap items-center justify-between gap-space-sm rounded-radius-md border border-border-subtle bg-background-subtle px-space-sm py-space-xs">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-text-primary">
            {t('agent.runtimePanel.header.currentSession', {
              name: visibleSessionName,
            })}
          </p>
          <p className="truncate font-mono text-xs text-text-tertiary">
            {visibleSessionId ||
              t('agent.runtimePanel.header.sessionIdPending')}
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
            <Plus className="size-icon-sm" />
            {t('agent.runtimePanel.header.newSession')}
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
                <ExternalLink className="size-icon-sm" />
                {t('agent.runtime.viewInExplore')}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { cn, formatTimestampCompact } from '@/lib/utils'
import {
  buildSessionErrorSummary,
  extractSessionTitle,
} from '@/pages/agent/adapters'
import type { AgentSession } from '@/types/agent'
import { AgentLogStatus } from '../types'
import { extractAgentLogStatus } from '../hooks/use-agent-log-list'

interface SessionListRowProps {
  session: AgentSession
  active?: boolean
  onSelect: (sessionId: string) => void
}

/** Status dots carry colour; the label beside them carries the meaning. */
const STATUS_DOT: Record<AgentLogStatus, string> = {
  [AgentLogStatus.ALL]: 'bg-text-tertiary',
  [AgentLogStatus.OK]: 'bg-status-success',
  [AgentLogStatus.ERR]: 'bg-status-error',
  [AgentLogStatus.RUN]: 'bg-status-info',
  [AgentLogStatus.WARN]: 'bg-status-warning',
}

function formatDuration(duration?: number): string {
  if (!duration) return '-'
  return duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`
}

export function SessionListRow({
  session,
  active = false,
  onSelect,
}: SessionListRowProps) {
  const { t } = useTranslation()
  const status = extractAgentLogStatus(session)
  const errorSummary = buildSessionErrorSummary(session)
  const updateTime = session.update_time
    ? formatTimestampCompact(session.update_time)
    : '-'

  return (
    <li className="border-b border-border-subtle">
      <button
        type="button"
        aria-current={active || undefined}
        className={cn(
          'flex w-full flex-col gap-space-xs px-space-md py-space-sm text-left outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-inset',
          active ? 'bg-state-selected-bg' : 'hover:bg-state-hover',
        )}
        onClick={() => onSelect(session.id)}
      >
        <span className="flex min-w-0 items-center gap-space-sm">
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 shrink-0 rounded-radius-full',
              STATUS_DOT[status],
            )}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
            {extractSessionTitle(session)}
          </span>
          <span
            className={cn(
              'shrink-0 text-xs',
              status === AgentLogStatus.ERR
                ? 'text-status-error'
                : 'text-text-tertiary',
            )}
          >
            {t(`agents.runLogs.statuses.${status}`)}
          </span>
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-space-sm gap-y-space-2xs pl-space-base text-xs text-text-tertiary tabular-nums">
          <span className="font-mono">{updateTime}</span>
          <span aria-hidden="true">·</span>
          <span>
            {t('agents.runLogs.rounds', {
              count: session.round ?? session.message_count ?? 0,
            })}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t('agents.runLogs.duration', {
              value: formatDuration(session.duration),
            })}
          </span>
        </span>
        {session.version_title ? (
          <span className="flex min-w-0 items-center gap-space-xs pl-space-base text-xs text-text-tertiary">
            <span className="shrink-0">{t('agents.runLogs.version')}</span>
            <span className="truncate font-mono">{session.version_title}</span>
          </span>
        ) : null}
        {errorSummary ? (
          <span className="ml-space-base flex min-w-0 items-center gap-space-xs rounded-radius-sm border border-status-error-border bg-status-error-subtle px-space-sm py-space-2xs text-xs text-status-error">
            <AlertTriangle
              className="size-icon-xs shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{errorSummary}</span>
          </span>
        ) : null}
      </button>
    </li>
  )
}

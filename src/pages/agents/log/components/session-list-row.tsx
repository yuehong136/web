import { AlertTriangle } from 'lucide-react'
import { cn, formatTimestampCompact } from '@/lib/utils'
import {
  buildSessionErrorSummary,
  extractSessionTitle,
} from '@/pages/agent/adapters'
import type { AgentSession } from '@/types/agent'
import { AGENT_LOG_STATUS_LABELS } from '../constants'
import { AgentLogStatus } from '../types'
import { extractAgentLogStatus } from '../hooks/use-agent-log-list'

interface SessionListRowProps {
  session: AgentSession
  active?: boolean
  onSelect: (sessionId: string) => void
}

const STATUS_TEXT_CLASSES: Record<AgentLogStatus, string> = {
  [AgentLogStatus.ALL]: 'text-text-tertiary',
  [AgentLogStatus.OK]: 'text-text-tertiary',
  [AgentLogStatus.ERR]:
    'border border-status-error bg-status-error-subtle px-space-xs py-[2px] text-status-error',
  [AgentLogStatus.RUN]: 'text-text-secondary',
  [AgentLogStatus.WARN]: 'text-status-warning',
}

const STATUS_DOT_CLASSES: Record<AgentLogStatus, string> = {
  [AgentLogStatus.ALL]: 'bg-text-caption',
  [AgentLogStatus.OK]: 'bg-status-success',
  [AgentLogStatus.ERR]: 'bg-status-error',
  [AgentLogStatus.RUN]: 'bg-status-info',
  [AgentLogStatus.WARN]: 'bg-status-warning',
}

function formatDuration(duration?: number): string {
  if (!duration) {
    return '-'
  }
  return duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`
}

export function SessionListRow({
  session,
  active = false,
  onSelect,
}: SessionListRowProps) {
  const status = extractAgentLogStatus(session)
  const errorSummary = buildSessionErrorSummary(session)
  const updateTime = session.update_time
    ? formatTimestampCompact(session.update_time)
    : '-'

  return (
    <div
      className={cn(
        'group/session relative border-b border-border-subtle',
        active && 'bg-status-info-subtle',
      )}
    >
      {active ? (
        <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-state-focus" />
      ) : null}
      <button
        type="button"
        className="gap-space-sm px-space-base py-space-base hover:bg-surface-secondary flex w-full flex-col text-left transition-colors"
        onClick={() => onSelect(session.id)}
      >
        <div className="gap-space-sm flex min-w-0 items-start">
          <span
            className={cn(
              'rounded-radius-full mt-[7px] h-1.5 w-1.5 shrink-0',
              STATUS_DOT_CLASSES[status],
            )}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
            {extractSessionTitle(session)}
          </span>
          <span
            className={cn(
              'gap-space-xs rounded-radius-full inline-flex shrink-0 items-center text-[11px] font-medium',
              STATUS_TEXT_CLASSES[status],
            )}
          >
            {AGENT_LOG_STATUS_LABELS[status]}
          </span>
        </div>

        <div className="gap-space-xs flex min-w-0 items-center text-xs text-text-tertiary">
          <span className="shrink-0 font-mono">{updateTime}</span>
          <span className="rounded-radius-full bg-text-caption h-[3px] w-[3px] shrink-0" />
          <span>{session.round ?? session.message_count ?? 0} 轮</span>
          <span className="rounded-radius-full bg-text-caption h-[3px] w-[3px] shrink-0" />
          <span>耗时 {formatDuration(session.duration)}</span>
        </div>

        {errorSummary ? (
          <div className="gap-space-xs rounded-radius-sm px-space-sm py-space-xs flex min-w-0 items-center border border-status-error bg-status-error-subtle text-xs text-status-error">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span className="truncate">{errorSummary}</span>
          </div>
        ) : null}
      </button>
    </div>
  )
}

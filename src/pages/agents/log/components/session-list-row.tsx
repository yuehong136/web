import { AlertTriangle, Clock, Copy, MessageSquare, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
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

const STATUS_CLASSES: Record<AgentLogStatus, string> = {
  [AgentLogStatus.ALL]:
    'bg-background-subtle text-text-secondary border-border-subtle',
  [AgentLogStatus.OK]:
    'bg-state-success-subtle text-state-success border-state-success',
  [AgentLogStatus.ERR]:
    'bg-state-error-subtle text-state-error border-state-error',
  [AgentLogStatus.RUN]:
    'bg-state-info-subtle text-state-info border-state-info',
  [AgentLogStatus.WARN]:
    'bg-state-warning-subtle text-state-warning border-state-warning',
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
  const shortId = session.id.slice(0, 8)

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    await navigator.clipboard?.writeText(session.id)
    toast.success('Session ID 已复制')
  }

  return (
    <div
      className={cn(
        'relative border-b border-border-subtle',
        active && 'bg-state-info-subtle',
      )}
    >
      {active ? (
        <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-state-focus" />
      ) : null}
      <button
        type="button"
        className="gap-space-xs px-space-base py-space-sm hover:bg-surface-secondary flex w-full flex-col text-left transition-colors"
        onClick={() => onSelect(session.id)}
      >
        <div className="gap-space-xs flex min-w-0 items-center">
          <span
            className={cn(
              'gap-space-xs rounded-radius-full px-space-xs inline-flex shrink-0 items-center border py-[2px] text-[11px] font-medium',
              STATUS_CLASSES[status],
            )}
          >
            <span className="rounded-radius-full h-1.5 w-1.5 bg-current" />
            {AGENT_LOG_STATUS_LABELS[status]}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
            {extractSessionTitle(session)}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="gap-space-xs flex min-w-0 items-center text-xs text-text-tertiary">
          <span className="font-mono">{shortId}</span>
          <span className="rounded-radius-full bg-text-caption h-[3px] w-[3px]" />
          <span>{session.source || '-'}</span>
          <span className="rounded-radius-full bg-text-caption h-[3px] w-[3px]" />
          <span>{String(session.user_id || session.exp_user_id || '-')}</span>
          <span className="rounded-radius-full bg-text-caption h-[3px] w-[3px]" />
          <span>
            {session.update_time
              ? formatTimestampCompact(session.update_time)
              : '-'}
          </span>
        </div>

        <div className="gap-space-md flex items-center text-xs text-text-tertiary">
          <span className="gap-space-xs inline-flex items-center">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(session.duration)}
          </span>
          <span className="gap-space-xs inline-flex items-center">
            <Zap className="h-3.5 w-3.5" />
            {session.tokens ?? 0}
          </span>
          <span className="gap-space-xs inline-flex items-center">
            <MessageSquare className="h-3.5 w-3.5" />
            {session.round ?? session.message_count ?? 0} 轮
          </span>
        </div>

        {errorSummary ? (
          <div className="gap-space-xs rounded-radius-sm px-space-sm py-space-xs flex min-w-0 items-center border border-state-error bg-state-error-subtle text-xs text-state-error">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{errorSummary}</span>
          </div>
        ) : null}
      </button>
    </div>
  )
}

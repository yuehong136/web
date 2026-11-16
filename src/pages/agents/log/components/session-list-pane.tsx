import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  Pager,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import type { AgentSession } from '@/types/agent'
import { extractAgentLogStatus } from '../hooks/use-agent-log-list'
import {
  AgentLogStatus,
  type AgentLogParamPatch,
  type AgentLogParams,
} from '../types'
import { SessionListRow } from './session-list-row'

const PAGE_SIZES = [12, 24, 48]

interface SessionListPaneProps {
  params: AgentLogParams
  /** The current server page, before status/source filters. */
  pageSessions: AgentSession[]
  sessions: AgentSession[]
  total: number
  isLoading: boolean
  isError: boolean
  isFiltered: boolean
  onChange: (patch: AgentLogParamPatch) => void
  onRetry: () => void
  onOpenExplore: () => void
}

/** Counts for the sessions on the current server page only. */
export function summarizeSessionPage(sessions: AgentSession[]) {
  const count = (status: AgentLogStatus) =>
    sessions.filter((session) => extractAgentLogStatus(session) === status)
      .length
  return {
    ok: count(AgentLogStatus.OK),
    err: count(AgentLogStatus.ERR),
    run: count(AgentLogStatus.RUN),
  }
}

export function SessionListPane({
  params,
  pageSessions,
  sessions,
  total,
  isLoading,
  isError,
  isFiltered,
  onChange,
  onRetry,
  onOpenExplore,
}: SessionListPaneProps) {
  const { t } = useTranslation()
  if (isLoading && pageSessions.length === 0)
    return (
      <PageLoadingState
        compact
        title={t('agents.runLogs.loadingTitle')}
        description={t('agents.runLogs.loadingDescription')}
      />
    )
  if (isError)
    return (
      <PageErrorState
        compact
        title={t('agents.runLogs.loadFailedTitle')}
        description={t('agents.runLogs.loadFailedDescription')}
        retryLabel={t('common.retry')}
        onRetry={onRetry}
      />
    )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        {sessions.length > 0 ? (
          <ul aria-label={t('agents.runLogs.sessions')}>
            {sessions.map((session) => (
              <SessionListRow
                key={session.id}
                session={session}
                active={session.id === params.sessionId}
                onSelect={(sessionId) => onChange({ sessionId })}
              />
            ))}
          </ul>
        ) : (
          <PageEmptyState
            compact
            title={t('agents.runLogs.emptyTitle')}
            description={t('agents.runLogs.emptyDescription')}
            action={
              <Button variant="outline" size="sm" onClick={onOpenExplore}>
                <ExternalLink className="size-icon-sm" aria-hidden="true" />
                {t('agents.runLogs.openExplore')}
              </Button>
            }
          />
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-space-2xs border-t border-border-subtle py-space-xs pr-space-sm pl-space-md text-xs text-text-tertiary">
        <p className="tabular-nums">
          {t('agents.runLogs.pageSummary', summarizeSessionPage(pageSessions))}
          {isFiltered ? ` · ${t('agents.runLogs.pageScope')}` : null}
        </p>
        <Pager
          className="self-end"
          page={params.page}
          pageSize={params.pageSize}
          total={total}
          onPageChange={(page) => onChange({ page })}
          pageSizeOptions={PAGE_SIZES}
          onPageSizeChange={(pageSize) => onChange({ pageSize, page: 1 })}
        />
      </div>
    </div>
  )
}

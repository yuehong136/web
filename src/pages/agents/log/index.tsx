import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, ExternalLink, RefreshCw } from 'lucide-react'
import { DetailTemplate } from '@/components/page-templates'
import { InlineStats, type InlineStat } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { isPipelineFlow } from '@/lib/agent'
import { formatTimestampDetailed } from '@/lib/utils'
import { useAgentLogExport } from './hooks/use-agent-log-export'
import { useAgentLogList } from './hooks/use-agent-log-list'
import { useCanvasPicker } from './hooks/use-canvas-picker'
import { LogEmptyState } from './components/log-empty-state'
import { LogToolbar } from './components/log-toolbar'
import { SessionDetailPane } from './components/session-detail-pane'
import { SessionListPane } from './components/session-list-pane'

export default function AgentLogsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logList = useAgentLogList()
  const canvasPicker = useCanvasPicker()
  const agentQuery = useFetchAgent(logList.params.canvas)
  const exportState = useAgentLogExport()
  const canvasId = logList.params.canvas
  const agent = agentQuery.agent

  const openExplorePath = canvasId
    ? `/agent/${canvasId}/explore${logList.params.sessionId ? `?session=${encodeURIComponent(logList.params.sessionId)}` : ''}`
    : '/agents'

  const handleExport = () => {
    if (!canvasId) return
    void exportState.handleExport({
      canvasId,
      agent,
      params: logList.params,
    })
  }

  // Sessions arrive newest first, so page 1 holds the latest one.
  const latest =
    logList.params.page === 1 ? logList.sessions[0]?.update_time : undefined
  const stats: InlineStat[] = agent
    ? [
        {
          key: 'kind',
          label: t('agents.runLogs.kind'),
          value: t(
            isPipelineFlow(agent) ? 'agents.kindPipeline' : 'agents.kindAgent',
          ),
        },
        ...(latest
          ? [
              {
                key: 'latest',
                label: t('agents.runLogs.latest'),
                value: formatTimestampDetailed(latest),
              },
            ]
          : []),
      ]
    : []

  return (
    <DetailTemplate
      title={t('agents.logs')}
      crumbs={[{ label: t('agents.center'), to: '/agents' }]}
      count={canvasId ? logList.total : undefined}
      countLabel={
        canvasId
          ? t('agents.runLogs.sessionCount', { count: logList.total })
          : undefined
      }
      subline={stats.length ? <InlineStats items={stats} /> : undefined}
      actions={
        canvasId ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('common.refresh')}
              onClick={() => {
                void logList.query.refetch()
                void agentQuery.refetch()
              }}
            >
              <RefreshCw className="size-icon-sm" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              loading={exportState.isExporting}
              onClick={handleExport}
            >
              <Download className="size-icon-sm" aria-hidden="true" />
              {t('common.export')}
            </Button>
            <Button variant="ghost" onClick={() => navigate(openExplorePath)}>
              <ExternalLink className="size-icon-sm" aria-hidden="true" />
              {t('agents.runLogs.openExplore')}
            </Button>
          </>
        ) : null
      }
      toolbar={
        <LogToolbar
          agent={agent}
          params={logList.params}
          onChange={logList.setParams}
        />
      }
      bodyScroll={canvasId ? 'none' : 'auto'}
    >
      {!canvasId ? (
        <LogEmptyState
          recentAgents={canvasPicker.recentAgents}
          onSelectAgent={(canvas) => logList.setParams({ canvas, page: 1 })}
        />
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
        >
          <ResizablePanel
            defaultSize="24%"
            minSize="18%"
            maxSize="36%"
            className="min-w-72"
          >
            <SessionListPane
              params={logList.params}
              pageSessions={logList.sessions}
              sessions={logList.filteredSessions}
              total={logList.total}
              isLoading={logList.query.isLoading}
              isError={logList.query.isError}
              isFiltered={logList.isStatusFiltered}
              onChange={logList.setParams}
              onRetry={() => {
                void logList.query.refetch()
              }}
              onOpenExplore={() => navigate(openExplorePath)}
            />
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border-subtle transition-colors hover:bg-border-strong" />
          <ResizablePanel defaultSize="76%" minSize="52%" className="min-w-0">
            <SessionDetailPane
              canvasId={canvasId}
              sessionId={logList.params.sessionId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </DetailTemplate>
  )
}

import { useNavigate } from 'react-router-dom'
import { ConsolePageTemplate } from '@/components/page-templates'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { useAgentLogExport } from './hooks/use-agent-log-export'
import { useAgentLogList } from './hooks/use-agent-log-list'
import { useCanvasPicker } from './hooks/use-canvas-picker'
import { LogEmptyState } from './components/log-empty-state'
import { LogPageHeader } from './components/log-page-header'
import { LogSummaryBand } from './components/log-summary-band'
import { LogToolbar } from './components/log-toolbar'
import { SessionDetailPane } from './components/session-detail-pane'
import { SessionListPane } from './components/session-list-pane'

export default function AgentLogsPage() {
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
    if (!canvasId) {
      return
    }
    void exportState.handleExport({
      canvasId,
      agent,
      params: logList.params,
    })
  }

  return (
    <ConsolePageTemplate
      header={
        <LogPageHeader
          agent={agent}
          sessionId={logList.params.sessionId}
          hasCanvas={Boolean(canvasId)}
          isExporting={exportState.isExporting}
          onRefresh={() => {
            void logList.query.refetch()
            void agentQuery.refetch()
          }}
          onExport={handleExport}
          onOpenExplore={() => navigate(openExplorePath)}
          onBack={() => navigate('/agents')}
        />
      }
      toolbar={
        <>
          <LogToolbar
            agent={agent}
            params={logList.params}
            onChange={logList.setParams}
          />
          <LogSummaryBand
            agent={agent}
            total={logList.total}
            filteredTotal={logList.filteredTotal}
            isFiltered={logList.isStatusFiltered}
            sessions={logList.sessions}
          />
        </>
      }
    >
      {!canvasId ? (
        <LogEmptyState
          recentAgents={canvasPicker.recentAgents}
          onSelectAgent={(canvas) => logList.setParams({ canvas, page: 1 })}
        />
      ) : (
        <div className="flex h-full min-h-0 bg-components-split-pane-bg">
          <div className="w-[360px] shrink-0 border-r border-components-split-pane-border">
            <SessionListPane
              params={logList.params}
              sessions={logList.filteredSessions}
              total={logList.total}
              filteredTotal={logList.filteredTotal}
              isLoading={logList.query.isLoading}
              isError={logList.query.isError}
              isFiltered={logList.isStatusFiltered}
              onChange={logList.setParams}
              onRetry={() => {
                void logList.query.refetch()
              }}
              onOpenExplore={() => navigate(openExplorePath)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <SessionDetailPane
              canvasId={canvasId}
              sessionId={logList.params.sessionId}
            />
          </div>
        </div>
      )}
    </ConsolePageTemplate>
  )
}

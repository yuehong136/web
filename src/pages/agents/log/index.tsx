import { useNavigate } from 'react-router-dom'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
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
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full min-h-0 bg-components-split-pane-bg"
        >
          <ResizablePanel
            defaultSize={16}
            minSize={12}
            maxSize={22}
            className="min-w-[280px] bg-components-console-surface"
          >
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
          </ResizablePanel>
          <ResizableHandle className="w-px bg-transparent transition-colors hover:bg-border-accent" />
          <ResizablePanel defaultSize={72} minSize={52} className="min-w-0">
            <SessionDetailPane
              canvasId={canvasId}
              sessionId={logList.params.sessionId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </ConsolePageTemplate>
  )
}

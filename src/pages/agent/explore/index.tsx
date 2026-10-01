import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SplitDetailPageTemplate } from '@/components/page-templates'
import { PageHeader } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { buildAgentCanvasPath, resolveLocalizedText } from '@/lib/agent'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { SessionRail } from './components/session-rail'
import { SessionChat } from './components/session-chat'
import { SessionDebugPanel } from './components/session-debug-panel'
import { useExploreSessions } from './hooks/use-explore-sessions'
import { useExploreSessionChat } from './hooks/use-explore-session-chat'
import { useExploreUrlParams } from './hooks/use-explore-url-params'
import { ExploreDebugTab } from './types'

export default function AgentExplorePage() {
  const navigate = useNavigate()
  const { canvasId, sessionId, isNew, setSessionId } = useExploreUrlParams()
  const agentQuery = useFetchAgent(canvasId)
  const [selectionRevision, setSelectionRevision] = useState(0)
  const [debugTab, setDebugTab] = useState<ExploreDebugTab>(
    ExploreDebugTab.SUMMARY,
  )

  const handleSelectSession = useCallback(
    (nextSessionId?: string, nextIsNew?: boolean) => {
      setSelectionRevision((revision) => revision + 1)
      setSessionId(nextSessionId, nextIsNew)
    },
    [setSessionId],
  )

  const sessions = useExploreSessions({
    canvasId,
    sessionId,
    isNew,
    onSelectSession: handleSelectSession,
  })

  const chat = useExploreSessionChat({
    canvasId,
    sessionId,
    isNew,
    selectionRevision,
    onSessionReady: (nextSessionId) => {
      sessions.clearTemporarySession()
      setSessionId(nextSessionId, false, true)
      void sessions.refetch()
    },
  })

  const active = Boolean(sessionId || isNew)
  const title = `${resolveLocalizedText(agentQuery.data?.title, 'Agent')} · Explore`

  return (
    <SplitDetailPageTemplate
      header={
        <PageHeader
          compact
          title={title}
          description="面向持久化会话的 Explore 工作台，可继续对话、管理会话并查看调试信息。"
          actions={
            <div className="gap-space-sm flex items-center">
              {sessionId ? (
                <Button asChild variant="outline">
                  <Link
                    to={`/agent/${canvasId}/explore?sessionId=${encodeURIComponent(sessionId)}`}
                  >
                    <ExternalLink className="size-4" />
                    当前链接
                  </Link>
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() =>
                  navigate(buildAgentCanvasPath(canvasId, agentQuery.data))
                }
              >
                <ArrowLeft className="size-4" />
                返回编辑器
              </Button>
            </div>
          }
        />
      }
      leftWidth={380}
      leftPane={
        <SessionRail
          sessions={sessions.sessions}
          params={sessions.params}
          total={sessions.total}
          selectedSessionId={sessionId}
          isNew={isNew}
          loading={sessions.isLoading}
          error={sessions.isError}
          deleting={sessions.deleting}
          onChangeParams={sessions.updateParams}
          onSelectSession={handleSelectSession}
          onCreateSession={sessions.handleCreateTemporarySession}
          onDeleteSession={sessions.handleDeleteSession}
          onRetry={sessions.refetch}
        />
      }
      rightPane={
        <div className="gap-space-lg p-space-lg grid h-full min-h-0 grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-radius-lg border-border-primary bg-surface-primary min-h-0 overflow-hidden border">
            <SessionChat
              key={`${canvasId}:${isNew ? 'new' : 'saved'}:${sessionId}:${selectionRevision}`}
              canvasId={canvasId}
              active={active}
              isTaskMode={chat.isTaskMode}
              loadingSession={chat.loadingSession}
              sessionError={chat.sessionError}
              onRetrySession={() => {
                void chat.sessionQuery.refetch()
              }}
              messages={chat.messages}
              status={chat.status}
              beginInputs={chat.beginInputs}
              parameterDialogOpen={chat.parameterDialogOpen}
              onParameterDialogOpenChange={chat.setParameterDialogOpen}
              onParametersOk={chat.handleParametersOk}
              onSubmitAwaitingInputs={chat.handleSubmitAwaitingInputs}
              onXCardAction={chat.handleXCardAction}
              onSend={chat.handleSendMessage}
              onStop={chat.handleStop}
            />
          </div>
          <div className="min-h-0 overflow-auto">
            <SessionDebugPanel
              canvasId={canvasId}
              sessionId={sessionId}
              session={chat.session}
              lastError={chat.lastError}
              currentTab={debugTab}
              onTabChange={setDebugTab}
            />
          </div>
        </div>
      }
    />
  )
}

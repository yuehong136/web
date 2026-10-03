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
import { AgentRunMode } from '../components/agent-run-mode'

export default function AgentExplorePage() {
  const navigate = useNavigate()
  const { canvasId, sessionId, isNew, newSessionMode, setSessionId } =
    useExploreUrlParams()
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
    newSessionMode,
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
            <div className="flex items-center gap-space-sm">
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
      leftWidth="clamp(280px, 26vw, 380px)"
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
        <div className="grid h-full min-h-0 grid-cols-1 gap-space-lg p-space-lg xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="border-border-primary bg-surface-primary flex min-h-0 flex-col overflow-hidden rounded-radius-lg border">
            <div className="border-border-primary border-b p-space-md">
              <AgentRunMode
                mode={isNew ? newSessionMode : 'session'}
                disabled={chat.loading}
                onChange={
                  isNew
                    ? (mode) => setSessionId(undefined, true, false, mode)
                    : undefined
                }
              />
            </div>
            <div className="min-h-0 flex-1">
              <SessionChat
                key={`${canvasId}:${isNew ? 'new' : 'saved'}:${sessionId}:${selectionRevision}`}
                canvasId={canvasId}
                active={active}
                isTaskMode={chat.isTaskMode}
                loadingSession={chat.loadingSession}
                sessionError={chat.sessionError}
                sourceError={chat.sourceError}
                runError={chat.lastError}
                onRetrySession={() => {
                  void chat.sessionQuery.refetch()
                  void chat.retrySource()
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

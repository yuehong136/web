import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { buildAgentCanvasPath, resolveLocalizedText } from '@/lib/agent'
import { ExploreWorkspace } from './components/explore-workspace'
import { SessionRail } from './components/session-rail'
import { SessionChat } from './components/session-chat'
import { SessionDebugPanel } from './components/session-debug-panel'
import { useExploreSessions } from './hooks/use-explore-sessions'
import { useExploreSessionChat } from './hooks/use-explore-session-chat'
import { useExploreUrlParams } from './hooks/use-explore-url-params'
import { ExploreDebugTab } from './types'
import { AgentRunMode } from '../components/agent-run-mode'

export default function AgentExplorePage() {
  const { t } = useTranslation()
  const { canvasId, sessionId, isNew, newSessionMode, setSessionId } =
    useExploreUrlParams()
  const agentQuery = useFetchAgent(canvasId)
  const [selectionRevision, setSelectionRevision] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [debugTab, setDebugTab] = useState<ExploreDebugTab>(
    ExploreDebugTab.SUMMARY,
  )

  const handleSelectSession = useCallback(
    (nextSessionId?: string, nextIsNew?: boolean) => {
      setSelectionRevision((revision) => revision + 1)
      setHistoryOpen(false)
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

  const agentName = resolveLocalizedText(
    agentQuery.data?.title,
    t('agent.unnamedAgent'),
  )
  const agentDescription = resolveLocalizedText(
    agentQuery.data?.description,
    '',
  )
  const active = Boolean(sessionId || isNew)
  const savedSessionId = isNew ? '' : sessionId

  return (
    <ExploreWorkspace
      agentName={agentName}
      agentDescription={agentDescription}
      avatar={agentQuery.data?.avatar}
      editorPath={buildAgentCanvasPath(canvasId, agentQuery.data)}
      onCreateSession={sessions.handleCreateTemporarySession}
      sessionId={savedSessionId}
      sessionName={isNew ? t('agent.explore.newChat') : chat.session?.name}
      status={chat.status}
      runModeLabel={t(
        `agent.runtime.mode.${isNew ? newSessionMode : 'session'}`,
      )}
      historyOpen={historyOpen}
      onHistoryOpenChange={setHistoryOpen}
      history={
        <SessionRail
          sessions={sessions.sessions}
          params={sessions.params}
          total={sessions.total}
          selectedSessionId={savedSessionId}
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
      runMode={
        active ? (
          <AgentRunMode
            mode={isNew ? newSessionMode : 'session'}
            disabled={chat.loading}
            onChange={
              isNew
                ? (mode) => setSessionId(undefined, true, false, mode)
                : undefined
            }
          />
        ) : undefined
      }
      details={
        <SessionDebugPanel
          canvasId={canvasId}
          sessionId={savedSessionId}
          session={chat.session}
          status={chat.status}
          lastError={chat.lastError}
          currentTab={debugTab}
          onTabChange={setDebugTab}
        />
      }
    >
      <SessionChat
        key={`${canvasId}:${isNew ? 'new' : 'saved'}:${sessionId}:${selectionRevision}`}
        canvasId={canvasId}
        agentName={agentName}
        agentDescription={agentDescription}
        active={active}
        isTaskMode={chat.isTaskMode}
        loadingSession={chat.loadingSession}
        sessionError={chat.sessionError}
        sourceError={chat.sourceError}
        runError={chat.lastError}
        onCreateSession={sessions.handleCreateTemporarySession}
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
    </ExploreWorkspace>
  )
}

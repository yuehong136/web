import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useDeleteAgentSession,
  useFetchAgentSessions,
} from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import type { AgentSession } from '@/types/agent'
import {
  createDefaultExploreSessionParams,
  createTemporaryExploreSession,
  selectNextSessionIdAfterDelete,
} from '../utils'
import type { ExploreSession, ExploreSessionListParams } from '../types'

export function useExploreSessions({
  canvasId,
  sessionId,
  isNew,
  onSelectSession,
}: {
  canvasId: string
  sessionId: string
  isNew: boolean
  onSelectSession: (sessionId?: string, isNew?: boolean) => void
}) {
  const { t } = useTranslation()
  const [params, setParams] = useState<ExploreSessionListParams>(
    createDefaultExploreSessionParams,
  )
  const sessionsQuery = useFetchAgentSessions(canvasId, params)
  const { deleteAgentSession, isLoading: deleting } =
    useDeleteAgentSession(canvasId)
  const [temporarySession, setTemporarySession] =
    useState<ExploreSession | null>(null)

  const sessions = useMemo(() => {
    const serverSessions = sessionsQuery.data.sessions
    if (!temporarySession || !isNew || sessionId) {
      return serverSessions
    }
    return [temporarySession, ...serverSessions]
  }, [isNew, sessionId, sessionsQuery.data.sessions, temporarySession])

  const updateParams = useCallback(
    (patch: Partial<ExploreSessionListParams>) => {
      setParams((previous) => ({
        ...previous,
        ...patch,
        page: patch.page ?? 1,
      }))
    },
    [],
  )

  const handleCreateTemporarySession = useCallback(() => {
    const nextSession = createTemporaryExploreSession()
    setTemporarySession(nextSession)
    onSelectSession(undefined, true)
  }, [onSelectSession])

  const clearTemporarySession = useCallback(() => {
    setTemporarySession(null)
  }, [])

  const handleDeleteSession = useCallback(
    async (target: AgentSession) => {
      if (!target.id) {
        return
      }

      if ((target as ExploreSession).isTemporary) {
        setTemporarySession(null)
        onSelectSession(undefined, false)
        return
      }

      try {
        await deleteAgentSession(target.id)
        const nextSessionId =
          sessionId === target.id
            ? selectNextSessionIdAfterDelete(
                sessionsQuery.data.sessions,
                target.id,
              )
            : sessionId

        onSelectSession(nextSessionId || undefined, false)
        void sessionsQuery.refetch()
        toast.success('会话已删除')
      } catch {
        toast.error(t('agent.runtime.deleteSessionFailed'))
      }
    },
    [deleteAgentSession, onSelectSession, sessionId, sessionsQuery, t],
  )

  return {
    sessions,
    params,
    total: sessionsQuery.data.total,
    isLoading: sessionsQuery.isLoading,
    isError: sessionsQuery.isError,
    error: sessionsQuery.error,
    deleting,
    updateParams,
    refetch: sessionsQuery.refetch,
    handleCreateTemporarySession,
    handleDeleteSession,
    clearTemporarySession,
  }
}

import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { AgentRunMode } from '@/types/agent'
import {
  buildExploreSessionSearchParams,
  resolveExploreSessionId,
} from '../utils'

export function useExploreUrlParams() {
  const { id: canvasId = '' } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const newSessionMode: AgentRunMode =
    searchParams.get('runMode') === 'published' ? 'published' : 'draft'

  const resolved = useMemo(
    () => resolveExploreSessionId(searchParams),
    [searchParams],
  )

  const setSessionId = useCallback(
    (
      sessionId?: string,
      isNew?: boolean,
      replace = false,
      mode = newSessionMode,
    ) => {
      const nextParams = buildExploreSessionSearchParams({
        sessionId,
        isNew,
        mode,
      })
      const queryString = nextParams.toString()
      navigate(
        `/agent/${canvasId}/explore${queryString ? `?${queryString}` : ''}`,
        { replace },
      )
    },
    [canvasId, navigate, newSessionMode],
  )

  useEffect(() => {
    if (
      resolved.legacySessionId &&
      searchParams.get('sessionId') !== resolved.legacySessionId
    ) {
      setSessionId(resolved.legacySessionId, resolved.isNew, true)
    }
  }, [resolved, searchParams, setSessionId])

  return {
    canvasId,
    sessionId: resolved.sessionId,
    isNew: resolved.isNew,
    newSessionMode,
    setSessionId,
  }
}

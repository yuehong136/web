import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFetchAgentSessions } from '@/hooks/use-agent-request'
import { extractSessionStatus } from '@/pages/agent/adapters'
import type { AgentSession } from '@/types/agent'
import { DEFAULT_AGENT_LOG_PAGE_SIZE } from '../constants'
import {
  AgentLogStatus,
  type AgentLogParamPatch,
  type AgentLogParams,
  type AgentLogServerParams,
} from '../types'

function readPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readStatus(value: string | null): AgentLogStatus {
  return Object.values(AgentLogStatus).includes(value as AgentLogStatus)
    ? (value as AgentLogStatus)
    : AgentLogStatus.ALL
}

export function readAgentLogParams(
  searchParams: URLSearchParams,
): AgentLogParams {
  return {
    canvas: searchParams.get('canvas') || undefined,
    sessionId: searchParams.get('sessionId') || undefined,
    status: readStatus(searchParams.get('status')),
    source: searchParams.get('source') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    user: searchParams.get('user') || undefined,
    keywords: searchParams.get('keywords') || undefined,
    page: readPositiveInteger(searchParams.get('page'), 1),
    pageSize: readPositiveInteger(
      searchParams.get('pageSize'),
      DEFAULT_AGENT_LOG_PAGE_SIZE,
    ),
  }
}

export function buildAgentSessionServerParams(
  params: AgentLogParams,
): AgentLogServerParams {
  return {
    page: params.page,
    page_size: params.pageSize,
    keywords: params.keywords || '',
    from_date: params.from || '',
    to_date: params.to || '',
    exp_user_id: params.user || '',
    orderby: 'update_time',
    desc: true,
  }
}

export function buildNextAgentLogSearchParams(
  current: URLSearchParams,
  patch: AgentLogParamPatch,
): URLSearchParams {
  const next = new URLSearchParams(current)
  const shouldResetPage = Object.keys(patch).some(
    (key) => key !== 'page' && key !== 'pageSize' && key !== 'sessionId',
  )

  Object.entries(patch).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === AgentLogStatus.ALL
    ) {
      next.delete(key)
      return
    }
    next.set(key, String(value))
  })

  if (patch.canvas !== undefined) {
    next.delete('sessionId')
  }
  if (shouldResetPage && patch.page === undefined) {
    next.set('page', '1')
  }

  return next
}

export function extractAgentLogStatus(session: AgentSession): AgentLogStatus {
  const rawStatus = String(
    session.status ?? session.runtime_status ?? session.state ?? '',
  ).toLowerCase()

  if (/(running|run|pending|processing)/.test(rawStatus)) {
    return AgentLogStatus.RUN
  }
  if (/(warn|warning|interrupted|unknown)/.test(rawStatus)) {
    return AgentLogStatus.WARN
  }
  if (/(error|failed|fail|err)/.test(rawStatus)) {
    return AgentLogStatus.ERR
  }
  if (/(success|succeed|done|completed|ok)/.test(rawStatus)) {
    return AgentLogStatus.OK
  }

  const adapterStatus = extractSessionStatus(session)
  if (adapterStatus === 'error') {
    return AgentLogStatus.ERR
  }
  if (adapterStatus === 'success') {
    return AgentLogStatus.OK
  }
  return AgentLogStatus.WARN
}

export function filterAgentLogSessions(
  sessions: AgentSession[],
  params: Pick<AgentLogParams, 'status' | 'source'>,
): AgentSession[] {
  return sessions.filter((session) => {
    const statusMatches =
      params.status === AgentLogStatus.ALL ||
      extractAgentLogStatus(session) === params.status
    const sourceMatches =
      !params.source ||
      params.source === 'all' ||
      session.source === params.source

    return statusMatches && sourceMatches
  })
}

export function useAgentLogList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => readAgentLogParams(searchParams), [searchParams])
  const serverParams = useMemo(
    () => buildAgentSessionServerParams(params),
    [params],
  )
  const query = useFetchAgentSessions(params.canvas, serverParams)
  const sessions = query.data.sessions
  const filteredSessions = useMemo(
    () => filterAgentLogSessions(sessions, params),
    [params, sessions],
  )

  const setParams = useCallback(
    (patch: AgentLogParamPatch) => {
      setSearchParams((current) =>
        buildNextAgentLogSearchParams(current, patch),
      )
    },
    [setSearchParams],
  )

  return {
    params,
    setParams,
    query,
    serverParams,
    sessions,
    filteredSessions,
    total: query.data.total,
    filteredTotal: filteredSessions.length,
    isStatusFiltered:
      params.status !== AgentLogStatus.ALL || Boolean(params.source),
  }
}

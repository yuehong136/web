import type {
  AgentSession,
  AgentSessionListResponse,
  AgentSessionMessage,
} from '@/types/agent'

export function adaptAgentSessionMessage(
  payload: AgentSessionMessage | undefined,
): AgentSessionMessage {
  if (!payload) {
    return {}
  }

  return {
    ...payload,
    id: payload.id || `${payload.role || 'message'}-${payload.create_time || payload.update_time || Date.now()}`,
  }
}

export function adaptAgentSession(
  payload: AgentSession | undefined,
): AgentSession {
  const messages = (payload?.messages || []).map(adaptAgentSessionMessage)
  return {
    ...payload,
    id: payload?.id || '',
    name: payload?.name || '未命名会话',
    message_count: payload?.message_count ?? messages.length,
    messages,
  }
}

export function adaptAgentSessionList(
  payload: AgentSessionListResponse | AgentSession[] | undefined,
): AgentSessionListResponse {
  if (Array.isArray(payload)) {
    const sessions = payload.map(adaptAgentSession)
    return {
      sessions,
      total: sessions.length,
    }
  }

  const sessions = (payload?.sessions || []).map(adaptAgentSession)
  return {
    sessions,
    total: payload?.total ?? sessions.length,
  }
}

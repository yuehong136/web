import type {
  AgentSession,
  AgentSessionListResponse,
  AgentSessionMessage,
  AgentTraceItem,
} from '@/types/agent'
import { extractTraceErrorMessage } from './trace'

export type AgentSessionRuntimeStatus = 'success' | 'error' | 'unknown'

export interface ExtractedSessionOutput {
  kind: 'text' | 'json'
  value: unknown
}

const SYNTHETIC_MESSAGE_ID_PATTERN = /^(user|assistant|system|message)-\d+/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeOutput(value: unknown): ExtractedSessionOutput | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'string') {
    return { kind: 'text', value }
  }

  return { kind: 'json', value }
}

function pickStructuredAnswer(record: Record<string, unknown>) {
  return (
    record._answer ??
    record.answer ??
    record.content ??
    record.output ??
    record.outputs
  )
}

function getSessionMessages(payload: AgentSession | undefined) {
  if (Array.isArray(payload?.messages)) {
    return payload.messages
  }

  const record = payload as Record<string, unknown> | undefined
  return Array.isArray(record?.message)
    ? (record.message as AgentSessionMessage[])
    : []
}

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
  const messages = getSessionMessages(payload).map(adaptAgentSessionMessage)
  const session = {
    ...payload,
    id: payload?.id || '',
    name: payload?.name || '未命名会话',
    message_count: payload?.message_count ?? messages.length,
    messages,
  }

  const latestMessageId = extractSessionLatestMessageId(session)
  const latestOutput = extractLatestSessionOutput(session)?.value

  return {
    ...session,
    latestMessageId,
    latestOutput,
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

export function extractSessionLatestMessageId(
  session: AgentSession | undefined,
): string | undefined {
  const messages = session?.messages || []

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role && message.role !== 'assistant') {
      continue
    }

    const id = message?.id
    if (!id || SYNTHETIC_MESSAGE_ID_PATTERN.test(id)) {
      continue
    }

    return id
  }

  return undefined
}

export function extractLatestSessionOutput(
  session: AgentSession | undefined,
): ExtractedSessionOutput | undefined {
  const messages = session?.messages || []

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role && message.role !== 'assistant') {
      continue
    }

    const contentOutput = normalizeOutput(message?.content)
    if (contentOutput) {
      return contentOutput
    }
  }

  const sessionRecord = session as Record<string, unknown> | undefined
  const outputs = isRecord(sessionRecord?.outputs)
    ? sessionRecord.outputs
    : isRecord(sessionRecord?.output)
      ? sessionRecord.output
      : undefined

  if (!outputs) {
    return undefined
  }

  return normalizeOutput(pickStructuredAnswer(outputs) ?? outputs)
}

export function extractSessionStatus(
  session: AgentSession | undefined,
): AgentSessionRuntimeStatus {
  if (typeof session?.errors === 'string' && session.errors.trim()) {
    return 'error'
  }

  if ((session?.messages || []).length > 0) {
    return 'success'
  }

  return 'unknown'
}

export function buildSessionErrorSummary(
  session: AgentSession | undefined,
  fallbackTrace?: AgentTraceItem[],
): string | undefined {
  if (typeof session?.errors === 'string' && session.errors.trim()) {
    return session.errors
  }

  return extractTraceErrorMessage(fallbackTrace)
}

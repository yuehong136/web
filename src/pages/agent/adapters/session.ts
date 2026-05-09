import type {
  AgentSession,
  AgentSessionListResponse,
  AgentSessionMessage,
  AgentTraceItem,
} from '@/types/agent'
import type { TraceRuntimeEvent } from './trace'
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

function parseSessionDsl(
  session: AgentSession | undefined,
): Record<string, unknown> | undefined {
  const dsl = (session as Record<string, unknown> | undefined)?.dsl
  if (!dsl) {
    return undefined
  }

  if (typeof dsl === 'string') {
    try {
      return JSON.parse(dsl) as Record<string, unknown>
    } catch {
      return undefined
    }
  }

  return isRecord(dsl) ? dsl : undefined
}

function unwrapOutputValue(value: unknown): unknown {
  if (isRecord(value) && 'value' in value) {
    return value.value
  }

  if (isRecord(value) && typeof value.type === 'string') {
    return undefined
  }

  return value
}

function unwrapComponentOutputs(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {}
  }

  const outputs: Record<string, unknown> = {}

  Object.entries(value).forEach(([key, output]) => {
    outputs[key] = unwrapOutputValue(output)
  })

  return outputs
}

function unwrapComponentInputs(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const inputs: Record<string, unknown> = {}

  Object.entries(value).forEach(([key, input]) => {
    const normalizedInput = unwrapOutputValue(input)
    if (
      normalizedInput !== undefined &&
      normalizedInput !== null &&
      normalizedInput !== ''
    ) {
      inputs[key] = normalizedInput
    }
  })

  return Object.keys(inputs).length > 0 ? inputs : undefined
}

function compactVisibleOutputs(
  outputs: Record<string, unknown>,
): Record<string, unknown> {
  const visibleOutputs: Record<string, unknown> = {}

  Object.entries(outputs).forEach(([key, output]) => {
    if (key.startsWith('_')) {
      return
    }

    if (output === undefined || output === null || output === '') {
      return
    }

    if (Array.isArray(output) && output.length === 0) {
      return
    }

    if (isRecord(output) && Object.keys(output).length === 0) {
      return
    }

    visibleOutputs[key] = output
  })

  return visibleOutputs
}

function normalizeDslPath(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (Array.isArray(item)) {
      return item.filter(
        (nodeId): nodeId is string => typeof nodeId === 'string',
      )
    }

    return typeof item === 'string' ? [item] : []
  })
}

function getLatestUserContent(session: AgentSession | undefined) {
  const messages = session?.messages || []

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== 'user') {
      continue
    }

    return typeof message.content === 'string' ? message.content : undefined
  }

  return undefined
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
    id:
      payload.id ||
      `${payload.role || 'message'}-${payload.create_time || payload.update_time || Date.now()}`,
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

export function extractSessionRuntimeEvents(
  session: AgentSession | undefined,
): TraceRuntimeEvent[] {
  const dsl = parseSessionDsl(session)
  const components = isRecord(dsl?.components) ? dsl.components : undefined
  if (!components) {
    return []
  }

  const path = normalizeDslPath(dsl?.path)
  if (path.length === 0) {
    return []
  }

  const latestUserContent = getLatestUserContent(session)
  const events: TraceRuntimeEvent[] = []

  path.forEach((componentId) => {
    const component = components[componentId]
    if (!isRecord(component)) {
      return
    }

    const obj = isRecord(component.obj) ? component.obj : undefined
    const params = isRecord(obj?.params) ? obj.params : undefined
    const inputs =
      unwrapComponentInputs(params?.inputs) ||
      (componentId === 'begin' && latestUserContent
        ? { query: latestUserContent }
        : undefined)
    const outputs = unwrapComponentOutputs(params?.outputs)

    if (!obj) {
      return
    }

    const componentName =
      typeof obj.component_name === 'string' ? obj.component_name : componentId
    const error =
      typeof outputs._ERROR === 'string' ? outputs._ERROR : undefined
    const elapsedTime =
      typeof outputs._elapsed_time === 'number'
        ? outputs._elapsed_time
        : undefined

    events.push({
      event: 'node_finished',
      data: {
        component_id: componentId,
        component_name: componentName,
        component_type: componentName,
        inputs,
        outputs: compactVisibleOutputs(outputs),
        error,
        elapsed_time: elapsedTime,
      },
      raw: component,
    })
  })

  return events
}

export function extractSessionTitle(
  session: AgentSession | undefined,
  fallback = '未命名会话',
): string {
  if (session?.name?.trim()) {
    return session.name
  }

  const firstUserMessage = (session?.messages || []).find(
    (message) => message.role === 'user',
  )
  const content = firstUserMessage?.content

  return typeof content === 'string' && content.trim()
    ? content.trim()
    : fallback
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

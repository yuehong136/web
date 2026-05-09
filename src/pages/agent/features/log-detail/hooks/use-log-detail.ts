import { useMemo } from 'react'
import {
  useFetchAgentSession,
  useFetchMessageTrace,
} from '@/hooks/use-agent-request'
import {
  buildSessionErrorSummary,
  extractLatestSessionOutput,
  extractSessionRuntimeEvents,
  extractSessionLatestMessageId,
  extractSessionStatus,
} from '@/pages/agent/adapters/session'
import { buildTraceRunViewModel } from '@/pages/agent/adapters/trace'
import {
  AgentRuntimeStatus,
  type RuntimeMessage,
} from '../../runtime-workbench/types'
import type {
  AgentSession,
  AgentSessionMessage,
  AgentTraceItem,
} from '@/types/agent'
import type { BeginQuery } from '../../../types'
import type { LogDetailSource, LogDetailViewModel } from '../types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toBeginInputs(value: unknown): BeginQuery[] {
  if (!isRecord(value)) {
    return []
  }

  return Object.entries(value).map(([key, field]) => {
    const record = isRecord(field) ? field : { value: field }
    return {
      key,
      type: typeof record.type === 'string' ? record.type : 'line',
      value: String(record.value ?? ''),
      optional: Boolean(record.optional),
      name:
        typeof record.name === 'string'
          ? record.name
          : typeof record.label === 'string'
            ? record.label
            : key,
      label: typeof record.label === 'string' ? record.label : undefined,
      required: Boolean(record.required),
      options: Array.isArray(record.options)
        ? (record.options as BeginQuery['options'])
        : undefined,
    }
  })
}

function latestAssistantMessage(messages: RuntimeMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role === 'assistant') {
      return message
    }
  }

  return undefined
}

function mapRuntimeMessage(message: RuntimeMessage): AgentSessionMessage {
  return {
    id: message.messageId || message.id,
    role: message.role,
    content: message.content,
    files: message.files,
    reference: message.reference,
    error: message.error,
    taskId: message.taskId,
  }
}

function mapRuntimeStatus(
  status: AgentRuntimeStatus,
): LogDetailViewModel['status'] {
  if (
    status === AgentRuntimeStatus.RUNNING ||
    status === AgentRuntimeStatus.PREPARING
  ) {
    return 'running'
  }
  if (status === AgentRuntimeStatus.SUCCESS) {
    return 'success'
  }
  if (
    status === AgentRuntimeStatus.ERROR ||
    status === AgentRuntimeStatus.STOPPED
  ) {
    return 'error'
  }
  if (status === AgentRuntimeStatus.IDLE) {
    return 'idle'
  }

  return 'unknown'
}

function isTerminalStatus(status: LogDetailViewModel['status']) {
  return status === 'success' || status === 'error'
}

export function buildLiveLogDetailViewModel(params: {
  controllerStatus: AgentRuntimeStatus
  controllerCanvasId?: string
  controllerSessionId?: string
  controllerSessionName?: string
  beginInputs: BeginQuery[]
  messages: RuntimeMessage[]
  runtimeEvents?: RuntimeMessage['logEvents']
  currentMessageId?: string
  traceItems: AgentTraceItem[]
  traceLoading?: boolean
  lastError?: string
}): LogDetailViewModel {
  const latestAssistant = latestAssistantMessage(params.messages)
  const status = mapRuntimeStatus(params.controllerStatus)
  const terminal = isTerminalStatus(status)
  const messageId = params.currentMessageId || latestAssistant?.messageId

  return {
    sessionId: params.controllerSessionId,
    sessionName: params.controllerSessionName,
    status,
    errorMessage: params.lastError || latestAssistant?.error,
    inputs: params.beginInputs,
    files: params.messages.flatMap((message) => message.files || []),
    latestOutput: latestAssistant?.content
      ? { kind: 'text', value: latestAssistant.content }
      : undefined,
    transcript: params.messages.map(mapRuntimeMessage),
    traceItems: terminal ? params.traceItems : [],
    traceRun: buildTraceRunViewModel({
      canvasId: params.controllerCanvasId,
      sessionId: params.controllerSessionId,
      messageId,
      traceItems: terminal ? params.traceItems : [],
      runtimeEvents: params.runtimeEvents?.map((event) => ({
        event: event.event,
        data: event.data,
      })),
      raw: {
        messages: params.messages,
        traceItems: terminal ? params.traceItems : [],
      },
    }),
    traceUnavailableReason:
      terminal && !messageId
        ? 'no-message-id'
        : terminal && params.traceLoading
          ? 'fetching'
          : terminal && params.traceItems.length === 0
            ? 'redis-evicted'
            : undefined,
    canRetry: true,
  }
}

export function buildSessionLogDetailViewModel(params: {
  session?: AgentSession
  canvasId?: string
  traceItems: AgentTraceItem[]
  traceLoading?: boolean
  latestMessageId?: string
  traceError?: unknown
}): LogDetailViewModel {
  const session = params.session
  const status = session ? extractSessionStatus(session) : 'unknown'
  const source =
    typeof session?.source === 'string' && session.source.trim()
      ? session.source
      : undefined
  const latestOutput = extractLatestSessionOutput(session)
  const errorMessage = buildSessionErrorSummary(session, params.traceItems)
  const inputs = toBeginInputs(
    (session as Record<string, unknown> | undefined)?.inputs,
  )
  const runtimeEvents = extractSessionRuntimeEvents(session)

  return {
    sessionId: session?.id,
    sessionName: session?.name,
    source,
    status,
    errorMessage,
    inputs,
    files: [],
    latestOutput,
    transcript: session?.messages || [],
    traceItems: params.traceItems,
    traceRun: buildTraceRunViewModel({
      canvasId: params.canvasId,
      sessionId: session?.id,
      messageId: params.latestMessageId,
      traceItems: params.traceItems,
      runtimeEvents,
      queryError: params.traceError,
      raw: {
        session,
        traceItems: params.traceItems,
        runtimeEvents,
      },
    }),
    traceUnavailableReason: !params.latestMessageId
      ? 'no-message-id'
      : params.traceLoading
        ? 'fetching'
        : params.traceItems.length === 0
          ? 'redis-evicted'
          : undefined,
    canRetry: false,
    rawSession: session,
  }
}

export function useLogDetail(source: LogDetailSource) {
  const sessionQuery = useFetchAgentSession(
    source.mode === 'session' ? source.canvasId : undefined,
    source.mode === 'session' ? source.sessionId : undefined,
  )

  const liveStatus =
    source.mode === 'live' ? mapRuntimeStatus(source.controller.status) : 'idle'
  const liveTerminal = source.mode === 'live' && isTerminalStatus(liveStatus)
  const liveMessageId =
    source.mode === 'live'
      ? source.controller.currentMessageId ||
        latestAssistantMessage(source.controller.messages)?.messageId
      : undefined
  const sessionLatestMessageId =
    source.mode === 'session'
      ? extractSessionLatestMessageId(sessionQuery.data)
      : undefined

  const traceQuery = useFetchMessageTrace(
    source.mode === 'live'
      ? liveTerminal
        ? source.controller.canvasId
        : undefined
      : source.canvasId,
    source.mode === 'live'
      ? liveTerminal
        ? liveMessageId
        : undefined
      : sessionLatestMessageId,
  )

  const viewModel = useMemo(() => {
    if (source.mode === 'live') {
      return buildLiveLogDetailViewModel({
        controllerStatus: source.controller.status,
        controllerCanvasId: source.controller.canvasId,
        controllerSessionId: source.controller.sessionId,
        controllerSessionName: source.controller.summary.sessionName,
        beginInputs: source.controller.beginInputs,
        messages: source.controller.messages,
        runtimeEvents: source.controller.logEvents,
        currentMessageId: liveMessageId,
        traceItems: traceQuery.data,
        traceLoading: traceQuery.isLoading,
        lastError: source.controller.lastError,
      })
    }

    return buildSessionLogDetailViewModel({
      session: sessionQuery.data,
      canvasId: source.canvasId,
      traceItems: traceQuery.data,
      traceLoading: traceQuery.isLoading,
      latestMessageId: sessionLatestMessageId,
      traceError: traceQuery.isError ? traceQuery.error : undefined,
    })
  }, [
    liveMessageId,
    sessionLatestMessageId,
    sessionQuery.data,
    source,
    traceQuery.data,
    traceQuery.error,
    traceQuery.isError,
    traceQuery.isLoading,
  ])

  return {
    viewModel,
    isLoading:
      source.mode === 'session' ? sessionQuery.isLoading : traceQuery.isLoading,
    isError:
      source.mode === 'session' ? sessionQuery.isError : traceQuery.isError,
    error: source.mode === 'session' ? sessionQuery.error : traceQuery.error,
    isTraceLoading: traceQuery.isLoading,
    isTraceError: traceQuery.isError,
    traceError: traceQuery.error,
    refetchTrace: traceQuery.refetch,
  }
}

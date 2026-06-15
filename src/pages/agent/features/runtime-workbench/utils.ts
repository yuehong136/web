import {
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  type StreamingAnswerChunkResult,
  type StreamingAnswerState,
} from '@/utils/streaming-answer'
import type { BeginQuery } from '../../types'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type RuntimeAttachment,
  type RuntimeWorkbenchSummary,
} from './types'
import type { INodeData } from '../../hooks/use-node-loading'
import {
  coerceBeginInputOrder,
  getOrderedBeginInputEntries,
} from '../../utils/begin-input-order'
import {
  XCardStatus,
  normalizeA2UICommandEventData,
  type AgentXCardCommand,
} from '../../x-card'

interface RuntimeEventRecord {
  event: string
  message_id?: string
  task_id?: string
  session_id?: string
  data?: unknown
  code?: number
  retcode?: number
  message?: string
  retmsg?: string
}

export interface NormalizedRuntimeEvent {
  event: string
  messageId?: string
  taskId?: string
  sessionId?: string
  data?: unknown
  errorMessage?: string
  outputContent?: string
  xCardCommands?: AgentXCardCommand[]
  xCardSurfaceIds?: string[]
  xCardStatus?: XCardStatus
  logEvent?: {
    event: string
    message_id: string
    task_id?: string
    data: INodeData
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const A2UI_COMMAND_KEYS = new Set([
  'createSurface',
  'updateComponents',
  'updateDataModel',
  'deleteSurface',
])

const isA2UICommandRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  if (!isRecord(value) || value.version !== 'v0.9') {
    return false
  }

  return Object.keys(value).some((key) => A2UI_COMMAND_KEYS.has(key))
}

const parseJsonSafely = (content: string): unknown => {
  try {
    return JSON.parse(content)
  } catch {
    return undefined
  }
}

export const isRawA2UICommandContent = (content: string) => {
  const trimmed = content.trim()
  if (!trimmed) {
    return false
  }

  const parsed = parseJsonSafely(trimmed)
  if (Array.isArray(parsed)) {
    return parsed.length > 0 && parsed.every(isA2UICommandRecord)
  }

  if (isA2UICommandRecord(parsed)) {
    return true
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    lines.length > 1 &&
    lines.every((line) => isA2UICommandRecord(parseJsonSafely(line)))
  )
}

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

export const hideRawA2UICommandContent = (content: string) =>
  isRawA2UICommandContent(content) ? '' : content

const normalizeEventData = (payload: RuntimeEventRecord): unknown => {
  if (
    isRecord(payload.data) &&
    isRecord(payload.data.data) &&
    !('component_id' in payload.data) &&
    !('content' in payload.data) &&
    !('outputs' in payload.data)
  ) {
    return payload.data.data
  }

  return payload.data
}

const extractRuntimeOutputContent = (data: unknown): string | undefined => {
  if (!isRecord(data)) {
    return undefined
  }

  const outputs = data.outputs
  const content = !isRecord(outputs)
    ? firstString(data.content, data.answer)
    : firstString(
        outputs.content,
        outputs.answer,
        outputs._answer,
        outputs.result,
        isRecord(outputs.output) ? outputs.output.content : undefined,
      )

  if (!content) {
    return undefined
  }

  return content
}

const toDisplayValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayValue(item))
      .filter(Boolean)
      .join(', ')
  }

  if (isRecord(value)) {
    const fileName = value.name || value.filename || value.id
    if (typeof fileName === 'string') {
      return fileName
    }

    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
}

export function buildRuntimeInputObject(
  values: BeginQuery[] = [],
): Record<string, Omit<BeginQuery, 'key'>> {
  return values.reduce<Record<string, Omit<BeginQuery, 'key'>>>(
    (result, item, index) => {
      if (!item.key) {
        return result
      }

      const { key, ...rest } = item
      result[key] = {
        ...rest,
        order: coerceBeginInputOrder(rest.order) ?? index,
      }
      return result
    },
    {},
  )
}

export function formatRuntimeInputSummary(values: BeginQuery[] = []) {
  return values
    .filter((item) => item.key)
    .map((item) => `${item.name ?? item.key}: ${toDisplayValue(item.value)}`)
    .join('\n')
}

export function normalizeRuntimeAttachments(
  value: unknown,
): RuntimeAttachment[] {
  const list = Array.isArray(value) ? value : value ? [value] : []

  return list.reduce<RuntimeAttachment[]>((result, item) => {
    if (!isRecord(item)) {
      return result
    }

    const name = item.name || item.filename || item.file_name || item.id

    if (typeof name !== 'string') {
      return result
    }

    result.push({
      ...item,
      name,
      type:
        typeof item.type === 'string'
          ? item.type
          : typeof item.extension === 'string'
            ? item.extension
            : typeof item.format === 'string'
              ? item.format
              : undefined,
      mimeType:
        typeof item.mime_type === 'string'
          ? item.mime_type
          : typeof item.mimeType === 'string'
            ? item.mimeType
            : undefined,
      size: typeof item.size === 'number' ? item.size : undefined,
      url:
        typeof item.preview_url === 'string'
          ? item.preview_url
          : typeof item.url === 'string'
            ? item.url
            : undefined,
    })
    return result
  }, [])
}

export function normalizeRuntimeAwaitingInputs(value: unknown): BeginQuery[] {
  if (!isRecord(value)) {
    return []
  }

  return getOrderedBeginInputEntries(value as Record<string, BeginQuery>).map(
    ([key, field]) => ({
      key,
      ...(isRecord(field) ? field : {}),
    }),
  ) as BeginQuery[]
}

export function normalizeRuntimeEvent(raw: unknown): NormalizedRuntimeEvent {
  if (!isRecord(raw)) {
    return { event: '' }
  }

  const payload = raw as unknown as RuntimeEventRecord
  const data = normalizeEventData(payload)
  const code =
    typeof payload.retcode === 'number'
      ? payload.retcode
      : typeof payload.code === 'number'
        ? payload.code
        : 0

  const errorMessage =
    code !== 0 ? payload.retmsg || payload.message || 'Run failed' : undefined

  const logEvent =
    payload.event &&
    payload.event !== 'a2ui_command' &&
    payload.message_id &&
    isRecord(data)
      ? {
          event: payload.event,
          message_id: payload.message_id,
          task_id: payload.task_id,
          data: data as INodeData,
        }
      : undefined

  const a2ui =
    payload.event === 'a2ui_command'
      ? normalizeA2UICommandEventData(data)
      : undefined

  return {
    event: typeof payload.event === 'string' ? payload.event : '',
    messageId: payload.message_id,
    taskId: payload.task_id,
    sessionId:
      payload.session_id ||
      (isRecord(data) && typeof data.session_id === 'string'
        ? data.session_id
        : undefined),
    data,
    errorMessage,
    outputContent: extractRuntimeOutputContent(data),
    xCardCommands: a2ui?.commands,
    xCardSurfaceIds: a2ui?.surface_ids,
    xCardStatus: a2ui
      ? a2ui.commands?.length
        ? XCardStatus.READY
        : XCardStatus.ERROR
      : undefined,
    logEvent,
  }
}

export function consumeRuntimeMessageChunk(
  previousState: StreamingAnswerState | undefined,
  payload: unknown,
): StreamingAnswerChunkResult {
  const mappedPayload =
    isRecord(payload) && typeof payload.content === 'string'
      ? {
          answer: payload.content,
          start_to_think: payload.start_to_think,
          end_to_think: payload.end_to_think,
          final: payload.final,
        }
      : payload

  const result = consumeStreamingAnswerChunk(
    previousState || createInitialStreamingAnswerState(),
    { retcode: 0, data: mappedPayload },
  )

  return result
}

export function buildRuntimeSummary(params: {
  status: AgentRuntimeStatus
  currentView: RuntimeWorkbenchView
  messageCount: number
  hasLogs: boolean
  sessionId?: string
  sessionName?: string
  lastRunAt?: number
  lastMessageId?: string
  lastTaskId?: string
  lastError?: string
}): RuntimeWorkbenchSummary {
  return {
    status: params.status,
    currentView: params.currentView,
    messageCount: params.messageCount,
    hasLogs: params.hasLogs,
    ...(params.sessionId ? { sessionId: params.sessionId } : {}),
    ...(params.sessionName ? { sessionName: params.sessionName } : {}),
    lastRunAt: params.lastRunAt,
    lastMessageId: params.lastMessageId,
    lastTaskId: params.lastTaskId,
    lastError: params.lastError,
  }
}

import { AgentDialogueMode, BeginId } from '../constant'
import type { BeginQuery } from '../types'
import { getOrderedBeginInputEntries } from '../utils/begin-input-order'
import type {
  AgentFlow,
  AgentSession,
  AgentSessionMessage,
} from '@/types/agent'
import type {
  RuntimeAttachment,
  RuntimeMessage,
} from '../features/runtime-workbench/types'
import { normalizeRuntimeAttachments } from '../features/runtime-workbench/utils'
import { XCardStatus, type AgentXCardCommand } from '../x-card'
import type { ExploreSession, ExploreSessionListParams } from './types'

const SYNTHETIC_TEMP_SESSION_ID = 'temporary-explore-session'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export function resolveExploreSessionId(searchParams: URLSearchParams): {
  sessionId: string
  legacySessionId: string
  isNew: boolean
} {
  const sessionId = searchParams.get('sessionId') || ''
  const legacySessionId = searchParams.get('session') || ''

  return {
    sessionId: sessionId || legacySessionId,
    legacySessionId,
    isNew: searchParams.get('isNew') === 'true',
  }
}

export function buildExploreSessionSearchParams(params: {
  sessionId?: string
  isNew?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (params.sessionId) {
    searchParams.set('sessionId', params.sessionId)
  }
  if (params.isNew) {
    searchParams.set('isNew', 'true')
  }
  return searchParams
}

export function createTemporaryExploreSession(): ExploreSession {
  const now = Date.now()

  return {
    id: SYNTHETIC_TEMP_SESSION_ID,
    name: '新会话',
    create_time: now,
    update_time: now,
    messages: [],
    message_count: 0,
    isTemporary: true,
  }
}

export function selectNextSessionIdAfterDelete(
  sessions: AgentSession[],
  deletedSessionId: string,
) {
  const remaining = sessions.filter(
    (session) => session.id !== deletedSessionId,
  )
  return remaining[0]?.id || ''
}

export function createDefaultExploreSessionParams(): ExploreSessionListParams {
  return {
    page: 1,
    page_size: 12,
    orderby: 'update_time',
    desc: true,
    keywords: '',
    from_date: '',
    to_date: '',
    exp_user_id: '',
  }
}

function getBeginForm(agent?: AgentFlow) {
  const beginNode = agent?.dsl?.graph?.nodes?.find(
    (node) => node.id === BeginId,
  )
  const data = isRecord(beginNode?.data) ? beginNode.data : undefined
  return isRecord(data?.form) ? data.form : undefined
}

export function getBeginInputsFromAgent(agent?: AgentFlow): BeginQuery[] {
  const inputs = getBeginForm(agent)?.inputs

  if (!isRecord(inputs)) {
    return []
  }

  return getOrderedBeginInputEntries(inputs as Record<string, BeginQuery>).map(
    ([key, value]) => ({
      ...value,
      key,
      name: value?.name || key,
    }),
  )
}

export function isExploreTaskMode(agent?: AgentFlow) {
  return getBeginForm(agent)?.mode === AgentDialogueMode.Task
}

function stringifyContent(value: unknown) {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function normalizeRole(role: unknown): RuntimeMessage['role'] {
  if (role === 'assistant' || role === 'system') {
    return role
  }
  return 'user'
}

export function mapSessionMessageToRuntimeMessage(
  message: AgentSessionMessage,
  index: number,
): RuntimeMessage {
  const record = message as Record<string, unknown>
  const files = [
    ...normalizeRuntimeAttachments(message.files),
    ...normalizeRuntimeAttachments(message.downloads),
  ]
  const a2ui = isRecord(record.a2ui) ? record.a2ui : undefined
  const xCardCommands = Array.isArray(a2ui?.commands)
    ? a2ui.commands.filter(
        (command): command is AgentXCardCommand =>
          isRecord(command) && command.version === 'v0.9',
      )
    : undefined
  const xCardSurfaceIds = Array.isArray(a2ui?.surface_ids)
    ? a2ui.surface_ids.filter(
        (surfaceId): surfaceId is string => typeof surfaceId === 'string',
      )
    : undefined

  return {
    id: message.id || `session-message-${index}`,
    role: normalizeRole(message.role),
    content: stringifyContent(
      message.content ?? record.answer ?? record.output,
    ),
    files: files as RuntimeAttachment[],
    reference: record.reference,
    error: typeof record.error === 'string' ? record.error : undefined,
    xCardCommands,
    xCardSurfaceIds,
    xCardStatus: xCardCommands?.length ? XCardStatus.READY : undefined,
    messageId: message.id,
  }
}

export function mapSessionMessagesToRuntimeMessages(
  session?: AgentSession,
): RuntimeMessage[] {
  return (session?.messages || []).map(mapSessionMessageToRuntimeMessage)
}

export function buildExploreSessionName(content?: string) {
  const trimmed = content?.trim()
  if (!trimmed) {
    return '新会话'
  }
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed
}

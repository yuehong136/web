import { AgentDialogueMode, BeginId } from '../constant'
import zhCNAgent from '@/locales/zh-CN/agent'
import type { BeginQuery } from '../types'
import { getOrderedBeginInputEntries } from '../utils/begin-input-order'
import type {
  AgentFlow,
  AgentRunMode,
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
import { extractSessionStatus, extractSessionTitle } from '../adapters/session'

const SYNTHETIC_TEMP_SESSION_ID = 'temporary-explore-session'
const SESSION_TITLE_LIMIT = 60
const SESSION_TITLE_SOURCE_LIMIT = 4096
// Known server defaults and existing local placeholders are display fallbacks.
const DEFAULT_SESSION_NAMES = new Set([
  'new session',
  'new conversation',
  'new chat',
  'untitled session',
  'untitled conversation',
  'unnamed session',
  'unnamed conversation',
  buildExploreSessionName(),
  extractSessionTitle(undefined),
  zhCNAgent.agent.explore.newChat,
  zhCNAgent.agent.explore.unnamedChat,
])

export type ExploreSessionGroup =
  | 'today'
  | 'yesterday'
  | 'previous7Days'
  | 'previous30Days'
  | 'undated'
  | `${number}-${number}`

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
  mode?: AgentRunMode
}) {
  const searchParams = new URLSearchParams()
  if (params.sessionId) {
    searchParams.set('sessionId', params.sessionId)
  }
  if (params.isNew) {
    searchParams.set('isNew', 'true')
  }
  if (params.mode === 'published') searchParams.set('runMode', 'published')
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

function getPlainSessionTitle(content: string) {
  // Bound every cleanup pass, including malformed Markdown. Text after this
  // prefix is not inspected; a blank prefix can fall through to a later user.
  const plain = content
    .slice(0, SESSION_TITLE_SOURCE_LIMIT)
    .replace(/[\uD800-\uDBFF]$/u, '')
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/```/g, '')
    .replace(/!?\[([^[\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/gu, ' ')
    .trim()
  const characters = Array.from(plain)
  return characters.length > SESSION_TITLE_LIMIT
    ? `${characters.slice(0, SESSION_TITLE_LIMIT - 1).join('')}…`
    : plain
}

/** A display-only title; never rewrites a persisted name or includes tool data. */
export function getExploreSessionTitle(
  session: AgentSession | undefined,
  fallback: string,
): string {
  const name = session?.name?.trim()
  if (
    name &&
    !DEFAULT_SESSION_NAMES.has(name.replace(/\s+/gu, ' ').toLowerCase())
  ) {
    return name
  }
  for (const message of session?.messages || []) {
    if (message.role !== 'user' || typeof message.content !== 'string') continue
    const title = getPlainSessionTitle(message.content)
    if (title) return title
  }
  return fallback
}

/** The API stores milliseconds; grouping uses local calendar days, not 24h spans. */
export function getExploreSessionGroup(
  session: AgentSession | undefined,
  orderby: string,
  now = Date.now(),
): ExploreSessionGroup | undefined {
  if (orderby !== 'create_time' && orderby !== 'update_time') return undefined
  const timestamp = session?.[orderby]
  if (
    typeof timestamp !== 'number' ||
    !Number.isFinite(timestamp) ||
    timestamp <= 0
  ) {
    return 'undated'
  }
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'undated'

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const boundary = (offset: number) => {
    const day = new Date(today)
    day.setDate(day.getDate() + offset)
    return day.getTime()
  }
  if (timestamp >= boundary(0) && timestamp < boundary(1)) return 'today'
  if (timestamp >= boundary(-1) && timestamp < boundary(0)) return 'yesterday'
  if (timestamp >= boundary(-7) && timestamp < boundary(-1))
    return 'previous7Days'
  if (timestamp >= boundary(-30) && timestamp < boundary(-7))
    return 'previous30Days'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` as ExploreSessionGroup
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
  failureMessage?: string,
): RuntimeMessage[] {
  const messages = (session?.messages || []).map(
    mapSessionMessageToRuntimeMessage,
  )
  if (!failureMessage || extractSessionStatus(session) !== 'error')
    return messages
  const last = messages.at(-1)
  const failure: RuntimeMessage = {
    id: `session-error-${session?.id}`,
    role: 'assistant',
    content: failureMessage,
    error: failureMessage,
    logEvents: [{ event: 'error', data: { error: failureMessage } }],
  }
  if (last?.role === 'assistant' && last.error) {
    messages[messages.length - 1] = { ...last, ...failure, id: last.id }
  } else {
    messages.push(failure)
  }
  return messages
}

export function buildExploreSessionName(content?: string) {
  const trimmed = content?.trim()
  if (!trimmed) {
    return '新会话'
  }
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed
}

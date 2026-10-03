import type {
  AgentRunMode,
  AgentSession,
  AgentSessionListParams,
} from '@/types/agent'
import type { BeginQuery } from '../types'
import type {
  AgentRuntimeStatus,
  RuntimeAttachment,
  RuntimeMessage,
} from '../features/runtime-workbench/types'

export enum ExploreDebugTab {
  SUMMARY = 'summary',
  LOG = 'log',
  RAW = 'raw',
}

export interface ExploreSessionListParams extends AgentSessionListParams {
  page: number
  page_size: number
  orderby: string
  desc: boolean
}

export interface ExploreSession extends AgentSession {
  isTemporary?: boolean
}

export interface ExploreSendRequest {
  content?: string
  files?: RuntimeAttachment[]
}

export interface ExploreChatState {
  messages: RuntimeMessage[]
  status: AgentRuntimeStatus
  loading: boolean
  lastError?: string
  currentMessageId?: string
  latestTaskId?: string
}

export interface ExploreSelection {
  canvasId: string
  sessionId: string
  isNew: boolean
  revision: number
  mode?: AgentRunMode
}

export interface ExploreRequestOwner {
  selection: ExploreSelection
  sessionId: string
  controller: AbortController
  assistantId?: string
}

export interface ExploreSessionView {
  selection: ExploreSelection
  messages: RuntimeMessage[]
  status: AgentRuntimeStatus
  lastError?: string
  currentMessageId?: string
  latestTaskId?: string
  hasLocalMessages: boolean
  parameterDialogOpen: boolean
  submittedBeginInputs: BeginQuery[] | null
  pendingRequest: ExploreSendRequest | null
}

export interface ExploreRunRequest extends ExploreSendRequest {
  runtimeInputs: Record<string, unknown>
  a2ui?: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
  appendUserMessage: boolean
  userMessageContent?: string
}

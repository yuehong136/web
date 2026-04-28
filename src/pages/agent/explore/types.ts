import type { AgentSession, AgentSessionListParams } from '@/types/agent'
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

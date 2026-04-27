import type { AgentSessionMessage, AgentTraceItem } from '@/types/agent'
import type { BeginQuery } from '../../types'
import type {
  AgentRuntimeController,
  RuntimeAttachment,
} from '../runtime-workbench/types'

export type LogDetailSource =
  | { mode: 'live'; controller: AgentRuntimeController }
  | {
      mode: 'session'
      canvasId: string
      sessionId: string
      controller?: AgentRuntimeController
    }

export interface LogDetailViewModel {
  sessionId?: string
  sessionName?: string
  source?: string
  status: 'running' | 'success' | 'error' | 'unknown' | 'idle'
  errorMessage?: string
  inputs: BeginQuery[]
  files: RuntimeAttachment[]
  latestOutput?: { kind: 'text' | 'json'; value: unknown }
  transcript: AgentSessionMessage[]
  traceItems: AgentTraceItem[]
  traceUnavailableReason?:
    | 'no-message-id'
    | 'redis-evicted'
    | 'fetching'
    | undefined
  canRetry: boolean
  rawSession?: unknown
}

import type { AgentSessionListParams } from '@/types/agent'

export enum AgentLogStatus {
  ALL = 'all',
  OK = 'ok',
  ERR = 'err',
  RUN = 'run',
  WARN = 'warn',
}

export interface AgentLogParams {
  canvas?: string
  sessionId?: string
  status: AgentLogStatus
  source?: string
  from?: string
  to?: string
  user?: string
  keywords?: string
  page: number
  pageSize: number
}

export type AgentLogParamPatch = Partial<AgentLogParams>

export type AgentLogServerParams = AgentSessionListParams

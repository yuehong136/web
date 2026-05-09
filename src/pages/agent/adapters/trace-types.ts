import type { AgentTraceItem, AgentWebhookTraceEvent } from '@/types/agent'

export type TraceRunStatus =
  | 'running'
  | 'success'
  | 'error'
  | 'partial'
  | 'missing'

export type TraceSpanStatus = 'running' | 'success' | 'error' | 'unknown'

export type TraceSpanKind =
  | 'node'
  | 'llm'
  | 'tool'
  | 'retrieval'
  | 'control'
  | 'data'
  | 'webhook'
  | 'system'

export type TraceUnavailableReason =
  | 'no-message-id'
  | 'redis-evicted'
  | 'backend-empty'
  | 'query-error'

export type TraceConfidence = 'exact' | 'derived' | 'unavailable'

export interface TraceSpanSummary {
  id: string
  parentId?: string
  componentId?: string
  name: string
  kind: TraceSpanKind
  status: TraceSpanStatus
  duration?: number
}

export interface TraceRunSummary {
  spanCount: number
  nodeCount: number
  toolCallCount: number
  errorCount: number
  runningCount: number
  totalDuration?: number
  slowestSpan?: TraceSpanSummary
}

export interface TraceSpanViewModel {
  id: string
  parentId?: string
  componentId?: string
  name: string
  kind: TraceSpanKind
  status: TraceSpanStatus
  duration?: number
  input?: unknown
  output?: unknown
  error?: string
  message?: string
  confidence: TraceConfidence
  children: TraceSpanViewModel[]
  raw: unknown
}

export interface TraceIssue {
  id: string
  severity: 'error' | 'warning' | 'info'
  message: string
  spanId?: string
  componentId?: string
  source: 'trace-item' | 'runtime-event' | 'webhook-event' | 'run'
  raw?: unknown
}

export interface TraceRunViewModel {
  runId: string
  canvasId?: string
  sessionId?: string
  messageId?: string
  status: TraceRunStatus
  unavailableReason?: TraceUnavailableReason
  summary: TraceRunSummary
  spans: TraceSpanViewModel[]
  issues: TraceIssue[]
  raw: unknown
}

export interface TraceRuntimeEvent {
  event?: string
  message?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

export interface BuildTraceRunViewModelInput {
  runId?: string
  canvasId?: string
  sessionId?: string
  messageId?: string
  traceItems?: AgentTraceItem[]
  runtimeEvents?: TraceRuntimeEvent[]
  webhookEvents?: AgentWebhookTraceEvent[]
  unavailableReason?: TraceUnavailableReason
  queryError?: unknown
  raw?: unknown
}

import type {
  TraceRunStatus,
  TraceSpanKind,
  TraceSpanStatus,
  TraceUnavailableReason,
} from '@/pages/agent/adapters/trace'
import type { TraceEmptyStateContent } from './types'

export enum TraceWorkbenchSection {
  SpanTree = 'span-tree',
  SpanDetail = 'span-detail',
  InputOutput = 'input-output',
  Raw = 'raw',
  Debug = 'debug',
}

export enum TraceWorkbenchCopyState {
  Idle = 'idle',
  Copied = 'copied',
}

export const TRACE_RUN_STATUS_LABEL_KEYS = {
  running: 'agent.traceWorkbench.runStatus.running',
  success: 'agent.traceWorkbench.runStatus.success',
  error: 'agent.traceWorkbench.runStatus.error',
  partial: 'agent.traceWorkbench.runStatus.partial',
  missing: 'agent.traceWorkbench.runStatus.missing',
} as const satisfies Record<TraceRunStatus, string>

export const TRACE_SPAN_STATUS_LABEL_KEYS = {
  running: 'agent.traceWorkbench.spanStatus.running',
  success: 'agent.traceWorkbench.spanStatus.success',
  error: 'agent.traceWorkbench.spanStatus.error',
  unknown: 'agent.traceWorkbench.spanStatus.unknown',
} as const satisfies Record<TraceSpanStatus, string>

export const TRACE_SPAN_KIND_LABEL_KEYS = {
  node: 'agent.traceWorkbench.spanKind.node',
  llm: 'agent.traceWorkbench.spanKind.llm',
  tool: 'agent.traceWorkbench.spanKind.tool',
  retrieval: 'agent.traceWorkbench.spanKind.retrieval',
  control: 'agent.traceWorkbench.spanKind.control',
  data: 'agent.traceWorkbench.spanKind.data',
  webhook: 'agent.traceWorkbench.spanKind.webhook',
  system: 'agent.traceWorkbench.spanKind.system',
} as const satisfies Record<TraceSpanKind, string>

export const TRACE_UNAVAILABLE_LABELS = {
  'no-message-id': {
    titleKey: 'agent.traceWorkbench.emptyState.noMessageId.title',
    descriptionKey: 'agent.traceWorkbench.emptyState.noMessageId.description',
  },
  'redis-evicted': {
    titleKey: 'agent.traceWorkbench.emptyState.redisEvicted.title',
    descriptionKey: 'agent.traceWorkbench.emptyState.redisEvicted.description',
  },
  'backend-empty': {
    titleKey: 'agent.traceWorkbench.emptyState.backendEmpty.title',
    descriptionKey: 'agent.traceWorkbench.emptyState.backendEmpty.description',
  },
  'query-error': {
    titleKey: 'agent.traceWorkbench.emptyState.queryError.title',
    descriptionKey: 'agent.traceWorkbench.emptyState.queryError.description',
  },
} as const satisfies Record<TraceUnavailableReason, TraceEmptyStateContent>

export const TRACE_LOADING_EMPTY_STATE = {
  titleKey: 'agent.traceWorkbench.emptyState.loading.title',
  descriptionKey: 'agent.traceWorkbench.emptyState.loading.description',
} as const satisfies TraceEmptyStateContent

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

export const TRACE_RUN_STATUS_LABELS: Record<TraceRunStatus, string> = {
  running: '运行中',
  success: '成功',
  error: '失败',
  partial: '部分可用',
  missing: '不可用',
}

export const TRACE_SPAN_STATUS_LABELS: Record<TraceSpanStatus, string> = {
  running: '运行中',
  success: '成功',
  error: '失败',
  unknown: '未知',
}

export const TRACE_SPAN_KIND_LABELS: Record<TraceSpanKind, string> = {
  node: '节点',
  llm: 'LLM',
  tool: 'Tool',
  retrieval: 'Retrieval',
  control: 'Control',
  data: 'Data',
  webhook: 'Webhook',
  system: 'System',
}

export const TRACE_UNAVAILABLE_LABELS: Record<
  TraceUnavailableReason,
  TraceEmptyStateContent
> = {
  'no-message-id': {
    title: '缺少 message id',
    description: '当前 session 没有可用于回查 Redis Trace 的真实 message id。',
  },
  'redis-evicted': {
    title: 'Trace 不可恢复',
    description: 'Redis Trace 没有返回数据，可能已经过期或运行时未写入。',
  },
  'backend-empty': {
    title: '后端返回空 Trace',
    description: 'Trace 请求成功，但后端返回了空 payload。',
  },
  'query-error': {
    title: 'Trace 查询失败',
    description: 'Trace 请求失败，请刷新或检查后端 trace 接口状态。',
  },
}

export const TRACE_LOADING_EMPTY_STATE: TraceEmptyStateContent = {
  title: '正在加载 Trace',
  description: '正在读取 session detail 与终态 Redis Trace。',
}

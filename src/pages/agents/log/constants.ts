import { AgentLogStatus } from './types'

export const DEFAULT_AGENT_LOG_PAGE_SIZE = 12

export const AGENT_LOG_STATUS_LABELS: Record<AgentLogStatus, string> = {
  [AgentLogStatus.ALL]: '全部状态',
  [AgentLogStatus.OK]: '成功',
  [AgentLogStatus.ERR]: '失败',
  [AgentLogStatus.RUN]: '运行中',
  [AgentLogStatus.WARN]: '告警',
}

export const AGENT_LOG_SOURCE_LABELS: Record<string, string> = {
  all: '全部来源',
  explore: 'Explore',
  share: 'Share',
  webhook: 'Webhook',
  editor: 'Editor',
}

export const AGENT_LOG_CSV_COLUMNS = [
  'id',
  'canvas_id',
  'agent_title',
  'user_id',
  'source',
  'status',
  'round',
  'duration',
  'tokens',
  'message_count',
  'error_summary',
  'latest_query',
  'latest_output_summary',
  'create_time',
  'update_time',
  'version_title',
] as const

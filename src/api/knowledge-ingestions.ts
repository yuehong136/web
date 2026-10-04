import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'
import type { IFileLogItem } from '@/types/api'

export interface IngestionSummary {
  doc_num: number
  chunk_num: number
  token_num: number
  status: {
    unstart_count: number
    running_count: number
    cancel_count: number
    done_count: number
    fail_count: number
  }
}

export type IngestionLog = Pick<
  IFileLogItem,
  | 'id'
  | 'create_date'
  | 'create_time'
  | 'kb_id'
  | 'operation_status'
  | 'process_begin_at'
  | 'process_duration'
  | 'progress'
  | 'progress_msg'
  | 'status'
  | 'task_type'
  | 'tenant_id'
  | 'update_date'
  | 'update_time'
>
interface LogListParams {
  kb_id: string
  page?: number
  page_size?: number
  operation_status?: string[]
  keywords?: string
  orderby?: string
  desc?: boolean
  create_date_from?: string
  create_date_to?: string
  types?: string[]
  suffix?: string[]
}
const ingestionPath = (id: string) =>
  `/v1/datasets/${encodeURIComponent(id)}/ingestions`

function listLogs<T>(
  { kb_id, page = 1, page_size = 10, ...filters }: LogListParams,
  logType: 'file' | 'dataset',
): Promise<{ logs: T[]; total: number }> {
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
    log_type: logType,
  })
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item)
    } else query.set(key, String(value))
  }
  return apiClient.get(`${ingestionPath(kb_id)}?${query}`, knowledgeRestConfig)
}

export const knowledgeIngestionAPI = {
  listFileLogs: (params: LogListParams) =>
    listLogs<IFileLogItem>(params, 'file'),
  listDatasetLogs: (params: LogListParams) =>
    listLogs<IngestionLog>(params, 'dataset'),
  get: (datasetId: string, logId: string): Promise<IngestionLog> =>
    apiClient.get(
      `${ingestionPath(datasetId)}/${encodeURIComponent(logId)}`,
      knowledgeRestConfig,
    ),
  getSummary: (datasetId: string): Promise<IngestionSummary> =>
    apiClient.get(`${ingestionPath(datasetId)}/summary`, knowledgeRestConfig),
}

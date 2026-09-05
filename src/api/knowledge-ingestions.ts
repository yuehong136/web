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
}
const ingestionPath = (id: string) =>
  `/v1/datasets/${encodeURIComponent(id)}/ingestions`

export const knowledgeIngestionAPI = {
  // File download logs are not included by the current canonical ingestion list.
  listFileLogs: ({
    kb_id,
    page = 1,
    page_size = 10,
    keywords = '',
    operation_status = [],
  }: LogListParams & { keywords?: string }): Promise<{
    logs: IFileLogItem[]
    total: number
  }> =>
    apiClient.post(
      `/v1/kb/list_pipeline_logs?${new URLSearchParams({ kb_id, page: String(page), page_size: String(page_size), keywords })}`,
      { operation_status },
    ),
  listDatasetLogs: ({
    kb_id,
    page = 1,
    page_size = 10,
    operation_status = [],
  }: LogListParams): Promise<{ logs: IngestionLog[]; total: number }> => {
    const query = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    })
    for (const status of operation_status)
      query.append('operation_status', status)
    return apiClient.get(
      `${ingestionPath(kb_id)}?${query}`,
      knowledgeRestConfig,
    )
  },
  get: (datasetId: string, logId: string): Promise<IngestionLog> =>
    apiClient.get(
      `${ingestionPath(datasetId)}/${encodeURIComponent(logId)}`,
      knowledgeRestConfig,
    ),
  getSummary: (datasetId: string): Promise<IngestionSummary> =>
    apiClient.get(`${ingestionPath(datasetId)}/summary`, knowledgeRestConfig),
}

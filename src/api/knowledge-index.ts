import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'

export type DatasetIndexType = 'graph' | 'raptor' | 'mindmap'
export interface IndexTrace {
  id: string
  progress: number
  progress_msg: string
  begin_at: string
  create_date: string
  update_date: string
  process_duration: number
  task_type: string
}
const indexPath = (datasetId: string, type: DatasetIndexType) =>
  `/v1/datasets/${encodeURIComponent(datasetId)}/index?type=${type}`

export const knowledgeIndexAPI = {
  run: (
    datasetId: string,
    type: DatasetIndexType,
  ): Promise<{ task_id: string }> =>
    apiClient.post(indexPath(datasetId, type), undefined, knowledgeRestConfig),
  trace: (
    datasetId: string,
    type: DatasetIndexType,
  ): Promise<IndexTrace | Record<string, never>> =>
    apiClient.get(indexPath(datasetId, type), knowledgeRestConfig),
  delete: (
    datasetId: string,
    type: DatasetIndexType,
  ): Promise<Record<string, never>> =>
    apiClient.delete(indexPath(datasetId, type), knowledgeRestConfig),
}

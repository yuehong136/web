import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'

export interface EmbeddingCheckResult {
  summary: {
    kb_id: string
    model: string
    sampled: number
    valid: number
    avg_cos_sim: number
    min_cos_sim: number
    max_cos_sim: number
    match_mode: string
  }
  results: Array<{
    chunk_id: string
    reason?: string
    cos_sim?: number
    vector_dim?: number
  }>
}

export function checkDatasetEmbedding(datasetId: string, embdId: string) {
  return apiClient.post<EmbeddingCheckResult>(
    `/v1/datasets/${encodeURIComponent(datasetId)}/embedding/check`,
    { embd_id: embdId },
    knowledgeRestConfig,
  )
}

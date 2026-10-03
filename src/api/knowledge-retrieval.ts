import { APIError, apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'
import type { MetadataCondition } from '../types/api'

export interface DatasetGraphResponse {
  graph: {
    nodes?: Array<Record<string, unknown>>
    edges?: Array<Record<string, unknown>>
  }
  mind_map: Record<string, unknown>
}

export const knowledgeRetrievalAPI = {
  // 执行检索测试
  test: async (data: {
    kb_ids: string[]
    question: string
    page?: number
    size?: number
    doc_ids?: string[] | null
    similarity_threshold?: number
    vector_similarity_weight?: number
    use_kg?: boolean
    top_k?: number
    rerank_id?: string | null
    tenant_rerank_id?: number | null
    search_id?: string | null
    highlight?: boolean
    keyword?: boolean
    search_mode?: {
      type: 'sparse' | 'dense' | 'hybrid' | 'fusion'
      weight_dense?: number
      weight_sparse?: number
      weights?: string
    } | null
    cross_languages?: string[] | null
    meta_data_filter?: {
      method: 'auto' | 'semi_auto' | 'manual'
      logic?: 'and' | 'or'
      semi_auto?: Array<string | { key: string; op?: string }>
      manual?: Array<{ key: string; op: string; value: string }>
    }
    metadata_condition?: MetadataCondition
  }): Promise<{
    total: number
    chunks: Array<{
      chunk_id: string
      text: string
      doc_id: string
      docnm_kwd: string
      kb_id: string
      similarity: number
      vector_similarity: number
      term_similarity: number
      highlight?: string
      positions?: number[][]
    }>
    doc_aggs: Array<{
      doc_name: string
      doc_id: string
      count: number
    }>
    labels: Record<string, unknown> | null
  }> => {
    const { kb_ids, ...body } = data
    const datasetId = kb_ids[0]
    if (!datasetId || kb_ids.some((id) => !id.trim()))
      throw new APIError(400, 'INVALID_DATASET_SELECTION', 'Select a dataset')
    return apiClient.post(
      `/v1/datasets/${encodeURIComponent(datasetId)}/search`,
      { ...body, dataset_ids: kb_ids },
      { ...knowledgeRestConfig, responseContract: 'rest200' },
    )
  },
}

export const knowledgeGraphAPI = {
  get: (datasetId: string, docId?: string): Promise<DatasetGraphResponse> =>
    apiClient.get(`/v1/datasets/${encodeURIComponent(datasetId)}/graph`, {
      ...knowledgeRestConfig,
      responseContract: 'rest200',
      params: docId === undefined ? undefined : { doc_id: docId },
    }),
}

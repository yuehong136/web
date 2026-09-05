import { apiClient, type ApiEnvelope } from './client'
import { knowledgeRestConfig as sdkBase } from './knowledge-config'
import { knowledgeDocumentAPI } from './knowledge-documents'
import { knowledgeMetadataAPI } from './knowledge-metadata'
import { knowledgeIndexAPI } from './knowledge-index'
import { knowledgeTagAPI } from './knowledge-tags'
import { knowledgeIngestionAPI } from './knowledge-ingestions'
export type { IngestionSummary } from './knowledge-ingestions'
import type {
  KnowledgeBase,
  DatasetDTO,
  CreateKBRequest,
  UpdateKBRequest,
  DocumentChunk,
  KnowledgeGraph,
  PaginatedData,
  PaginationRequest,
  MetadataCondition,
} from '../types/api'

/**
 * 防腐层：RESTful dataset 传输 DTO → 前端稳定领域模型 KnowledgeBase。
 * 仅吸收后端 `remap_dictionary_keys` 的 4 个字段名差异，其余字段透传。
 */
export const normalizeDataset = (dto: DatasetDTO): KnowledgeBase =>
  ({
    ...dto,
    metadata_settings: Array.isArray(dto.parser_config?.metadata)
      ? dto.parser_config.metadata
      : [],
    doc_num: dto.document_count ?? 0,
    chunk_num: dto.chunk_count ?? 0,
    parser_id: dto.chunk_method ?? 'naive',
    embd_id: dto.embedding_model ?? '',
  }) as unknown as KnowledgeBase

/** toDatasetBody 的入参：CreateKBRequest 与 UpdateKBRequest 的并集（取较宽松的可空类型）。 */
type DatasetBodyInput = {
  name?: string
  description?: string | null
  avatar?: string | null
  permission?: string | null
  parser_id?: string | null
  embd_id?: string | null
  parser_config?: Record<string, any> | null
  language?: string | null
  pagerank?: number | null
  similarity_threshold?: number
  vector_similarity_weight?: number
}

/**
 * CreateKBRequest / UpdateKBRequest → RESTful dataset 请求体。
 * 命名字段两端 pydantic 均接受；其余旧字段（language/pagerank/相似度权重）走 `ext` 透传，
 * 后端 create/update 都会把 `ext` 合并回建库/更新参数。
 */
const toDatasetBody = (data: DatasetBodyInput): Record<string, unknown> => {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.description !== undefined && data.description !== null)
    body.description = data.description
  if (data.avatar !== undefined && data.avatar !== null)
    body.avatar = data.avatar
  if (data.permission !== undefined && data.permission !== null)
    body.permission = data.permission
  if (data.parser_id !== undefined && data.parser_id !== null)
    body.chunk_method = data.parser_id
  if (data.embd_id !== undefined && data.embd_id !== null)
    body.embedding_model = data.embd_id
  if (data.parser_config !== undefined && data.parser_config !== null)
    body.parser_config = data.parser_config

  const ext: Record<string, unknown> = {}
  if (data.language !== undefined) ext.language = data.language
  if (data.pagerank !== undefined && data.pagerank !== null)
    ext.pagerank = data.pagerank
  if (data.similarity_threshold !== undefined)
    ext.similarity_threshold = data.similarity_threshold
  if (data.vector_similarity_weight !== undefined)
    ext.vector_similarity_weight = data.vector_similarity_weight
  if (Object.keys(ext).length > 0) body.ext = ext

  return body
}

export const knowledgeAPI = {
  // 知识库管理
  knowledgeBase: {
    // 获取知识库列表 —— RESTful GET /api/v1/datasets
    // 总数在信封顶层 total_datasets，经 withEnvelope 取回；DTO 经 normalizeDataset 还原为 KnowledgeBase。
    list: async (params?: {
      page?: number
      page_size?: number
      orderby?: string
      desc?: boolean
      keywords?: string
      owner_ids?: string[]
      parser_id?: string
    }): Promise<{ kbs: KnowledgeBase[]; total: number }> => {
      const query = new URLSearchParams()
      query.set('page', String(params?.page ?? 1))
      query.set('page_size', String(params?.page_size ?? 12))
      query.set('orderby', params?.orderby || 'update_time')
      query.set('desc', String(params?.desc ?? true))
      if (params?.keywords) query.set('keywords', params.keywords)
      if (params?.parser_id) query.set('parser_id', params.parser_id)
      // owner_ids 为可重复 query 参数：?owner_ids=a&owner_ids=b
      for (const id of params?.owner_ids ?? []) query.append('owner_ids', id)

      const env = await apiClient.get<ApiEnvelope<DatasetDTO[]>>(
        `/v1/datasets?${query.toString()}`,
        { ...sdkBase, withEnvelope: true },
      )
      return {
        kbs: (env.data ?? []).map(normalizeDataset),
        total: env.total ?? 0,
      }
    },

    // 获取知识库详情
    get: async (kbId: string): Promise<KnowledgeBase> =>
      normalizeDataset(
        await apiClient.get<DatasetDTO>(
          `/v1/datasets/${encodeURIComponent(kbId)}`,
          sdkBase,
        ),
      ),

    // 创建知识库 —— RESTful POST /api/v1/datasets（对外仍返回 { kb_id }）
    create: async (data: CreateKBRequest): Promise<{ kb_id: string }> => {
      const ds = await apiClient.post<DatasetDTO>(
        '/v1/datasets',
        toDatasetBody(data),
        sdkBase,
      )
      return { kb_id: ds.id }
    },

    // 更新知识库 —— RESTful PUT /api/v1/datasets/{dataset_id}
    update: async (data: UpdateKBRequest): Promise<KnowledgeBase> => {
      const ds = await apiClient.put<DatasetDTO>(
        `/v1/datasets/${data.kb_id}`,
        toDatasetBody(data),
        sdkBase,
      )
      return normalizeDataset(ds)
    },

    // 删除知识库 —— RESTful DELETE /api/v1/datasets，body { ids:[...] }
    delete: (kbId: string): Promise<void> =>
      apiClient.delete('/v1/datasets', { ...sdkBase, data: { ids: [kbId] } }),

    // 复制知识库（无 RESTful 等价物，保留旧端点）
    duplicate: (kbId: string, newName: string): Promise<{ kb_id: string }> =>
      apiClient.post(`/v1/kb/${kbId}/duplicate`, { name: newName }),

    // 获取知识图谱 —— RESTful GET /api/v1/datasets/{dataset_id}/knowledge_graph
    // 返回 { graph:{nodes,edges}, mind_map }，由 use-knowledge-request 的 normalizeGraphResponse 兼容
    getKnowledgeGraph: (kbId: string): Promise<KnowledgeGraph> =>
      apiClient.get(`/v1/datasets/${kbId}/knowledge_graph`, sdkBase),

    // 搜索知识库
    search: (data: {
      query: string
      kb_ids?: string[]
      top_k?: number
      score_threshold?: number
      filters?: Record<string, any>
    }): Promise<{
      chunks: Array<DocumentChunk & { score: number }>
      total: number
    }> => apiClient.post('/v1/kb/search', data),

    // 获取知识库统计
    getStats: (
      kbId: string,
    ): Promise<{
      document_count: number
      chunk_count: number
      total_tokens: number
      storage_used: number
      last_updated: string
    }> => apiClient.get(`/v1/kb/${kbId}/stats`),

    // 重新索引知识库
    reindex: (kbId: string): Promise<{ task_id: string }> =>
      apiClient.post(`/v1/kb/${kbId}/reindex`),

    // 导出知识库
    export: (kbId: string, format: 'json' | 'csv'): Promise<void> =>
      apiClient.download(
        `/v1/kb/${kbId}/export?format=${format}`,
        `kb_${kbId}.${format}`,
      ),
  },

  // 文档管理
  document: knowledgeDocumentAPI,

  tag: knowledgeTagAPI,

  // 搜索和检索
  search: {
    // 全文搜索
    fulltext: (data: {
      query: string
      kb_ids?: string[]
      filters?: Record<string, any>
      pagination?: PaginationRequest
    }): Promise<
      PaginatedData<DocumentChunk & { score: number; highlights: string[] }>
    > => apiClient.post('/v1/kb/search/fulltext', data),

    // 向量搜索
    vector: (data: {
      query: string
      kb_ids?: string[]
      top_k?: number
      score_threshold?: number
      filters?: Record<string, any>
    }): Promise<Array<DocumentChunk & { score: number }>> =>
      apiClient.post('/v1/kb/search/vector', data),

    // 混合搜索 (全文 + 向量)
    hybrid: (data: {
      query: string
      kb_ids?: string[]
      top_k?: number
      alpha?: number // 向量搜索权重
      filters?: Record<string, any>
    }): Promise<
      Array<
        DocumentChunk & {
          score: number
          search_type: 'vector' | 'fulltext' | 'hybrid'
        }
      >
    > => apiClient.post('/v1/kb/search/hybrid', data),

    // 搜索建议
    suggestions: (query: string, limit?: number): Promise<string[]> =>
      apiClient.get('/v1/kb/search/suggestions', {
        params: { query, limit },
      }),

    // 搜索历史
    history: (
      params?: PaginationRequest,
    ): Promise<
      PaginatedData<{
        id: string
        query: string
        kb_ids: string[]
        result_count: number
        created_at: string
      }>
    > => apiClient.get('/v1/kb/search/history', { params }),

    // 清除搜索历史
    clearHistory: (): Promise<void> =>
      apiClient.delete('/v1/kb/search/history'),
  },

  // 检索测试
  retrievalTest: {
    // 执行检索测试
    test: (data: {
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
      labels: Record<string, any>
    }> => apiClient.post('/v1/chunk/retrieval_test', data),
  },

  logs: knowledgeIngestionAPI,

  // Metadata 管理
  metadata: knowledgeMetadataAPI,

  generate: knowledgeIndexAPI,
}

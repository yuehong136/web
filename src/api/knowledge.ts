import { apiClient, type ApiEnvelope } from './client'
import { API_BASE_URL } from '@/constants'
import type {
  KnowledgeBase,
  DatasetDTO,
  CreateKBRequest,
  UpdateKBRequest,
  Document,
  ParseWebRequest,
  DocumentChunk,
  KnowledgeGraph,
  PaginationRequest,
  PaginatedData,
  MetadataSummaryResponse,
  MetadataBatchRequest,
  KBMetadataSettingsRequest,
  DocumentMetadataSettingsRequest,
  DocumentFilter,
  MetadataCondition,
  IDocumentInfoFilter,
} from '../types/api'

/**
 * apiClient baseURL 覆盖，使请求走 RESTful `/api/v1/...`（对标 src/api/memory.ts）。
 * 最终 URL = `${API_BASE_URL}/api` + `/v1/datasets...`。
 */
const sdkBase = { baseURL: `${API_BASE_URL}/api` }

/**
 * 防腐层：RESTful dataset 传输 DTO → 前端稳定领域模型 KnowledgeBase。
 * 仅吸收后端 `remap_dictionary_keys` 的 4 个字段名差异，其余字段透传。
 */
export const normalizeDataset = (dto: DatasetDTO): KnowledgeBase =>
  ({
    ...dto,
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
    get: (kbId: string): Promise<KnowledgeBase> =>
      apiClient.get(`/v1/kb/detail?kb_id=${kbId}`),

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
  document: {
    // 获取文档列表 - 使用新的API结构
    list: (params: {
      kb_id: string
      keywords?: string
      page?: number
      page_size?: number
      orderby?: string
      desc?: boolean
      filter_params: DocumentFilter
    }): Promise<{ total: number; docs: Document[] }> => {
      const {
        kb_id,
        keywords = '',
        page = 0,
        page_size = 0,
        orderby = 'create_time',
        desc = true,
        filter_params,
      } = params
      const queryParams = new URLSearchParams({
        kb_id,
        keywords: keywords,
        page: page.toString(),
        page_size: page_size.toString(),
        orderby,
        desc: desc.toString(),
      })
      // 构建筛选参数，包含 metadata 筛选和无元数据过滤
      const filterBody: DocumentFilter = {
        run_status: filter_params.run_status,
        suffix: filter_params.suffix,
        metadata: filter_params.metadata,
        return_empty_metadata: filter_params.return_empty_metadata,
      }
      return apiClient.post(
        `/v1/document/list?${queryParams.toString()}`,
        filterBody,
      )
    },

    // 获取文档筛选选项（动态获取可用的筛选值）
    // 注意：后端 API 是 POST /v1/document/filter，不是 GET /v1/document/get_filter
    getFilter: (kbId: string): Promise<{ filter: IDocumentInfoFilter }> =>
      apiClient.post('/v1/document/filter', { kb_id: kbId }),

    // 获取文档详情
    get: (docId: string): Promise<Document> =>
      apiClient.get(`/v1/document/get/${docId}`),

    // 上传文档
    upload: (
      kbId: string,
      files: File[],
      options?: {
        parser_id?: string
        chunk_size?: number
        chunk_overlap?: number
        parser_config?: Record<string, any>
      },
    ): Promise<
      Array<{
        id: string
        name: string
        size: number
        type: string
        thumbnail?: string
        created_time: string
        status: string
      }>
    > => {
      // kb_id作为查询参数，其他作为FormData
      const uploadData: Record<string, any> = {
        ...options,
      }

      return apiClient.uploadMultiple(
        `/v1/document/upload?kb_id=${kbId}`,
        files,
        uploadData,
      )
    },

    // 解析网页
    parseWeb: (data: ParseWebRequest): Promise<{ doc_id: string }> =>
      apiClient.post('/v1/document/web_crawl', data),

    // 更新文档解析器配置 - 使用 RAGFlow 的 change_parser API
    changeParser: (data: {
      doc_id: string
      parser_id: string
      parser_config?: Record<string, any>
    }): Promise<void> => apiClient.post('/v1/document/change_parser', data),

    // 删除文档
    delete: (docIds: string[]): Promise<void> =>
      apiClient.post('/v1/document/rm', { doc_id: docIds }),

    // 重新解析文档
    reparse: (
      docId: string,
      options?: {
        parser_id?: string
        chunk_size?: number
        chunk_overlap?: number
        parser_config?: Record<string, any>
      },
    ): Promise<{ task_id: string }> =>
      apiClient.post(`/v1/document/${docId}/reparse`, options),

    // 别名：parse -> 批量解析文档
    parse: (docIds: string[]): Promise<void> =>
      apiClient.post('/v1/document/run', { doc_ids: docIds }),

    // 获取文档内容
    getContent: (docId: string): Promise<{ content: string }> =>
      apiClient.get(`/v1/document/${docId}/content`),

    // 获取文档块
    getChunks: (
      docId: string,
      params?: PaginationRequest,
    ): Promise<PaginatedData<DocumentChunk>> =>
      apiClient.get(`/v1/document/${docId}/chunks`, { params }),

    // 更新文档块
    updateChunk: (
      chunkId: string,
      data: {
        content?: string
        metadata?: Record<string, any>
      },
    ): Promise<DocumentChunk> =>
      apiClient.post(`/v1/document/chunk/${chunkId}/update`, data),

    // 删除文档块
    deleteChunk: (chunkId: string): Promise<void> =>
      apiClient.delete(`/v1/document/chunk/${chunkId}`),

    // 预览文档
    preview: (docId: string): Promise<{ preview_url: string }> =>
      apiClient.get(`/v1/document/${docId}/preview`),

    // 下载文档
    download: (docId: string, filename?: string): Promise<void> =>
      apiClient.download(`/v1/document/get/${docId}?action=download`, filename),

    // 获取文档解析状态
    getParseStatus: (
      docId: string,
    ): Promise<{
      status: 'pending' | 'processing' | 'completed' | 'failed'
      progress: number
      error?: string
      chunks_created: number
    }> => apiClient.get(`/v1/document/${docId}/parse-status`),

    // 批量操作文档
    batch: (
      operation: 'delete' | 'reparse' | 'move',
      data: {
        doc_ids: string[]
        target_kb_id?: string
        parser_config?: Record<string, any>
      },
    ): Promise<{
      success_count: number
      failed_count: number
      errors?: any[]
    }> => apiClient.post('/v1/document/batch', { operation, ...data }),

    // 文档运行控制: 0=未开始/重置, 1=启动/重试, 2=取消当前解析任务
    run: (
      docIds: string[],
      run: number,
      deleteHistory?: boolean,
    ): Promise<void> =>
      apiClient.post('/v1/document/run', {
        doc_ids: docIds,
        run,
        delete: deleteHistory || false,
      }),

    // 更新文档状态 (启用/禁用) - 新接口
    changeStatus: (params: {
      doc_ids: string[] | string
      status: number
      doc_id?: string // 向后兼容
    }): Promise<{
      [docId: string]: {
        status?: string
        error?: string
      }
    }> => apiClient.post('/v1/document/change_status', params),

    // 更新文档状态 (启用/禁用) - 旧接口，保持兼容
    updateStatus: (docIds: string[], status: '0' | '1'): Promise<void> =>
      apiClient.post('/v1/document/status', { doc_ids: docIds, status }),

    // 重命名文档
    rename: (docId: string, name: string): Promise<Document> =>
      apiClient.post('/v1/document/rename', { doc_id: docId, name }),

    // 获取文档详细信息
    getInfos: (
      docIds: string[],
    ): Promise<
      Array<{
        location: string
        process_duration: number
        update_date: string
        meta_fields: Record<string, any>
        parser_id: string
        size: number
        create_time: number
        parser_config: Record<string, any>
        auth: any
        suffix: string
        update_time: number
        source_type: string
        token_num: number
        chunk_num: number
        run: string
        id: string
        type: string
        progress: number
        status: string
        thumbnail: string
        created_by: string
        progress_msg: string
        create_date: string
        kb_id: string
        name: string
        process_begin_at: string
      }>
    > => apiClient.post('/v1/document/infos', docIds),

    // 获取文档分段列表
    listChunks: (params: {
      doc_id: string
      page?: number
      size?: number
      keywords?: string
      available_int?: number
    }): Promise<{
      total: number
      chunks: Array<{
        chunk_id: string
        content_with_weight: string
        doc_id: string
        docnm_kwd: string
        important_kwd: string[]
        question_kwd: string[]
        img_id: string
        available_int: number
        positions: number[][]
      }>
      doc: {
        id: string
        thumbnail: string
        kb_id: string
        parser_id: string
        parser_config: any
        source_type: string
        type: string
        created_by: string
        name: string
        location: string
        size: number
        auth: any
        token_num: number
        chunk_num: number
        progress: number
        progress_msg: string
        process_begin_at: string
        process_duration: number
        meta_fields: any
        suffix: string
        run: string
        status: string
        create_date: string
        update_date: string
        create_time: number
        update_time: number
      }
    }> => apiClient.post('/v1/chunk/list', params),

    // 创建文档分段
    createChunk: (params: {
      doc_id: string
      content_with_weight: string
      important_kwd?: string[]
      question_kwd?: string[]
      available_int?: number
      /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀），用于图片类型分块 */
      image_base64?: string
    }): Promise<boolean> =>
      apiClient.post('/v1/chunk/create', {
        ...params,
        important_kwd: params.important_kwd ?? [],
        question_kwd: params.question_kwd ?? [],
      }),

    // 获取单个分段详情
    getChunk: (
      chunkId: string,
    ): Promise<{
      chunk_id: string
      content_with_weight: string
      doc_id: string
      docnm_kwd: string
      important_kwd: string[]
      question_kwd: string[]
      img_id: string
      available_int: number
      positions: number[][]
      /** 分块类型：text | image | table 等 */
      doc_type_kwd?: string
    }> =>
      apiClient.get(`/v1/chunk/get?chunk_id=${encodeURIComponent(chunkId)}`),

    // 设置/更新文档分段
    setChunk: (params: {
      doc_id: string
      chunk_id: string
      content_with_weight: string
      important_kwd?: string[]
      question_kwd?: string[]
      /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀），用于图片类型分块 */
      image_base64?: string
    }): Promise<boolean> =>
      apiClient.post('/v1/chunk/set', {
        ...params,
        important_kwd: params.important_kwd ?? [],
        question_kwd: params.question_kwd ?? [],
      }),

    // 设置文档元数据
    setDocumentMeta: (params: {
      doc_id: string
      meta: Record<string, any>
    }): Promise<boolean> => apiClient.post('/v1/document/set_meta', params),

    // 批量切换文档分段状态
    switchChunks: (params: {
      doc_id: string
      chunk_ids: string[]
      available_int: number
    }): Promise<boolean> => apiClient.post('/v1/chunk/switch', params),

    // 删除文档分段
    deleteChunks: (params: {
      doc_id: string
      chunk_ids: string[]
    }): Promise<boolean> => apiClient.post('/v1/chunk/rm', params),
  },

  // 标签管理
  tag: {
    // 获取所有标签
    list: (): Promise<Array<{ name: string; count: number; color?: string }>> =>
      apiClient.get('/v1/kb/tags'),

    // 创建标签
    create: (data: {
      name: string
      color?: string
      description?: string
    }): Promise<void> => apiClient.post('/v1/kb/tags', data),

    // 更新标签
    update: (
      tagName: string,
      data: {
        new_name?: string
        color?: string
        description?: string
      },
    ): Promise<void> => apiClient.put(`/v1/kb/tags/${tagName}`, data),

    // 删除标签
    delete: (tagName: string): Promise<void> =>
      apiClient.delete(`/v1/kb/tags/${tagName}`),

    // 为知识库添加标签
    addToKB: (kbId: string, tags: string[]): Promise<void> =>
      apiClient.post(`/v1/kb/${kbId}/tags`, { tags }),

    // 从知识库移除标签
    removeFromKB: (kbId: string, tags: string[]): Promise<void> =>
      apiClient.delete(`/v1/kb/${kbId}/tags`, { data: { tags } }),
  },

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

  // 知识库日志管理
  logs: {
    // 获取文件日志列表
    listFileLogs: (params: {
      kb_id: string
      page?: number
      page_size?: number
      keywords?: string
      operation_status?: string[]
    }): Promise<{
      logs: Array<{
        id: string
        create_date: string
        create_time: number
        document_id: string
        document_name: string
        document_suffix: string
        document_type: string
        dsl: any
        path: string[]
        task_id: string
        name: string
        kb_id: string
        operation_status: string
        parser_id: string
        pipeline_id: string
        pipeline_title: string
        avatar: string
        process_begin_at: string | null
        process_duration: number
        progress: number
        progress_msg: string
        source_type?: string
        source_from?: string
        status: string
        task_type: string
        tenant_id: string
        update_date: string
        update_time: number
      }>
      total: number
    }> => {
      const {
        kb_id,
        page = 1,
        page_size = 10,
        keywords = '',
        operation_status,
      } = params
      const queryParams = new URLSearchParams({
        kb_id,
        page: page.toString(),
        page_size: page_size.toString(),
        keywords,
      })
      return apiClient.post(
        `/v1/kb/list_pipeline_logs?${queryParams.toString()}`,
        {
          operation_status: operation_status || [],
        },
      )
    },

    // 获取数据集日志列表
    listDatasetLogs: (params: {
      kb_id: string
      page?: number
      page_size?: number
      keywords?: string
      operation_status?: string[]
    }): Promise<{
      logs: Array<{
        id: string
        create_date: string
        create_time: number
        kb_id: string
        operation_status: string
        process_begin_at: string | null
        process_duration: number
        progress: number
        progress_msg: string
        status: string
        task_type: string
        tenant_id: string
        update_date: string
        update_time: number
      }>
      total: number
    }> => {
      const {
        kb_id,
        page = 1,
        page_size = 10,
        keywords = '',
        operation_status,
      } = params
      const queryParams = new URLSearchParams({
        kb_id,
        page: page.toString(),
        page_size: page_size.toString(),
        keywords,
      })
      return apiClient.post(
        `/v1/kb/list_pipeline_dataset_logs?${queryParams.toString()}`,
        {
          operation_status: operation_status || [],
        },
      )
    },

    // 获取知识库基础统计信息
    getBasicInfo: (
      kbId: string,
    ): Promise<{
      cancelled: number
      failed: number
      finished: number
      processing: number
      downloaded: number
    }> => apiClient.get(`/v1/kb/basic_info?kb_id=${kbId}`),
  },

  // Metadata 管理
  metadata: {
    // 获取知识库 metadata 汇总 (聚合所有文档的 metadata)
    getSummary: (
      kbId: string,
      docIds?: string[],
    ): Promise<MetadataSummaryResponse> =>
      apiClient.post('/v1/document/metadata/summary', {
        kb_id: kbId,
        ...(docIds?.length ? { doc_ids: docIds } : {}),
      }),

    // 批量更新/删除 metadata 值
    batchUpdate: (
      data: MetadataBatchRequest,
    ): Promise<{
      updated_count: number
      deleted_count: number
    }> => apiClient.post('/v1/document/metadata/update', data),

    // 更新知识库 metadata 模板设置
    updateKBSettings: (data: KBMetadataSettingsRequest): Promise<void> =>
      apiClient.post('/v1/kb/update_metadata_setting', data),

    // 更新单文档 metadata 模板设置
    updateDocumentSettings: (
      data: DocumentMetadataSettingsRequest,
    ): Promise<void> =>
      apiClient.post('/v1/document/update_metadata_setting', data),

    // 更新单文档 metadata 值 (更新 meta_fields)
    updateDocumentMeta: (
      docId: string,
      meta: Record<string, any>,
    ): Promise<void> =>
      apiClient.post('/v1/document/set_meta', {
        doc_id: docId,
        meta: JSON.stringify(meta),
      }),
  },

  // GraphRAG / RAPTOR 生成任务
  generate: {
    // RESTful POST /api/v1/datasets/{dataset_id}/run_graphrag（id 进路径，无 body）
    runGraphRag: (payload: {
      kb_id: string
      doc_ids?: string[]
    }): Promise<{ graphrag_task_id: string }> =>
      apiClient.post(
        `/v1/datasets/${payload.kb_id}/run_graphrag`,
        undefined,
        sdkBase,
      ),

    // RESTful GET /api/v1/datasets/{dataset_id}/trace_graphrag
    traceGraphRag: (
      kbId: string,
    ): Promise<
      | {
          id: string
          progress: number
          progress_msg: string
          begin_at: string
          create_date: string
          update_date: string
          process_duration: number
          task_type: string
        }
      | Record<string, never>
    > => apiClient.get(`/v1/datasets/${kbId}/trace_graphrag`, sdkBase),

    // RESTful POST /api/v1/datasets/{dataset_id}/run_raptor（id 进路径，无 body）
    runRaptor: (payload: {
      kb_id: string
      doc_ids?: string[]
    }): Promise<{ raptor_task_id: string }> =>
      apiClient.post(
        `/v1/datasets/${payload.kb_id}/run_raptor`,
        undefined,
        sdkBase,
      ),

    // RESTful GET /api/v1/datasets/{dataset_id}/trace_raptor
    traceRaptor: (
      kbId: string,
    ): Promise<
      | {
          id: string
          progress: number
          progress_msg: string
          begin_at: string
          create_date: string
          update_date: string
          process_duration: number
          task_type: string
        }
      | Record<string, never>
    > => apiClient.get(`/v1/datasets/${kbId}/trace_raptor`, sdkBase),

    unbindPipelineTask: (params: {
      kb_id: string
      pipeline_task_type: 'GraphRAG' | 'RAPTOR'
    }): Promise<boolean> =>
      apiClient.delete(
        `/v1/kb/unbind_task?kb_id=${params.kb_id}&pipeline_task_type=${params.pipeline_task_type}`,
      ),
  },
}

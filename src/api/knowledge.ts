import { apiClient } from './client'
import type {
  KnowledgeBase,
  CreateKBRequest,
  UpdateKBRequest,
  Document,
  UploadDocumentRequest,
  ParseWebRequest,
  DocumentChunk,
  KnowledgeGraph,
  PaginationRequest,
  PaginatedData,
} from '../types/api'

export const knowledgeAPI = {
  // 知识库管理
  knowledgeBase: {
    // 获取知识库列表 - 使用POST方法，匹配后端ListKbsRequest
    list: (params?: {
      page?: number
      page_size?: number
      orderby?: string
      desc?: boolean
      keywords?: string
      owner_ids?: string[]
      filter_params?: {
        permissions?: string[]
        languages?: string[]
        parser_ids?: string[]
        embd_ids?: string[]
        doc_num_range?: [number, number]
        time_range?: string
      }
    }): Promise<{ kbs: KnowledgeBase[]; total: number }> => {
      // 构建查询参数
      const queryParams = new URLSearchParams({
        page: (params?.page || 1).toString(),
        page_size: (params?.page_size || 12).toString(),
        orderby: params?.orderby || 'update_time',
        desc: (params?.desc ?? true).toString(),
        keywords: params?.keywords || ''
      })
      
      return apiClient.post(`/v1/kb/list?${queryParams.toString()}`, { 
        owner_ids: params?.owner_ids || [],
        filter_params: params?.filter_params || {}
      })
    },

    // 获取知识库详情
    get: (kbId: string): Promise<KnowledgeBase> =>
      apiClient.get(`/v1/kb/detail?kb_id=${kbId}`),

    // 创建知识库
    create: (data: CreateKBRequest): Promise<{ kb_id: string }> =>
      apiClient.post('/v1/kb/create', data),

    // 更新知识库
    update: (data: UpdateKBRequest): Promise<KnowledgeBase> =>
      apiClient.post('/v1/kb/update', data),

    // 删除知识库
    delete: (kbId: string): Promise<void> =>
      apiClient.post('/v1/kb/rm', { kb_id: kbId }),

    // 复制知识库
    duplicate: (kbId: string, newName: string): Promise<{ kb_id: string }> =>
      apiClient.post(`/v1/kb/${kbId}/duplicate`, { name: newName }),

    // 获取知识图谱
    getKnowledgeGraph: (kbId: string): Promise<KnowledgeGraph> =>
      apiClient.get(`/v1/kb/${kbId}/knowledge_graph`),

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
    }> =>
      apiClient.post('/v1/kb/search', data),

    // 获取知识库统计
    getStats: (kbId: string): Promise<{
      document_count: number
      chunk_count: number
      total_tokens: number
      storage_used: number
      last_updated: string
    }> =>
      apiClient.get(`/v1/kb/${kbId}/stats`),

    // 重新索引知识库
    reindex: (kbId: string): Promise<{ task_id: string }> =>
      apiClient.post(`/v1/kb/${kbId}/reindex`),

    // 导出知识库
    export: (kbId: string, format: 'json' | 'csv'): Promise<void> =>
      apiClient.download(`/v1/kb/${kbId}/export?format=${format}`, `kb_${kbId}.${format}`),
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
      filter_params: {
        run_status?: string[]
        types?: string[]
        suffix?: string[]
      }
    }): Promise<{ total: number; docs: Document[] }> => {
      const { kb_id, keywords = '', page = 0, page_size = 0, orderby = 'create_time', desc = true, filter_params } = params
      const queryParams = new URLSearchParams({
        kb_id,
        keywords: keywords,
        page: page.toString(),
        page_size: page_size.toString(),
        orderby,
        desc: desc.toString()
      })
      return apiClient.post(`/v1/document/list?${queryParams.toString()}`, filter_params)
    },

    // 获取文档详情
    get: (docId: string): Promise<Document> =>
      apiClient.get(`/v1/document/get/${docId}`),

    // 上传文档
    upload: (kbId: string, files: File[], options?: {
      parser_id?: string
      chunk_size?: number
      chunk_overlap?: number
      parser_config?: Record<string, any>
    }): Promise<Array<{
      id: string
      name: string
      size: number
      type: string
      thumbnail?: string
      created_time: string
      status: string
    }>> => {
      // kb_id作为查询参数，其他作为FormData
      const uploadData: Record<string, any> = {
        ...options,
      }
      
      return apiClient.uploadMultiple(`/v1/document/upload?kb_id=${kbId}`, files, uploadData)
    },

    // 解析网页
    parseWeb: (data: ParseWebRequest): Promise<{ doc_id: string }> =>
      apiClient.post('/v1/document/web_crawl', data),

    // 更新文档
    update: (docId: string, data: {
      name?: string
      parser_config?: Record<string, any>
    }): Promise<Document> =>
      apiClient.post(`/v1/document/${docId}/update`, data),

    // 删除文档
    delete: (docIds: string[]): Promise<void> =>
      apiClient.post('/v1/document/rm', { doc_id: docIds }),

    // 重新解析文档
    reparse: (docId: string, options?: {
      parser_id?: string
      chunk_size?: number
      chunk_overlap?: number
      parser_config?: Record<string, any>
    }): Promise<{ task_id: string }> =>
      apiClient.post(`/v1/document/${docId}/reparse`, options),

    // 获取文档内容
    getContent: (docId: string): Promise<{ content: string }> =>
      apiClient.get(`/v1/document/${docId}/content`),

    // 获取文档块
    getChunks: (
      docId: string, 
      params?: PaginationRequest
    ): Promise<PaginatedData<DocumentChunk>> =>
      apiClient.get(`/v1/document/${docId}/chunks`, { params }),

    // 更新文档块
    updateChunk: (chunkId: string, data: {
      content?: string
      metadata?: Record<string, any>
    }): Promise<DocumentChunk> =>
      apiClient.post(`/v1/document/chunk/${chunkId}/update`, data),

    // 删除文档块
    deleteChunk: (chunkId: string): Promise<void> =>
      apiClient.delete(`/v1/document/chunk/${chunkId}`),

    // 预览文档
    preview: (docId: string): Promise<{ preview_url: string }> =>
      apiClient.get(`/v1/document/${docId}/preview`),

    // 下载文档
    download: (docId: string, filename?: string): Promise<void> =>
      apiClient.download(`/v1/document/get/${docId}`, filename),

    // 获取文档解析状态
    getParseStatus: (docId: string): Promise<{
      status: 'pending' | 'processing' | 'completed' | 'failed'
      progress: number
      error?: string
      chunks_created: number
    }> =>
      apiClient.get(`/v1/document/${docId}/parse-status`),

    // 批量操作文档
    batch: (operation: 'delete' | 'reparse' | 'move', data: {
      doc_ids: string[]
      target_kb_id?: string
      parser_config?: Record<string, any>
    }): Promise<{ success_count: number; failed_count: number; errors?: any[] }> =>
      apiClient.post('/v1/document/batch', { operation, ...data }),

    // 文档运行控制 (开始/停止解析) - 匹配后端RunRequest结构
    run: (docIds: string[], run: number, deleteHistory?: boolean): Promise<void> =>
      apiClient.post('/v1/document/run', { 
        doc_ids: docIds, 
        run, 
        delete: deleteHistory || false 
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
    }> =>
      apiClient.post('/v1/document/change_status', params),

    // 更新文档状态 (启用/禁用) - 旧接口，保持兼容
    updateStatus: (docIds: string[], status: '0' | '1'): Promise<void> =>
      apiClient.post('/v1/document/status', { doc_ids: docIds, status }),

    // 重命名文档
    rename: (docId: string, name: string): Promise<Document> =>
      apiClient.post('/v1/document/rename', { doc_id: docId, name }),

    // 获取文档详细信息
    getInfos: (docIds: string[]): Promise<Array<{
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
    }>> =>
      apiClient.post('/v1/document/infos', docIds),

    // 获取文档分段列表
    listChunks: (params: {
      doc_id: string
      page?: number
      size?: number
      keywords?: string
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
    }> =>
      apiClient.post('/v1/chunk/list', params),

    // 设置/更新文档分段
    setChunk: (params: {
      doc_id: string
      chunk_id: string
      content_with_weight: string
    }): Promise<boolean> =>
      apiClient.post('/v1/chunk/set', params),

    // 设置文档元数据
    setDocumentMeta: (params: {
      doc_id: string
      meta: Record<string, any>
    }): Promise<boolean> =>
      apiClient.post('/v1/document/set_meta', params),

    // 批量切换文档分段状态
    switchChunks: (params: {
      doc_id: string
      chunk_ids: string[]
      available_int: number
    }): Promise<boolean> =>
      apiClient.post('/v1/chunk/switch', params),

    // 删除文档分段
    deleteChunks: (params: {
      doc_id: string
      chunk_ids: string[]
    }): Promise<boolean> =>
      apiClient.post('/v1/chunk/rm', params),
  },

  // 标签管理
  tag: {
    // 获取所有标签
    list: (): Promise<Array<{ name: string; count: number; color?: string }>> =>
      apiClient.get('/v1/kb/tags'),

    // 创建标签
    create: (data: { name: string; color?: string; description?: string }): Promise<void> =>
      apiClient.post('/v1/kb/tags', data),

    // 更新标签
    update: (tagName: string, data: { 
      new_name?: string
      color?: string
      description?: string 
    }): Promise<void> =>
      apiClient.put(`/v1/kb/tags/${tagName}`, data),

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
    }): Promise<PaginatedData<DocumentChunk & { score: number; highlights: string[] }>> =>
      apiClient.post('/v1/kb/search/fulltext', data),

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
    }): Promise<Array<DocumentChunk & { score: number; search_type: 'vector' | 'fulltext' | 'hybrid' }>> =>
      apiClient.post('/v1/kb/search/hybrid', data),

    // 搜索建议
    suggestions: (query: string, limit?: number): Promise<string[]> =>
      apiClient.get('/v1/kb/search/suggestions', { 
        params: { query, limit } 
      }),

    // 搜索历史
    history: (params?: PaginationRequest): Promise<PaginatedData<{
      id: string
      query: string
      kb_ids: string[]
      result_count: number
      created_at: string
    }>> =>
      apiClient.get('/v1/kb/search/history', { params }),

    // 清除搜索历史
    clearHistory: (): Promise<void> =>
      apiClient.delete('/v1/kb/search/history'),
  },
}
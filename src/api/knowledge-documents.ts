import type {
  Document,
  DocumentChunk,
  DocumentFilter,
  IDocumentInfoFilter,
  PaginatedData,
  PaginationRequest,
  ParseWebRequest,
} from '@/types/api'
import { apiClient } from './client'
import {
  deleteDatasetDocuments,
  deleteDocumentsLegacy,
  getDatasetDocumentFilter,
  listDatasetDocuments,
  uploadDatasetDocuments,
} from './knowledge-rest'

export const knowledgeDocumentAPI = {
  list: (params: {
    kb_id: string
    keywords?: string
    page?: number
    page_size?: number
    orderby?: string
    desc?: boolean
    filter_params: DocumentFilter
  }): Promise<{ total: number; docs: Document[] }> =>
    listDatasetDocuments(params),

  getFilter: (
    kbId: string,
  ): Promise<{ total: number; filter: IDocumentInfoFilter }> =>
    getDatasetDocumentFilter(kbId),

  get: (docId: string): Promise<Document> =>
    apiClient.get(`/v1/document/get/${docId}`),

  upload: uploadDatasetDocuments,

  parseWeb: (data: ParseWebRequest): Promise<{ doc_id: string }> =>
    apiClient.post('/v1/document/web_crawl', data),

  changeParser: (data: {
    doc_id: string
    parser_id: string
    parser_config?: Record<string, unknown>
  }): Promise<void> => apiClient.post('/v1/document/change_parser', data),

  /**
   * 删除文档。
   *
   * TODO(2026-08-01): datasetId 可选是兼容期设计。待调用方与后端全部升级后，
   * 改为必填参数并删除 legacy 分支。
   */
  delete: (docIds: string[], datasetId?: string): Promise<void> =>
    datasetId
      ? deleteDatasetDocuments(datasetId, docIds)
      : deleteDocumentsLegacy(docIds),

  reparse: (
    docId: string,
    options?: {
      parser_id?: string
      chunk_size?: number
      chunk_overlap?: number
      parser_config?: Record<string, unknown>
    },
  ): Promise<{ task_id: string }> =>
    apiClient.post(`/v1/document/${docId}/reparse`, options),

  parse: (docIds: string[]): Promise<void> =>
    apiClient.post('/v1/document/run', { doc_ids: docIds }),

  getContent: (docId: string): Promise<{ content: string }> =>
    apiClient.get(`/v1/document/${docId}/content`),

  getChunks: (
    docId: string,
    params?: PaginationRequest,
  ): Promise<PaginatedData<DocumentChunk>> =>
    apiClient.get(`/v1/document/${docId}/chunks`, { params }),

  updateChunk: (
    chunkId: string,
    data: {
      content?: string
      metadata?: Record<string, unknown>
    },
  ): Promise<DocumentChunk> =>
    apiClient.post(`/v1/document/chunk/${chunkId}/update`, data),

  deleteChunk: (chunkId: string): Promise<void> =>
    apiClient.delete(`/v1/document/chunk/${chunkId}`),

  preview: (docId: string): Promise<{ preview_url: string }> =>
    apiClient.get(`/v1/document/${docId}/preview`),

  download: (docId: string, filename?: string): Promise<void> =>
    apiClient.download(`/v1/document/get/${docId}?action=download`, filename),

  getParseStatus: (
    docId: string,
  ): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    error?: string
    chunks_created: number
  }> => apiClient.get(`/v1/document/${docId}/parse-status`),

  batch: (
    operation: 'delete' | 'reparse' | 'move',
    data: {
      doc_ids: string[]
      target_kb_id?: string
      parser_config?: Record<string, unknown>
    },
  ): Promise<{
    success_count: number
    failed_count: number
    errors?: unknown[]
  }> => apiClient.post('/v1/document/batch', { operation, ...data }),

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

  changeStatus: (params: {
    doc_ids: string[] | string
    status: number
    doc_id?: string
  }): Promise<{
    [docId: string]: {
      status?: string
      error?: string
    }
  }> => apiClient.post('/v1/document/change_status', params),

  updateStatus: (docIds: string[], status: '0' | '1'): Promise<void> =>
    apiClient.post('/v1/document/status', { doc_ids: docIds, status }),

  rename: (docId: string, name: string): Promise<Document> =>
    apiClient.post('/v1/document/rename', { doc_id: docId, name }),

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
      parser_config: unknown
      source_type: string
      type: string
      created_by: string
      name: string
      location: string
      size: number
      auth: unknown
      token_num: number
      chunk_num: number
      progress: number
      progress_msg: string
      process_begin_at: string
      process_duration: number
      meta_fields: unknown
      suffix: string
      run: string
      status: string
      create_date: string
      update_date: string
      create_time: number
      update_time: number
    }
  }> => apiClient.post('/v1/chunk/list', params),

  createChunk: (params: {
    doc_id: string
    content_with_weight: string
    important_kwd?: string[]
    question_kwd?: string[]
    available_int?: number
    /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀）。 */
    image_base64?: string
  }): Promise<boolean> =>
    apiClient.post('/v1/chunk/create', {
      ...params,
      important_kwd: params.important_kwd ?? [],
      question_kwd: params.question_kwd ?? [],
    }),

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
    doc_type_kwd?: string
  }> => apiClient.get(`/v1/chunk/get?chunk_id=${encodeURIComponent(chunkId)}`),

  setChunk: (params: {
    doc_id: string
    chunk_id: string
    content_with_weight: string
    important_kwd?: string[]
    question_kwd?: string[]
    /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀）。 */
    image_base64?: string
  }): Promise<boolean> =>
    apiClient.post('/v1/chunk/set', {
      ...params,
      important_kwd: params.important_kwd ?? [],
      question_kwd: params.question_kwd ?? [],
    }),

  switchChunks: (params: {
    doc_id: string
    chunk_ids: string[]
    available_int: number
  }): Promise<boolean> => apiClient.post('/v1/chunk/switch', params),

  deleteChunks: (params: {
    doc_id: string
    chunk_ids: string[]
  }): Promise<boolean> => apiClient.post('/v1/chunk/rm', params),
}

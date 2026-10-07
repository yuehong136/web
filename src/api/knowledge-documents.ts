import { ingestDatasetDocuments } from './knowledge-document-ingest'
import { changeDatasetDocumentStatus } from './knowledge-document-status'
import type { Document, DocumentFilter, IDocumentInfoFilter } from '@/types/api'
import { apiClient } from './client'
import {
  parseDatasetDocuments,
  stopDatasetDocuments,
} from './knowledge-document-parsing'
import { knowledgeRestConfig as sdkBase } from './knowledge-config'
import {
  createEmptyDatasetDocument,
  createWebDatasetDocument,
  deleteDatasetDocuments,
  deleteDocumentsLegacy,
  getDatasetDocumentFilter,
  listDatasetDocuments,
  uploadDatasetDocuments,
} from './knowledge-rest'

interface CanonicalChunk {
  id?: string
  chunk_id?: string
  content?: string
  content_with_weight?: string
  document_id?: string
  doc_id?: string
  docnm_kwd?: string
  important_keywords?: string[]
  important_kwd?: string[]
  questions?: string[]
  question_kwd?: string[]
  image_id?: string
  img_id?: string
  available?: boolean
  available_int?: number
  positions?: number[][]
  position_int?: number[][]
  doc_type_kwd?: string
}

interface CanonicalChunkList {
  total: number
  chunks: CanonicalChunk[]
  doc: Record<string, unknown>
}

interface LegacyChunk {
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
}

interface LegacyChunkList {
  total: number
  chunks: LegacyChunk[]
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
}

const normalizeChunk = (chunk: CanonicalChunk) => ({
  chunk_id: chunk.id ?? chunk.chunk_id ?? '',
  content_with_weight: chunk.content ?? chunk.content_with_weight ?? '',
  doc_id: chunk.document_id ?? chunk.doc_id ?? '',
  docnm_kwd: chunk.docnm_kwd ?? '',
  important_kwd: chunk.important_keywords ?? chunk.important_kwd ?? [],
  question_kwd: chunk.questions ?? chunk.question_kwd ?? [],
  img_id: chunk.image_id ?? chunk.img_id ?? '',
  available_int:
    chunk.available === undefined
      ? (chunk.available_int ?? 1)
      : Number(chunk.available),
  positions: chunk.positions ?? chunk.position_int ?? [],
  doc_type_kwd: chunk.doc_type_kwd,
})

const normalizeChunkList = (response: CanonicalChunkList) => {
  const doc = response.doc
  return {
    total: response.total,
    chunks: response.chunks.map(normalizeChunk),
    doc: {
      ...doc,
      kb_id: doc.dataset_id,
      parser_id: doc.chunk_method,
      token_num: doc.token_count,
      chunk_num: doc.chunk_count,
    },
  }
}

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
  upload: uploadDatasetDocuments,
  createWeb: createWebDatasetDocument,
  createEmpty: createEmptyDatasetDocument,

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
  ingest: ingestDatasetDocuments,
  parse: parseDatasetDocuments,
  stop: stopDatasetDocuments,
  download: (docId: string, filename?: string): Promise<void> =>
    apiClient.download(`/v1/document/get/${docId}?action=download`, filename),
  changeStatus: changeDatasetDocumentStatus,
  rename: (docId: string, name: string): Promise<Document> =>
    apiClient.post('/v1/document/rename', { doc_id: docId, name }),

  listChunks: (params: {
    kb_id: string
    doc_id: string
    page?: number
    size?: number
    keywords?: string
    available_int?: number
  }): Promise<LegacyChunkList> =>
    apiClient
      .get<CanonicalChunkList>(
        `/datasets/${params.kb_id}/documents/${params.doc_id}/chunks`,
        {
          ...sdkBase,
          params: {
            page: params.page,
            page_size: params.size,
            keywords: params.keywords,
            available:
              params.available_int === undefined
                ? undefined
                : Boolean(params.available_int),
          },
        },
      )
      .then(normalizeChunkList) as Promise<LegacyChunkList>,

  createChunk: (params: {
    kb_id: string
    doc_id: string
    content_with_weight: string
    important_kwd?: string[]
    question_kwd?: string[]
    available_int?: number
    /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀）。 */
    image_base64?: string
  }): Promise<boolean> =>
    apiClient
      .post(
        `/datasets/${params.kb_id}/documents/${params.doc_id}/chunks`,
        {
          content: params.content_with_weight,
          important_keywords: params.important_kwd ?? [],
          questions: params.question_kwd ?? [],
          image_base64: params.image_base64,
        },
        sdkBase,
      )
      .then(() => true),
  setChunk: (params: {
    kb_id: string
    doc_id: string
    chunk_id: string
    content_with_weight: string
    important_kwd?: string[]
    question_kwd?: string[]
    /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀）。 */
    image_base64?: string
    image_update_mode?: 'append' | 'replace'
  }): Promise<boolean> =>
    apiClient
      .patch(
        `/datasets/${params.kb_id}/documents/${params.doc_id}/chunks/${params.chunk_id}`,
        {
          content: params.content_with_weight,
          important_keywords: params.important_kwd ?? [],
          questions: params.question_kwd ?? [],
          image_base64: params.image_base64,
          image_update_mode: params.image_update_mode,
        },
        sdkBase,
      )
      .then(() => true),

  switchChunks: (params: {
    kb_id: string
    doc_id: string
    chunk_ids: string[]
    available_int: number
  }): Promise<boolean> =>
    apiClient
      .patch(
        `/datasets/${params.kb_id}/documents/${params.doc_id}/chunks`,
        {
          chunk_ids: params.chunk_ids,
          available_int: params.available_int,
        },
        sdkBase,
      )
      .then(() => true),

  deleteChunks: (params: {
    kb_id: string
    doc_id: string
    chunk_ids: string[]
  }): Promise<boolean> =>
    apiClient
      .delete(`/datasets/${params.kb_id}/documents/${params.doc_id}/chunks`, {
        ...sdkBase,
        data: { chunk_ids: params.chunk_ids },
      })
      .then(() => true),
}

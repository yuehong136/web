import type {
  DocumentMetadataSettingsRequest,
  KBMetadataSettingsRequest,
  MetadataBatchRequest,
  MetadataSummaryResponse,
} from '@/types/metadata'
import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'
import { withLegacyFallback } from './legacy-fallback'

export const knowledgeMetadataAPI = {
  /** 获取知识库 metadata 汇总。 */
  getSummary: (
    kbId: string,
    docIds?: string[],
  ): Promise<MetadataSummaryResponse> =>
    apiClient.get(`/v1/datasets/${encodeURIComponent(kbId)}/metadata/summary`, {
      ...knowledgeRestConfig,
      params: docIds?.length ? { doc_ids: docIds.join(',') } : undefined,
    }),

  /** 批量更新或删除文档 metadata 值。 */
  batchUpdate: (
    data: MetadataBatchRequest,
  ): Promise<{ updated_count: number; deleted_count: number }> =>
    apiClient.post('/v1/document/metadata/update', data),

  /** 更新知识库 metadata 模板设置。 */
  updateKBSettings: (data: KBMetadataSettingsRequest): Promise<void> =>
    apiClient.post('/v1/kb/update_metadata_setting', data),

  /**
   * 更新单文档 metadata 模板设置。
   *
   * TODO(2026-08-01): 后端全环境上线 RESTful 路由后删除 legacy 回退。
   */
  updateDocumentSettings: ({
    kb_id,
    doc_id,
    metadata,
  }: DocumentMetadataSettingsRequest): Promise<void> =>
    withLegacyFallback(
      () =>
        apiClient.put<void>(
          `/v1/datasets/${encodeURIComponent(kb_id)}/documents/${encodeURIComponent(doc_id)}/metadata/config`,
          { metadata },
          knowledgeRestConfig,
        ),
      () =>
        apiClient.post<void>('/v1/document/update_metadata_setting', {
          doc_id,
          metadata,
        }),
    ),

  /** 更新单文档 metadata 值。 */
  updateDocumentMeta: (
    kbId: string,
    docId: string,
    meta: Record<string, unknown>,
  ): Promise<void> =>
    apiClient.put(
      `/v1/datasets/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}`,
      { meta_fields: meta },
      knowledgeRestConfig,
    ),
}

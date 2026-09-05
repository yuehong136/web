import type {
  DocumentMetadataSettingsRequest,
  KBMetadataSettingsRequest,
  MetadataBatchRequest,
  MetadataFieldDefinition,
  MetadataSummaryResponse,
} from '@/types/metadata'
import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'
import { withLegacyFallback } from './legacy-fallback'

export const knowledgeMetadataAPI = {
  getConfig: (
    datasetId: string,
  ): Promise<{ enabled: boolean; fields: MetadataFieldDefinition[] }> =>
    apiClient.get(
      `/v1/datasets/${encodeURIComponent(datasetId)}/metadata/config`,
      knowledgeRestConfig,
    ),

  getFlattened: (datasetIds: string[]): Promise<Record<string, unknown>> =>
    apiClient.get('/v1/datasets/metadata/flattened', {
      ...knowledgeRestConfig,
      params: { dataset_ids: datasetIds.join(',') },
    }),

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
  ): Promise<{ updated: number; matched_docs: number }> => {
    const { dataset_id, selector, updates, deletes } = data
    return apiClient.patch(
      `/v1/datasets/${encodeURIComponent(dataset_id)}/documents/metadatas`,
      { selector, updates, deletes },
      knowledgeRestConfig,
    )
  },

  /** 更新知识库 metadata 模板设置。 */
  updateKBSettings: (data: KBMetadataSettingsRequest): Promise<void> =>
    apiClient.put(
      `/v1/datasets/${encodeURIComponent(data.kb_id)}/metadata/config`,
      { enabled: data.enable_metadata ?? true, fields: data.metadata },
      knowledgeRestConfig,
    ),

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
    apiClient.patch(
      `/v1/datasets/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}`,
      { meta_fields: meta },
      knowledgeRestConfig,
    ),
}

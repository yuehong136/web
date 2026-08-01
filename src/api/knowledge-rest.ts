import { API_BASE_URL } from '@/constants'
import type { Document, DocumentFilter, IDocumentInfoFilter } from '@/types/api'
import { APIError, apiClient } from './client'

export const knowledgeRestConfig = { baseURL: `${API_BASE_URL}/api` }

export type DocumentUploadOptions = {
  parser_id?: string
  chunk_size?: number
  chunk_overlap?: number
  parser_config?: Record<string, unknown>
}

export type UploadedDatasetDocument = {
  id: string
  name: string
  size: number
  type: string
  thumbnail?: string
  created_time: string
  status: string
  run?: string
}

export type DatasetDocumentDTO = Omit<
  Document,
  'kb_id' | 'chunk_num' | 'token_num' | 'parser_id' | 'run'
> & {
  dataset_id: string
  chunk_count: number
  token_count: number
  chunk_method: string
  run: string
}

export type ListDatasetDocumentsParams = {
  kb_id: string
  keywords?: string
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  filter_params: DocumentFilter
}

const documentRunStatusToLegacy: Record<string, string> = {
  UNSTART: '0',
  RUNNING: '1',
  CANCEL: '2',
  DONE: '3',
  FAIL: '4',
  SCHEDULE: '5',
}

export const normalizeDatasetDocument = (dto: DatasetDocumentDTO): Document =>
  ({
    ...dto,
    kb_id: dto.dataset_id,
    chunk_num: dto.chunk_count,
    token_num: dto.token_count,
    parser_id: dto.chunk_method,
    run: documentRunStatusToLegacy[dto.run] ?? dto.run,
  }) as Document

export const buildDatasetDocumentListQuery = (
  params: Omit<ListDatasetDocumentsParams, 'kb_id'>,
): string => {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('page_size', String(params.page_size ?? 30))
  query.set('orderby', params.orderby ?? 'create_time')
  query.set('desc', String(params.desc ?? true))
  if (params.keywords) query.set('keywords', params.keywords)

  const { filter_params: filters } = params
  filters.run_status?.forEach((status) => query.append('run_status', status))
  filters.types?.forEach((type) => query.append('types', type))
  filters.suffix?.forEach((suffix) => query.append('suffix', suffix))
  if (filters.metadata) query.set('metadata', JSON.stringify(filters.metadata))
  if (filters.return_empty_metadata) query.set('return_empty_metadata', 'true')

  return query.toString()
}

export async function listDatasetDocuments(
  params: ListDatasetDocumentsParams,
): Promise<{ total: number; docs: Document[] }> {
  const { kb_id: datasetId, ...queryParams } = params
  const query = buildDatasetDocumentListQuery(queryParams)
  const result = await apiClient.get<{
    total: number
    docs: DatasetDocumentDTO[]
  }>(
    `/v1/datasets/${encodeURIComponent(datasetId)}/documents?${query}`,
    knowledgeRestConfig,
  )
  return {
    total: result.total,
    docs: result.docs.map(normalizeDatasetDocument),
  }
}

export async function getDatasetDocumentFilter(
  datasetId: string,
): Promise<{ total: number; filter: IDocumentInfoFilter }> {
  return apiClient.get<{ total: number; filter: IDocumentInfoFilter }>(
    `/v1/datasets/${encodeURIComponent(datasetId)}/documents?type=filter`,
    knowledgeRestConfig,
  )
}

/**
 * 后端还没有 RESTful 删除路由时的判据。
 *
 * 路由不存在只会以 HTTP 404/405 出现——后端的业务错误一律是 HTTP 200 + 信封里的
 * 非零 code，不会走到这里。
 *
 * 返回值判据是兜底：apiClient 现在会对非 2xx 的非信封响应抛 APIError，但反代把
 * 上游 404 改写成 200 + `{"detail": ...}` 这类形状仍只能从返回值看出来。
 */
const isMissingRouteError = (error: unknown): boolean =>
  error instanceof APIError && (error.status === 404 || error.status === 405)

const looksLikeMissingRouteResult = (result: unknown): boolean =>
  typeof result === 'object' &&
  result !== null &&
  'detail' in result &&
  !('deleted' in result)

/**
 * 删除数据集下的文档。
 *
 * TODO(2026-08-01): 兼容期实现——优先打统一的 RESTful 入口，只有后端尚未上线该
 * 路由（404/405）时才回落到旧的 web 端点 `POST /v1/document/rm`。待所有部署环境
 * 的后端都带上 `DELETE /api/v1/datasets/{dataset_id}/documents` 后，删掉本文件的
 * 回退分支与 `deleteDocumentsLegacy`、`knowledge.ts` 里 datasetId 可选的分支，只
 * 保留 RESTful 调用；后端届时也可以摘掉 `/v1/document/rm`。
 */
export async function deleteDatasetDocuments(
  datasetId: string,
  documentIds: string[],
): Promise<void> {
  try {
    const result = await apiClient.delete<unknown>(
      `/v1/datasets/${encodeURIComponent(datasetId)}/documents`,
      { ...knowledgeRestConfig, data: { ids: documentIds } },
    )
    if (!looksLikeMissingRouteResult(result)) return
  } catch (error) {
    if (!isMissingRouteError(error)) throw error
  }

  console.warn(
    '[documents] RESTful delete route unavailable, falling back to /v1/document/rm',
  )
  await deleteDocumentsLegacy(documentIds)
}

/**
 * TODO(2026-08-01): 兼容期实现，随 {@link deleteDatasetDocuments} 的回退分支一起删除。
 */
export async function deleteDocumentsLegacy(
  documentIds: string[],
): Promise<void> {
  await apiClient.post('/v1/document/rm', { doc_id: documentIds })
}

export function uploadDatasetDocuments(
  datasetId: string,
  files: File[],
  options?: DocumentUploadOptions,
): Promise<UploadedDatasetDocument[]> {
  const uploadData: Record<string, unknown> = { ...options }

  return apiClient.uploadMultiple(
    `/v1/datasets/${datasetId}/documents`,
    files,
    uploadData,
    knowledgeRestConfig,
  )
}

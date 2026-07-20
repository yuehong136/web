import { API_BASE_URL } from '@/constants'
import type { Document, DocumentFilter } from '@/types/api'
import { apiClient } from './client'

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

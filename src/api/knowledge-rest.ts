import { API_BASE_URL } from '@/constants'
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

import { API_BASE_URL, API_VERSION } from '@/constants'
import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'

export const getDocumentFileUrl = (
  docId: string,
  action: 'preview' | 'download' = 'preview',
): string =>
  `${API_BASE_URL}/api/${API_VERSION}/documents/${encodeURIComponent(docId)}/${action}`

export const downloadDocumentFile = (
  docId: string,
  filename?: string,
): Promise<void> =>
  apiClient.download(
    `/documents/${encodeURIComponent(docId)}/download`,
    filename,
    knowledgeRestConfig,
  )

export const downloadGeneratedAttachment = (
  attachmentId: string,
  filename: string,
  ext: string,
): Promise<void> =>
  apiClient.download(
    `/documents/runtime/${encodeURIComponent(attachmentId)}/download`,
    filename,
    { ...knowledgeRestConfig, params: { ext } },
  )

import { API_BASE_URL, API_VERSION } from '@/constants'
import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'
import { readResponseError } from './response-error'

const downloadConfig = {
  ...knowledgeRestConfig,
  // File bytes may be JSON, including an envelope-shaped source document.
  // Canonical binary endpoints use non-200 HTTP statuses for errors.
  readResponse: async (response: Response): Promise<Response> => {
    if (response.status !== 200) throw await readResponseError(response)
    return response
  },
}

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
    downloadConfig,
  )

export const downloadGeneratedAttachment = (
  attachmentId: string,
  filename: string,
  ext: string,
): Promise<void> =>
  apiClient.download(
    `/documents/runtime/${encodeURIComponent(attachmentId)}/download`,
    filename,
    { ...downloadConfig, params: { ext } },
  )

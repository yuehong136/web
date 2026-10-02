import { APIError, apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'

export type DocumentEnableStatus = 0 | 1
export type DocumentStatusRequest = {
  datasetId: string
  docIds: string[]
  status: DocumentEnableStatus
}

/** Capture the request before any asynchronous work or caller mutation. */
export function captureDocumentStatusRequest(
  datasetId: string,
  docIds: string[],
  status: DocumentEnableStatus,
): DocumentStatusRequest {
  if (
    typeof datasetId !== 'string' ||
    !datasetId.trim() ||
    !Array.isArray(docIds) ||
    !docIds.length ||
    docIds.some((id) => typeof id !== 'string' || !id.trim()) ||
    (status !== 0 && status !== 1)
  ) {
    throw new APIError(
      400,
      'INVALID_DOCUMENT_STATUS_REQUEST',
      'Invalid document status request',
    )
  }
  return { datasetId, docIds: [...new Set(docIds)], status }
}

export async function changeDatasetDocumentStatus(
  datasetId: string,
  params: { doc_ids: string[]; status: DocumentEnableStatus },
): Promise<unknown> {
  const request = captureDocumentStatusRequest(
    datasetId,
    params.doc_ids,
    params.status,
  )
  return apiClient.post<unknown>(
    `/datasets/${encodeURIComponent(request.datasetId)}/documents/batch-update-status`,
    { doc_ids: request.docIds, status: request.status },
    knowledgeRestConfig,
  )
}

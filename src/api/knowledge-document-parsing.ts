import { APIError, apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'

interface ParseBatchResult {
  success_count: number
  errors?: unknown[]
}

async function runBatch(
  datasetId: string,
  documentIds: string[],
  operation: 'parse' | 'stop',
): Promise<void> {
  if (!datasetId || !documentIds.length) {
    throw new APIError(
      400,
      'INVALID_DOCUMENT_SELECTION',
      'A dataset and documents are required',
    )
  }
  const uniqueIds = [...new Set(documentIds)]
  const result = await apiClient.post<ParseBatchResult>(
    `/v1/datasets/${encodeURIComponent(datasetId)}/documents/${operation}`,
    { document_ids: uniqueIds },
    knowledgeRestConfig,
  )
  if (result?.success_count !== uniqueIds.length || result.errors?.length) {
    throw new APIError(
      200,
      'INCOMPLETE_DOCUMENT_OPERATION',
      'Some documents could not be processed',
      result,
    )
  }
}

export async function parseDatasetDocuments(
  datasetId: string,
  documentIds: string[],
  deleteHistory = false,
): Promise<void> {
  // The legacy clear-history option has no equivalent in the canonical parse contract yet.
  if (deleteHistory) {
    if (!datasetId || !documentIds.length) {
      throw new APIError(
        400,
        'INVALID_DOCUMENT_SELECTION',
        'A dataset and documents are required',
      )
    }
    await apiClient.post('/v1/document/run', {
      doc_ids: [...new Set(documentIds)],
      run: 1,
      delete: true,
    })
    return
  }
  await runBatch(datasetId, documentIds, 'parse')
}

export async function stopDatasetDocuments(
  datasetId: string,
  documentIds: string[],
): Promise<void> {
  await runBatch(datasetId, documentIds, 'stop')
}

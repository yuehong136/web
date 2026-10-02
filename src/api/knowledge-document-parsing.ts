import { APIError, apiClient, type ApiEnvelope } from './client'
import { knowledgeRestConfig } from './knowledge-config'
import { captureDocumentOperation } from './knowledge-document-ingest'

interface ParseBatchResult {
  success_count: number
  errors?: unknown[]
}

async function runBatch(
  datasetId: string,
  documentIds: string[],
  operation: 'parse' | 'stop',
): Promise<void> {
  const { docIds: uniqueIds } = captureDocumentOperation(
    datasetId,
    documentIds,
    operation === 'parse' ? 1 : 2,
  )
  const acknowledgement = await apiClient.post<ApiEnvelope<ParseBatchResult>>(
    `/v1/datasets/${encodeURIComponent(datasetId)}/documents/${operation}`,
    { document_ids: uniqueIds },
    { ...knowledgeRestConfig, withEnvelope: true, responseContract: 'rest200' },
  )
  const result = acknowledgement?.data
  if (
    acknowledgement?.retcode !== 0 ||
    result?.success_count !== uniqueIds.length ||
    (result.errors !== undefined &&
      (!Array.isArray(result.errors) || result.errors.length > 0))
  ) {
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
): Promise<void> {
  await runBatch(datasetId, documentIds, 'parse')
}

export async function stopDatasetDocuments(
  datasetId: string,
  documentIds: string[],
): Promise<void> {
  await runBatch(datasetId, documentIds, 'stop')
}

import { APIError, apiClient, type ApiEnvelope } from './client'
import { knowledgeRestConfig } from './knowledge-config'

export type DocumentRun = 0 | 1 | 2
export type ReparseOptions = {
  deleteChunks: boolean
  applyMetadataSettings: boolean
}
export type DocumentIngestOptions = {
  run: DocumentRun
  delete: boolean
  apply_kb: boolean
}
export type DocumentOperationRequest = {
  datasetId: string
  docIds: string[]
  run: DocumentRun
  reparseOptions?: ReparseOptions
}

export function captureDocumentOperation(
  datasetId: string,
  docIds: string[],
  run: DocumentRun,
  reparseOptions?: ReparseOptions,
): DocumentOperationRequest {
  if (
    typeof datasetId !== 'string' ||
    !datasetId.trim() ||
    !Array.isArray(docIds) ||
    !docIds.length ||
    docIds.some((id) => typeof id !== 'string' || !id.trim()) ||
    ![0, 1, 2].includes(run) ||
    typeof run !== 'number' ||
    (reparseOptions !== undefined &&
      (run !== 1 ||
        typeof reparseOptions?.deleteChunks !== 'boolean' ||
        typeof reparseOptions?.applyMetadataSettings !== 'boolean'))
  ) {
    throw new APIError(
      400,
      'INVALID_DOCUMENT_OPERATION',
      'Invalid document operation',
    )
  }
  return {
    datasetId,
    docIds: [...new Set(docIds)],
    run,
    ...(reparseOptions ? { reparseOptions: { ...reparseOptions } } : {}),
  }
}

/** Acknowledges submission/reuse only. It never proves worker completion. */
export async function ingestDatasetDocuments(
  datasetId: string,
  docIds: string[],
  options: DocumentIngestOptions,
): Promise<void> {
  const request = captureDocumentOperation(datasetId, docIds, options?.run)
  if (
    typeof options?.delete !== 'boolean' ||
    typeof options?.apply_kb !== 'boolean' ||
    (options.apply_kb && options.run !== 1) ||
    Object.keys(options).some(
      (key) => !['run', 'delete', 'apply_kb'].includes(key),
    )
  ) {
    throw new APIError(
      400,
      'INVALID_DOCUMENT_OPERATION',
      'Invalid ingest options',
    )
  }
  const acknowledgement = await apiClient.post<ApiEnvelope<unknown>>(
    '/v1/documents/ingest',
    {
      doc_ids: request.docIds,
      run: request.run,
      delete: options.delete,
      apply_kb: options.apply_kb,
    },
    { ...knowledgeRestConfig, withEnvelope: true, responseContract: 'rest200' },
  )
  if (acknowledgement?.retcode !== 0 || acknowledgement.data !== true) {
    throw new APIError(
      200,
      'INVALID_INGEST_ACK',
      'Invalid ingest acknowledgement',
    )
  }
}

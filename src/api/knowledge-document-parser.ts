import type { Document } from '@/types/api'
import { APIError, apiClient, type ApiEnvelope } from './client'
import { knowledgeRestConfig } from './knowledge-config'
import { responseError } from './response-error'
import {
  normalizeDatasetDocument,
  type DatasetDocumentDTO,
} from './knowledge-rest'

export type DocumentParserPatch = {
  chunk_method?: string
  pipeline_id?: string
  parser_config?: Record<string, unknown>
}

export type DocumentParserRequest = Readonly<{
  datasetId: string
  docId: string
  patch: DocumentParserPatch
}>

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Feature-local JSON reader keeps HTTP and raw envelope facts before unwrapping. */
async function readParserEnvelope(
  response: Response,
): Promise<ApiEnvelope<unknown>> {
  if (response.status === 401)
    throw new APIError(401, 'UNAUTHORIZED', 'Unauthorized')
  if (!response.headers.get('content-type')?.includes('application/json'))
    return invalidParserResponse()
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return invalidParserResponse()
  }
  if (!record(body)) return invalidParserResponse()
  const code = Object.hasOwn(body, 'retcode') ? body.retcode : body.code
  if (!response.ok || code !== 0)
    throw responseError(response.status, body, 'Document request failed')
  if (
    response.status !== 200 ||
    body.code !== 0 ||
    (Object.hasOwn(body, 'retcode') && body.retcode !== 0)
  )
    return invalidParserResponse()
  return { data: body.data, retcode: 0, retmsg: body.message as string }
}

export function invalidParserResponse(): never {
  throw new APIError(
    502,
    'INVALID_DOCUMENT_RESPONSE',
    'Invalid document response',
  )
}

/** Validate fresh canonical state, never fill fields from the submitted draft. */
export function requireParserDocument(
  value: unknown,
  datasetId: string,
  docId: string,
): Document {
  if (!record(value)) return invalidParserResponse()
  const nonnegative = (key: string) =>
    typeof value[key] === 'number' &&
    Number.isSafeInteger(value[key]) &&
    value[key] >= 0
  if (
    value.id !== docId ||
    value.dataset_id !== datasetId ||
    typeof value.name !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.chunk_method !== 'string' ||
    !value.chunk_method ||
    !Object.hasOwn(value, 'pipeline_id') ||
    (value.pipeline_id !== null && typeof value.pipeline_id !== 'string') ||
    !record(value.parser_config) ||
    !['0', '1'].includes(String(value.status)) ||
    typeof value.status !== 'string' ||
    typeof value.run !== 'string' ||
    !value.run ||
    !nonnegative('chunk_count') ||
    !nonnegative('token_count') ||
    !nonnegative('size') ||
    typeof value.progress !== 'number' ||
    !Number.isFinite(value.progress) ||
    typeof value.update_time !== 'number' ||
    !Number.isFinite(value.update_time) ||
    (Object.hasOwn(value, 'enabled') &&
      value.enabled !== (value.status === '1')) ||
    (Object.hasOwn(value, 'kb_id') && value.kb_id !== datasetId) ||
    (Object.hasOwn(value, 'parser_id') &&
      value.parser_id !== value.chunk_method) ||
    (Object.hasOwn(value, 'chunk_num') &&
      value.chunk_num !== value.chunk_count) ||
    (Object.hasOwn(value, 'token_num') && value.token_num !== value.token_count)
  )
    return invalidParserResponse()
  return {
    ...normalizeDatasetDocument(value as DatasetDocumentDTO),
    enabled: value.status === '1',
  }
}

export function captureDocumentParserRequest(
  datasetId: string,
  docId: string,
  patch: DocumentParserPatch,
): DocumentParserRequest {
  if (
    typeof datasetId !== 'string' ||
    !datasetId ||
    typeof docId !== 'string' ||
    !docId ||
    !record(patch) ||
    Object.keys(patch).some(
      (key) => !['chunk_method', 'pipeline_id', 'parser_config'].includes(key),
    ) ||
    Object.values(patch).some(
      (value) => value === null || value === undefined,
    ) ||
    (Object.hasOwn(patch, 'chunk_method') &&
      (typeof patch.chunk_method !== 'string' || !patch.chunk_method)) ||
    (Object.hasOwn(patch, 'pipeline_id') &&
      (typeof patch.pipeline_id !== 'string' ||
        (patch.pipeline_id !== '' &&
          !/^[0-9a-f]{32}$/.test(patch.pipeline_id)))) ||
    (patch.pipeline_id && Object.hasOwn(patch, 'chunk_method')) ||
    (Object.hasOwn(patch, 'parser_config') && !record(patch.parser_config))
  )
    throw new APIError(
      400,
      'DOCUMENT_UPDATE_INVALID',
      'Invalid document parser request',
    )
  return Object.freeze({ datasetId, docId, patch: structuredClone(patch) })
}

export async function updateDocumentParser(
  request: DocumentParserRequest,
): Promise<Document> {
  const { datasetId, docId, patch } = captureDocumentParserRequest(
    request.datasetId,
    request.docId,
    request.patch,
  )
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    `/v1/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(docId)}`,
    patch,
    { ...knowledgeRestConfig, readResponse: readParserEnvelope },
  )
  if (response?.retcode !== 0 || response.retmsg !== 'success')
    return invalidParserResponse()
  return requireParserDocument(response.data, datasetId, docId)
}

/** The single-document REST path downloads bytes; JSON readback uses list-by-ID. */
export async function readDocumentParser(
  datasetId: string,
  docId: string,
): Promise<Document> {
  const response = await apiClient.get<ApiEnvelope<unknown>>(
    `/v1/datasets/${encodeURIComponent(datasetId)}/documents`,
    {
      ...knowledgeRestConfig,
      readResponse: readParserEnvelope,
      params: { id: docId },
    },
  )
  const data = response?.data
  if (
    response?.retcode !== 0 ||
    !record(data) ||
    !Array.isArray(data.docs) ||
    data.docs.length !== 1
  )
    return invalidParserResponse()
  return requireParserDocument(data.docs[0], datasetId, docId)
}

import { APIError } from '@/api/client'
import type { DocumentOperationRequest } from '@/api/knowledge-document-ingest'

export type DocumentOperationOutcome = {
  request: DocumentOperationRequest
  succeededIds: string[]
  failedIds: string[]
  complete: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Only bound HTTP-200 execution results can confirm individual submissions. */
export function getDocumentOperationOutcome(
  request: DocumentOperationRequest,
  accepted: boolean,
  error?: unknown,
): DocumentOperationOutcome {
  const results =
    error instanceof APIError &&
    error.status === 200 &&
    ['102', '500'].includes(error.code) &&
    isRecord(error.details) &&
    isRecord(error.details.results)
      ? error.details.results
      : undefined
  let succeededIds = request.docIds.filter((id) => {
    if (accepted) return true
    const row = results && Object.hasOwn(results, id) ? results[id] : undefined
    return (
      isRecord(row) &&
      !Object.hasOwn(row, 'error') &&
      Object.hasOwn(row, 'run') &&
      row.run === String(request.run)
    )
  })
  // A contradictory nonzero batch with no failed target is not a full ack.
  if (!accepted && succeededIds.length === request.docIds.length)
    succeededIds = []
  const failedIds = request.docIds.filter((id) => !succeededIds.includes(id))
  return {
    request,
    succeededIds,
    failedIds,
    complete: accepted && failedIds.length === 0,
  }
}

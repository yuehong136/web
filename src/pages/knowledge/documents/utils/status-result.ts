import type { DocumentStatusRequest } from '@/api/knowledge-document-status'

export type DocumentStatusOutcome = {
  succeededIds: string[]
  failedIds: string[]
  complete: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Count only requested IDs whose explicit status matches the requested target. */
export function getDocumentStatusOutcome(
  request: DocumentStatusRequest,
  response: unknown,
  accepted: boolean,
): DocumentStatusOutcome {
  const succeededIds: string[] = []
  const failedIds: string[] = []
  for (const id of new Set(request.docIds)) {
    const result =
      isRecord(response) && Object.hasOwn(response, id)
        ? response[id]
        : undefined
    if (
      isRecord(result) &&
      !Object.hasOwn(result, 'error') &&
      Object.hasOwn(result, 'status') &&
      result.status === String(request.status)
    ) {
      succeededIds.push(id)
    } else {
      failedIds.push(id)
    }
  }
  return {
    succeededIds,
    failedIds,
    complete: accepted && succeededIds.length > 0 && failedIds.length === 0,
  }
}

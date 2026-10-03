import { APIError } from '@/api/client'

export function parserErrorKey(error: unknown): string {
  const root = 'knowledge.documents.chunkMethodModal.'
  if (error instanceof APIError) {
    if (
      error.details?.outcome === 'unknown' ||
      error.code === 'DOCUMENT_READBACK_UNCONFIRMED' ||
      error.code === 'INVALID_DOCUMENT_RESPONSE'
    )
      return `${root}unconfirmed`
    if ([401, 403].includes(error.status)) return `${root}permissionError`
    if (error.status === 404) return `${root}unavailableError`
    if (error.status === 409) return `${root}conflictError`
    if ([400, 422].includes(error.status)) return `${root}configurationError`
  }
  return `${root}saveError`
}

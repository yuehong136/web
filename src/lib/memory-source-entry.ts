import { APIError } from '@/api/client'
/** Only failures proven to precede admission may release this submission identity. */
export function sourceEntryInputRejected(error: unknown): boolean {
  if (!(error instanceof APIError) || error.status !== 422) return false
  const details: unknown = error.details
  if (!details || typeof details !== 'object' || Array.isArray(details))
    return false
  if (
    'error_code' in details &&
    [
      'append_content_tokens_exceeded',
      'structured_source_bytes_exceeded',
    ].includes(String(details.error_code))
  )
    return true
  if (
    error.code !== 'HTTP_ERROR' ||
    !('detail' in details) ||
    !Array.isArray(details.detail) ||
    !details.detail.length
  )
    return false
  return details.detail.every(
    (value) =>
      value &&
      typeof value === 'object' &&
      'loc' in value &&
      Array.isArray(value.loc) &&
      value.loc[0] === 'body' &&
      'type' in value &&
      typeof value.type === 'string',
  )
}

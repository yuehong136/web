import { APIError, extractErrorMessage } from './client-types'

/** Keep stable server codes across JSON requests and streaming preflight. */
export function responseError(status: number, body: unknown, fallback: string) {
  const record =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  const code =
    typeof record.error_code === 'string' && record.error_code
      ? record.error_code
      : typeof record.retcode === 'number' || typeof record.code === 'number'
        ? String(record.retcode ?? record.code)
        : 'HTTP_ERROR'
  const message =
    typeof record.retmsg === 'string' && record.retmsg
      ? record.retmsg
      : extractErrorMessage(body) || fallback
  return new APIError(status, code, message, record.data)
}

export async function readResponseError(response: Response) {
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null)
  return responseError(
    response.status,
    body,
    `HTTP ${response.status}: ${response.statusText}`,
  )
}

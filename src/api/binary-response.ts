import type { RequestConfig } from './client-types'

/** A response from a superseded identity is an expected cancellation. */
const supersededResponses = new WeakSet<DOMException>()
const supersededResponse = () => {
  const error = new DOMException('Aborted', 'AbortError')
  supersededResponses.add(error)
  return error
}
export const isSupersededBinaryResponse = (error: unknown) =>
  error instanceof DOMException && supersededResponses.has(error)

/** Settles promptly even when a browser decoder cannot itself be interrupted. */
export function withBinaryAbort<T>(
  operation: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
    operation.then(
      (value) => {
        signal.removeEventListener('abort', abort)
        if (signal.aborted) reject(signal.reason)
        else resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
  })
}

export function readBinaryResponse(
  response: Response,
  signal: AbortSignal,
  reader: NonNullable<RequestConfig['readResponse']>,
  identity: {
    sentAuthorization?: string
    currentToken: string | null
    skipAuth: boolean
    onUnauthorized: () => void
  },
): Promise<unknown> {
  signal.throwIfAborted()
  if (
    !identity.skipAuth &&
    identity.sentAuthorization !==
      (identity.currentToken ? `Bearer ${identity.currentToken}` : undefined)
  )
    throw supersededResponse()
  if (response.status === 401) identity.onUnauthorized()
  return withBinaryAbort(reader(response, signal), signal)
}

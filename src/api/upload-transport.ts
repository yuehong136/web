import { APIError, extractErrorMessage, te } from './client-types'

interface ProgressUploadOptions {
  endpoint: string
  baseURL: string
  file: File
  token: string | null
  timeout: number
  signal?: AbortSignal
  onProgress?: (percent: number) => void
  onUnauthorized: () => void
}

/** Keep a deployment prefix while joining the explicit REST path exactly once. */
export function resolveUploadURL(baseURL: string, endpoint: string): string {
  const base = baseURL.replace(/\/+$/, '').replace(/\/api(?:\/v1)?$/, '')
  return `${base}/${endpoint.replace(/^\/+/, '')}`
}

/** XHR is needed for browser upload progress; APIClient owns auth and timeout. */
export function uploadWithProgress({
  endpoint,
  baseURL,
  file,
  token,
  timeout,
  signal,
  onProgress,
  onUnauthorized,
}: ProgressUploadOptions): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cancelled = () => new APIError(0, 'CANCELLED', te('unknown'))
    if (signal?.aborted) {
      reject(cancelled())
      return
    }

    const xhr = new XMLHttpRequest()
    let settled = false
    const cleanup = () => {
      signal?.removeEventListener('abort', abort)
      xhr.onload = xhr.onerror = xhr.ontimeout = xhr.onabort = null
      xhr.upload.onprogress = null
    }
    const finish = (error?: APIError, data?: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve(data)
    }
    const abort = () => {
      finish(cancelled())
      xhr.abort()
    }

    try {
      xhr.open('POST', resolveUploadURL(baseURL, endpoint))
      xhr.timeout = timeout
      if (token) {
        xhr.setRequestHeader(
          'Authorization',
          `Bearer ${token.replace(/^Bearer\s+/i, '')}`,
        )
      }
      xhr.upload.onprogress = (event) => {
        if (!settled && event.lengthComputable && event.total > 0) {
          onProgress?.(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          )
        }
      }
      xhr.onload = () => {
        if (settled) return
        if (xhr.status === 401) {
          onUnauthorized()
          finish(new APIError(401, 'UNAUTHORIZED', te('unauthorized')))
          return
        }
        let raw: unknown
        try {
          raw = JSON.parse(xhr.responseText)
        } catch {
          finish(
            new APIError(
              xhr.status,
              xhr.status >= 200 && xhr.status < 300
                ? 'INVALID_RESPONSE'
                : 'HTTP_ERROR',
              te('serverError'),
            ),
          )
          return
        }
        const envelope =
          typeof raw === 'object' && raw !== null && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : undefined
        // REST code takes precedence: a legacy retcode must not mask an error.
        const code = envelope?.code ?? envelope?.retcode
        if (
          xhr.status < 200 ||
          xhr.status >= 300 ||
          (code !== undefined && code !== 0)
        ) {
          finish(
            new APIError(
              xhr.status,
              code === undefined ? 'HTTP_ERROR' : String(code),
              extractErrorMessage(raw) ||
                (typeof envelope?.retmsg === 'string'
                  ? envelope.retmsg
                  : te('serverError')),
              envelope?.data,
            ),
          )
        } else if (!envelope || code !== 0) {
          finish(
            new APIError(xhr.status, 'INVALID_RESPONSE', te('serverError')),
          )
        } else {
          finish(undefined, envelope.data)
        }
      }
      xhr.onerror = () =>
        finish(new APIError(0, 'NETWORK_ERROR', te('network')))
      xhr.ontimeout = () => finish(new APIError(0, 'TIMEOUT', te('timeout')))
      xhr.onabort = () => finish(cancelled())
      signal?.addEventListener('abort', abort, { once: true })
      const body = new FormData()
      body.append('file', file)
      xhr.send(body)
    } catch {
      finish(new APIError(0, 'NETWORK_ERROR', te('network')))
    }
  })
}

import { EventSourceParserStream } from 'eventsource-parser/stream'
import { readResponseError } from '@/api/response-error'
import { APIError } from '@/api/client-types'

/**
 * Shared SSE transport (ARCH-1 phase 1).
 *
 * Owns only the Response → events half of a stream. The caller keeps owning
 * fetch and the AbortController lifecycle (CLAUDE.md streaming rule 2); pass
 * the same signal here so an abort also cancels the reader, which propagates
 * through the pipe chain and closes the connection.
 */

/** Shared preflight for stream responses and queued-task acknowledgements. */
export async function assertResponse(response: Response): Promise<void> {
  if (!response.ok) throw await readResponseError(response)
  if (response.headers.get('content-type')?.includes('application/json')) {
    const body: unknown = await response.clone().json()
    if (typeof body === 'object' && body !== null) {
      const record = body as Record<string, unknown>
      const code = record.retcode ?? record.code
      if (record.error_code || (code !== undefined && code !== 0))
        throw await readResponseError(response)
    }
  }
}

export async function assertSSEResponse(response: Response): Promise<void> {
  await assertResponse(response)
  if (response.headers.get('content-type')?.includes('application/json'))
    throw new APIError(
      response.status,
      'INVALID_STREAM',
      'Expected an event stream',
    )
  if (!response.body)
    throw new APIError(response.status, 'INVALID_STREAM', 'Missing stream body')
}

/**
 * Why the stream stopped being read. Neither reason says the run succeeded:
 * each caller judges completion from its own terminal frame, and an `eof`
 * without one is an unconfirmed result. A broken connection rejects instead.
 */
export type SSEStreamEndReason = 'eof' | 'aborted'

export interface SSEStreamEnd {
  reason: SSEStreamEndReason
}

export interface ReadSSEStreamOptions<T> {
  /**
   * Abort signal owned by the caller. Aborting cancels the reader immediately,
   * even while a read is pending, and resolves with `{ reason: 'aborted' }`.
   */
  signal?: AbortSignal
  onEvent: (event: T, rawData: string) => void
  /**
   * What to do with frames whose `data` is not valid JSON. Existing surfaces
   * disagree (most skip silently, mcp-agent-stream throws), so each migration
   * must pick its original behavior explicitly. Defaults to 'ignore'.
   */
  parseErrorMode?: 'ignore' | 'throw'
  /** Observation hook for skipped frames when parseErrorMode is 'ignore'. */
  onParseError?: (rawData: string, error: unknown) => void
}

export async function readSSEStream<T = unknown>(
  response: Response,
  options: ReadSSEStreamOptions<T>,
): Promise<SSEStreamEnd> {
  const { signal, onEvent, parseErrorMode = 'ignore', onParseError } = options

  if (!response.body) {
    throw new Error('流式接口没有返回可读的数据流')
  }

  if (signal?.aborted) {
    await response.body.cancel().catch(() => undefined)
    return { reason: 'aborted' }
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .getReader()

  // cancel() resolves the pending read() with done=true, so an abort takes
  // effect immediately instead of waiting for the next frame.
  const handleAbort = () => {
    void reader.cancel().catch(() => undefined)
  }
  signal?.addEventListener('abort', handleAbort, { once: true })

  try {
    while (true) {
      const { done, value } = await reader.read()
      // The caller's abort wins: cancel() is what ended the pending read.
      if (signal?.aborted) {
        return { reason: 'aborted' }
      }
      if (done) {
        return { reason: 'eof' }
      }

      const rawData = value?.data
      if (!rawData) {
        continue
      }

      let event: T
      try {
        event = JSON.parse(rawData) as T
      } catch (error) {
        if (parseErrorMode === 'throw') {
          throw error
        }
        onParseError?.(rawData, error)
        continue
      }

      onEvent(event, rawData)
    }
  } finally {
    signal?.removeEventListener('abort', handleAbort)
    reader.releaseLock()
  }
}

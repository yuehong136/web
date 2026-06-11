import { EventSourceParserStream } from 'eventsource-parser/stream'

/**
 * Shared SSE transport (ARCH-1 phase 1).
 *
 * Owns only the Response → events half of a stream. The caller keeps owning
 * fetch and the AbortController lifecycle (CLAUDE.md streaming rule 2); pass
 * the same signal here so an abort also cancels the reader, which propagates
 * through the pipe chain and closes the connection.
 */

export async function assertSSEResponse(response: Response): Promise<void> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorBody = (await response.clone().json()) as {
        message?: string
        retmsg?: string
      } | null
      errorMessage = errorBody?.message || errorBody?.retmsg || errorMessage
    } catch {
      // ignore non-json error bodies
    }

    throw new Error(errorMessage)
  }

  if (!response.body) {
    throw new Error('流式接口没有返回可读的数据流')
  }
}

export interface ReadSSEStreamOptions<T> {
  /**
   * Abort signal owned by the caller. Aborting cancels the reader immediately,
   * even while a read is pending, and resolves the returned promise normally.
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
): Promise<void> {
  const { signal, onEvent, parseErrorMode = 'ignore', onParseError } = options

  if (!response.body) {
    throw new Error('流式接口没有返回可读的数据流')
  }

  if (signal?.aborted) {
    await response.body.cancel().catch(() => undefined)
    return
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
      if (done || signal?.aborted) {
        break
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

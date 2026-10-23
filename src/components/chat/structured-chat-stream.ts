import {
  assertSSEResponse,
  consumeStructuredChatChunk,
  createInitialStructuredChatState,
  finalizeStructuredChatState,
  readSSEStream,
  type StructuredChatState,
  type StructuredStreamMessage,
} from '@/lib/streaming'
import { APIError } from '@/api/client-types'
import { openMCPChatStream } from '@/api/mcp-chat-service'

/**
 * Structured-chat SSE on the shared streaming runtime (ARCH-1 phase 3).
 *
 * Replaces EnhancedSSEParser.connect() for its two consumers (MCPChatPage,
 * ai-tools DataInput): same fetch shape (POST + Accept: text/event-stream +
 * localStorage auth token), malformed frames skipped without logging payloads. A
 * server-emitted terminal frame is required for success. EOF preserves the
 * partial result as interrupted; abort means only local reception stopped.
 * onState receives the final outcome even if an HTTP/transport error throws.
 */

interface StreamStructuredChatOptions {
  url: string
  requestBody: unknown
  signal?: AbortSignal
  onState?: (state: StructuredChatState) => void
  onMessage: (
    message: StructuredStreamMessage,
    state: StructuredChatState,
  ) => void
}

export const streamStructuredChat = async ({
  url,
  requestBody,
  signal,
  onState,
  onMessage,
}: StreamStructuredChatOptions): Promise<StructuredChatState> => {
  let state = createInitialStructuredChatState()
  const publish = (next: StructuredChatState) => {
    if (next === state) return
    state = next
    onState?.(state)
  }
  if (signal?.aborted) {
    publish(finalizeStructuredChatState(state, 'aborted'))
    return state
  }
  try {
    const response = await openMCPChatStream(requestBody, { url, signal })

    await assertSSEResponse(response)

    const end = await readSSEStream(response, {
      signal,
      parseErrorMode: 'ignore',
      onEvent: (event) => {
        const { nextState, message } = consumeStructuredChatChunk(state, event)
        publish(nextState)
        if (message) {
          onMessage(message, state)
        }
      },
    })

    publish(finalizeStructuredChatState(state, end.reason))
    return state
  } catch (error) {
    if (signal?.aborted) {
      publish(finalizeStructuredChatState(state, 'aborted'))
      return state
    }
    publish(
      error instanceof APIError && state.phase === 'running'
        ? { ...state, phase: 'failed', isToolAnalyzing: false }
        : finalizeStructuredChatState(state, 'error'),
    )
    throw error
  }
}

import {
  assertSSEResponse,
  consumeStructuredChatChunk,
  createInitialStructuredChatState,
  createSyntheticCompleteMessage,
  readSSEStream,
  type StructuredChatState,
  type StructuredStreamMessage,
} from '@/lib/streaming'

/**
 * Structured-chat SSE on the shared streaming runtime (ARCH-1 phase 3).
 *
 * Replaces EnhancedSSEParser.connect() for its two consumers (MCPChatPage,
 * ai-tools DataInput): same fetch shape (POST + Accept: text/event-stream +
 * localStorage auth token), parse failures logged and skipped, and a
 * synthetic complete frame when the stream ends without a server-emitted
 * one. Unlike connect(), errors propagate to the caller — each caller owns
 * its original error boundary (AbortError silencing, toasts).
 *
 * The signal stays on fetch and is NOT passed to readSSEStream: an abort
 * surfaces as an AbortError from the body stream, matching connect()'s
 * control flow (the synthetic complete is skipped on abort for free).
 */

interface StreamStructuredChatOptions {
  url: string
  requestBody: unknown
  signal?: AbortSignal
  onMessage: (
    message: StructuredStreamMessage,
    state: StructuredChatState,
  ) => void
}

export const streamStructuredChat = async ({
  url,
  requestBody,
  signal,
  onMessage,
}: StreamStructuredChatOptions): Promise<void> => {
  const token = localStorage.getItem('auth_token')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(requestBody),
    signal,
  })

  await assertSSEResponse(response)

  let state = createInitialStructuredChatState()

  await readSSEStream(response, {
    onParseError: (_rawData, error) => {
      console.error('Failed to parse SSE message:', error)
    },
    onEvent: (event) => {
      const { nextState, message } = consumeStructuredChatChunk(state, event)
      state = nextState
      if (message) {
        onMessage(message, state)
      }
    },
  })

  const syntheticComplete = createSyntheticCompleteMessage(state)
  if (syntheticComplete) {
    onMessage(syntheticComplete, state)
  }
}
